from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.request import (
    AssetRequestApproveRequest,
    AssetRequestCreateRequest,
    AssetRequestListResponse,
    AssetRequestResponse,
)
from app.security.deps import require_roles
from app.services.request import AssetRequestService

router = APIRouter()


@router.get("", response_model=AssetRequestListResponse)
def list_asset_requests(
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN", "ASSET_MANAGER", "OPERATOR", "VIEWER")),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> AssetRequestListResponse:
    return AssetRequestService(db).list_requests(page=page, page_size=page_size)


@router.post("", response_model=AssetRequestResponse)
def create_asset_request(
    payload: AssetRequestCreateRequest,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN", "ASSET_MANAGER", "OPERATOR")),
) -> AssetRequestResponse:
    return AssetRequestService(db).create_request(payload, current_user.id)


@router.post("/{request_id}/approve", response_model=AssetRequestResponse)
def approve_asset_request(
    request_id: int,
    payload: AssetRequestApproveRequest,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN", "ASSET_MANAGER")),
) -> AssetRequestResponse:
    return AssetRequestService(db).approve_request(request_id=request_id, payload=payload, current_user_id=current_user.id)
