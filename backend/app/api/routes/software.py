from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.software import (
    SoftwareLicenseAssignRequest,
    SoftwareLicenseAssignmentResponse,
    SoftwareLicenseCreateRequest,
    SoftwareLicenseDetailResponse,
    SoftwareLicenseListResponse,
    SoftwareLicenseRevokeRequest,
    SoftwareLicenseUpdateRequest,
)
from app.security.deps import require_roles
from app.services.software import SoftwareLicenseService

router = APIRouter()


@router.get("", response_model=SoftwareLicenseListResponse)
def list_licenses(
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN", "ASSET_MANAGER", "OPERATOR", "VIEWER")),
    search: str | None = Query(default=None),
) -> SoftwareLicenseListResponse:
    return SoftwareLicenseService(db).list_licenses(search=search)


@router.post("", response_model=SoftwareLicenseDetailResponse)
def create_license(
    payload: SoftwareLicenseCreateRequest,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN", "ASSET_MANAGER", "OPERATOR")),
) -> SoftwareLicenseDetailResponse:
    return SoftwareLicenseService(db).create_license(payload, current_user.id)


@router.get("/{license_id}", response_model=SoftwareLicenseDetailResponse)
def get_license(
    license_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN", "ASSET_MANAGER", "OPERATOR", "VIEWER")),
) -> SoftwareLicenseDetailResponse:
    return SoftwareLicenseService(db).get_license(license_id)


@router.put("/{license_id}", response_model=SoftwareLicenseDetailResponse)
def update_license(
    license_id: int,
    payload: SoftwareLicenseUpdateRequest,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN", "ASSET_MANAGER", "OPERATOR")),
) -> SoftwareLicenseDetailResponse:
    return SoftwareLicenseService(db).update_license(license_id, payload, current_user.id)


@router.post("/{license_id}/assign", response_model=SoftwareLicenseAssignmentResponse)
def assign_license(
    license_id: int,
    payload: SoftwareLicenseAssignRequest,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN", "ASSET_MANAGER", "OPERATOR")),
) -> SoftwareLicenseAssignmentResponse:
    return SoftwareLicenseService(db).assign_license(license_id, payload, current_user.id)


@router.post("/assignments/{assignment_id}/revoke", response_model=SoftwareLicenseAssignmentResponse)
def revoke_license_assignment(
    assignment_id: int,
    payload: SoftwareLicenseRevokeRequest,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN", "ASSET_MANAGER", "OPERATOR")),
) -> SoftwareLicenseAssignmentResponse:
    return SoftwareLicenseService(db).revoke_assignment(assignment_id, payload, current_user.id)
