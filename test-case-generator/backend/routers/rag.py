import logging
import tempfile
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from database.db import get_db
from model.document import Document
from model.schemas import UserResponse
from util.protectedRoute import get_current_user

ragRouter = APIRouter()
logger = logging.getLogger(__name__)

# Per-user RAG sessions (in-memory). SessionRAG imported lazily when first used.
_rag_sessions: dict = {}


def _get_or_create_rag(user_id: int):
    from services.ragServices import SessionRAG
    key = str(user_id)
    if key not in _rag_sessions:
        _rag_sessions[key] = SessionRAG(session_id=key)
    return _rag_sessions[key]


class ProcessRagRequest(BaseModel):
    document_id: int


@ragRouter.post("/process")
def process_rag(
    body: ProcessRagRequest,
    session: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user),
):
    """Run RAG pipeline on an uploaded document (PDF). Returns summary, impact, and test cases."""
    doc = session.query(Document).filter(Document.id == body.document_id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    if doc.user_id is not None and doc.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your document")

    display_name = doc.file_name or "document.pdf"
    if not display_name.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="RAG supports PDF only",
        )

    # Use file content from DB, or legacy file_path on disk
    try:
        if doc.file_content:
            with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
                tmp.write(doc.file_content)
                file_path = tmp.name
            try:
                from services.ragServices import process_document
                rag = _get_or_create_rag(current_user.id)
                result = process_document(rag, file_path, display_name)
                return result
            finally:
                Path(file_path).unlink(missing_ok=True)
        elif doc.file_path and Path(doc.file_path).is_file():
            from services.ragServices import process_document
            rag = _get_or_create_rag(current_user.id)
            return process_document(rag, doc.file_path, display_name)
        else:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Document has no file content or path")
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("RAG processing failed for document_id=%s user_id=%s", body.document_id, current_user.id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"{type(e).__name__}: {e}",
        )
