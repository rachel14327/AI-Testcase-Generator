import os
from pathlib import Path
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
        upload_dir = Path(__file__).resolve().parent.parent / "uploads"
        upload_dir.mkdir(parents=True, exist_ok=True)

        safe_name = os.path.basename(file.filename or "upload.bin")
        file_path = upload_dir / safe_name

        with open(file_path, "wb") as out:
            out.write(file.file.read())

        doc = Document(
            user_id=user_id,
            feature_name=feature_name,
            file_name=safe_name,
            file_path=str(file_path),
        )
        self.session.add(doc)
        self.session.commit()
        self.session.refresh(doc)
        return doc

    def delete_document(self, document_id: int, user_id: int) -> None:
        """Delete a document by id if it belongs to the given user. Removes DB record and file from disk."""
        doc = self.session.query(Document).filter(
            Document.id == document_id,
            Document.user_id == user_id,
        ).first()
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found")
        file_path = doc.file_path
        self.session.delete(doc)
        self.session.commit()
        if file_path:
            path = Path(file_path)
            if path.is_file():
                try:
                    path.unlink()
                except OSError:
                    pass

