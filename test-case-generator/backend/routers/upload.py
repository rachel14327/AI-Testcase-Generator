from fastapi import APIRouter, Depends, File, HTTPException, status
from fastapi.datastructures import UploadFile
from database.db import get_db
from model.document import Document
from model.schemas import UserResponse
from sqlalchemy.orm import Session
from services.documentService import documentService
from util.protectedRoute import get_current_user

uploadRouter = APIRouter()


@uploadRouter.post("/upload")
def upload_file(
    file: UploadFile = File(...),
    session: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user),
):
    try:
        document_uploaded = documentService(session=session).upload_file(
            file=file, user_id=current_user.id
        )
        if not document_uploaded:
            raise HTTPException(status_code=400, detail="Failed to upload file")
        return document_uploaded
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=str(e))


@uploadRouter.get("/documents")
def list_documents(
    session: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user),
):
    """List documents for the current user (for RAG / test case generation)."""
    docs = (
        session.query(Document)
        .filter(Document.user_id == current_user.id)
        .order_by(Document.uploaded_at.desc())
        .all()
    )
    return [
        {
            "id": d.id,
            "file_name": d.file_name,
            "file_path": d.file_path,
            "uploaded_at": d.uploaded_at.isoformat() if d.uploaded_at else None,
        }
        for d in docs
    ]


@uploadRouter.delete("/documents/{document_id}")
def delete_document(
    document_id: int,
    session: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user),
):
    """Delete an uploaded document (and its file) for the current user."""
    documentService(session=session).delete_document(document_id=document_id, user_id=current_user.id)
    return {"ok": True}