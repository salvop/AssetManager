from pathlib import Path
from uuid import uuid4

from fastapi import HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.asset import AssetDocument
from app.repositories.asset import AssetRepository
from app.repositories.user import UserRepository
from app.schemas.asset import AssetDocumentResponse
from app.services.helpers import document_response, require_resource

ALLOWED_CONTENT_TYPES = {"application/pdf", "image/png", "image/jpeg", "text/plain"}
MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024


class DocumentService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repository = AssetRepository(db)
        self.user_repository = UserRepository(db)
        self.storage_root = Path(settings.document_storage_path)
        self.storage_root.mkdir(parents=True, exist_ok=True)

    def list_documents(self, asset_id: int) -> list[AssetDocumentResponse]:
        require_resource(self.repository.get_by_id(asset_id), "Asset not found")
        return [self._build_response(document) for document in self.repository.list_documents(asset_id)]

    async def upload_document(
        self,
        *,
        asset_id: int,
        file: UploadFile,
        current_user_id: int,
    ) -> AssetDocumentResponse:
        require_resource(self.repository.get_by_id(asset_id), "Asset not found")
        if file.content_type not in ALLOWED_CONTENT_TYPES:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="File type not allowed")

        content = await file.read()
        if len(content) > MAX_FILE_SIZE_BYTES:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="File too large")

        extension = Path(file.filename or "upload.bin").suffix
        stored_name = f"{uuid4().hex}{extension}"
        target = self.storage_root / stored_name
        target.write_bytes(content)

        document = AssetDocument(
            asset_id=asset_id,
            uploaded_by_user_id=current_user_id,
            file_name=file.filename or stored_name,
            stored_name=stored_name,
            content_type=file.content_type or "application/octet-stream",
            size_bytes=len(content),
        )
        self.repository.add_document(document)
        self.db.commit()
        return self._build_response(document)

    def delete_document(self, document_id: int) -> None:
        document = require_resource(self.repository.get_document(document_id), "Document not found")
        target = self.storage_root / document.stored_name
        if target.exists():
            target.unlink()
        self.repository.delete_document(document)
        self.db.commit()

    def get_download(self, document_id: int) -> tuple[AssetDocument, Path]:
        document = require_resource(self.repository.get_document(document_id), "Document not found")
        target = self.storage_root / document.stored_name
        if not target.exists():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Stored file not found")
        return document, target

    def _build_response(self, document: AssetDocument) -> AssetDocumentResponse:
        user = self.user_repository.get_by_id(document.uploaded_by_user_id) if document.uploaded_by_user_id else None
        return document_response(document, user)
