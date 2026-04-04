from fastapi import APIRouter, Depends, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.security.deps import require_roles
from app.services.documents import DocumentService

router = APIRouter()


@router.get("/{document_id}/download")
def download_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN", "ASSET_MANAGER", "OPERATOR", "VIEWER")),
) -> FileResponse:
    document, target = DocumentService(db).get_download(document_id)
    return FileResponse(path=target, media_type=document.content_type, filename=document.file_name)


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN", "ASSET_MANAGER", "OPERATOR")),
) -> None:
    DocumentService(db).delete_document(document_id)
