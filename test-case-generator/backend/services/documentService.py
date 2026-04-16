import os
from typing import Optional
from fastapi import HTTPException, UploadFile
from sqlalchemy.orm import Session
from model.document import Document
from model.schemas import DocumentResponse


class documentService(object):
    def __init__(self, session: Session):
        self.session = session

    def upload_file(
        self,
        file: UploadFile,
        *,
        user_id: Optional[int] = None,
        feature_name: Optional[str] = None,
    ) -> DocumentResponse:
        """Store uploaded file in the database (documents.file_content), not on disk."""
        safe_name = os.path.basename(file.filename or "upload.bin")
        content = file.file.read()

        doc = Document( 
            user_id=user_id,
            feature_name=feature_name,
            file_name=safe_name,
            file_path=None,
            file_content=content,
        ) 
        self.session.add(doc)
        self.session.commit()
        self.session.refresh(doc)
        return doc

    def delete_document(self, document_id: int, user_id: int) -> None:
        """Delete a document by id if it belongs to the given user. Removes DB record only (file in DB)."""
        doc = self.session.query(Document).filter(
            Document.id == document_id,
            Document.user_id == user_id,
        ).first()
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found")
        self.session.delete(doc)
        self.session.commit()

