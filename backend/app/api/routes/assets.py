from fastapi import APIRouter, Depends, File, Query, UploadFile
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.asset import (
    AssetAssignRequest,
    AssetAssignmentResponse,
    AssetCreateRequest,
    AssetDetailResponse,
    AssetDocumentResponse,
    AssetEventResponse,
    AssetListResponse,
    AssetLocationChangeRequest,
    AssetReturnRequest,
    AssetStatusChangeRequest,
    AssetUpdateRequest,
)
from app.security.deps import require_roles
from app.services.asset import AssetService
from app.services.assignment import AssignmentService
from app.services.documents import DocumentService

router = APIRouter()


@router.get("/export/csv")
def export_assets_csv(
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN", "ASSET_MANAGER", "OPERATOR", "VIEWER")),
    search: str | None = Query(default=None),
    status_id: int | None = Query(default=None),
    category_id: int | None = Query(default=None),
    model_id: int | None = Query(default=None),
    location_id: int | None = Query(default=None),
    department_id: int | None = Query(default=None),
    assigned_employee_id: int | None = Query(default=None),
    vendor_id: int | None = Query(default=None),
    sort_by: str = Query(default="asset_tag"),
    sort_dir: str = Query(default="asc"),
) -> Response:
    filename, content = AssetService(db).export_assets_csv(
        search=search,
        status_id=status_id,
        category_id=category_id,
        model_id=model_id,
        location_id=location_id,
        department_id=department_id,
        assigned_employee_id=assigned_employee_id,
        vendor_id=vendor_id,
        sort_by=sort_by,
        sort_dir=sort_dir,
    )
    return Response(
        content=content,
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/export/xlsx")
def export_assets_xlsx(
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN", "ASSET_MANAGER", "OPERATOR", "VIEWER")),
    search: str | None = Query(default=None),
    status_id: int | None = Query(default=None),
    category_id: int | None = Query(default=None),
    model_id: int | None = Query(default=None),
    location_id: int | None = Query(default=None),
    department_id: int | None = Query(default=None),
    assigned_employee_id: int | None = Query(default=None),
    vendor_id: int | None = Query(default=None),
    sort_by: str = Query(default="asset_tag"),
    sort_dir: str = Query(default="asc"),
) -> Response:
    filename, content = AssetService(db).export_assets_xlsx(
        search=search,
        status_id=status_id,
        category_id=category_id,
        model_id=model_id,
        location_id=location_id,
        department_id=department_id,
        assigned_employee_id=assigned_employee_id,
        vendor_id=vendor_id,
        sort_by=sort_by,
        sort_dir=sort_dir,
    )
    return Response(
        content=content,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("", response_model=AssetListResponse)
def list_assets(
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN", "ASSET_MANAGER", "OPERATOR", "VIEWER")),
    search: str | None = Query(default=None),
    status_id: int | None = Query(default=None),
    category_id: int | None = Query(default=None),
    model_id: int | None = Query(default=None),
    location_id: int | None = Query(default=None),
    department_id: int | None = Query(default=None),
    assigned_employee_id: int | None = Query(default=None),
    vendor_id: int | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    sort_by: str = Query(default="asset_tag"),
    sort_dir: str = Query(default="asc"),
) -> AssetListResponse:
    return AssetService(db).list_assets(
        search=search,
        status_id=status_id,
        category_id=category_id,
        model_id=model_id,
        location_id=location_id,
        department_id=department_id,
        assigned_employee_id=assigned_employee_id,
        vendor_id=vendor_id,
        page=page,
        page_size=page_size,
        sort_by=sort_by,
        sort_dir=sort_dir,
    )


@router.post("", response_model=AssetDetailResponse)
def create_asset(
    payload: AssetCreateRequest,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN", "ASSET_MANAGER", "OPERATOR")),
) -> AssetDetailResponse:
    return AssetService(db).create_asset(payload, current_user.id)


@router.get("/{asset_id}", response_model=AssetDetailResponse)
def get_asset(
    asset_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN", "ASSET_MANAGER", "OPERATOR", "VIEWER")),
) -> AssetDetailResponse:
    return AssetService(db).get_asset(asset_id)


@router.put("/{asset_id}", response_model=AssetDetailResponse)
def update_asset(
    asset_id: int,
    payload: AssetUpdateRequest,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN", "ASSET_MANAGER", "OPERATOR")),
) -> AssetDetailResponse:
    return AssetService(db).update_asset(asset_id, payload, current_user.id)


@router.patch("/{asset_id}/status", response_model=AssetDetailResponse)
def change_status(
    asset_id: int,
    payload: AssetStatusChangeRequest,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN", "ASSET_MANAGER", "OPERATOR")),
) -> AssetDetailResponse:
    return AssetService(db).change_status(asset_id, payload, current_user.id)


@router.patch("/{asset_id}/location", response_model=AssetDetailResponse)
def change_location(
    asset_id: int,
    payload: AssetLocationChangeRequest,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN", "ASSET_MANAGER", "OPERATOR")),
) -> AssetDetailResponse:
    return AssetService(db).change_location(asset_id, payload, current_user.id)


@router.post("/{asset_id}/assign", response_model=AssetAssignmentResponse)
def assign_asset(
    asset_id: int,
    payload: AssetAssignRequest,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN", "ASSET_MANAGER", "OPERATOR")),
) -> AssetAssignmentResponse:
    return AssignmentService(db).assign_asset(asset_id=asset_id, payload=payload, current_user_id=current_user.id)


@router.post("/{asset_id}/return", response_model=AssetAssignmentResponse)
def return_asset(
    asset_id: int,
    payload: AssetReturnRequest,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN", "ASSET_MANAGER", "OPERATOR")),
) -> AssetAssignmentResponse:
    return AssignmentService(db).return_asset(asset_id=asset_id, payload=payload, current_user_id=current_user.id)


@router.get("/{asset_id}/assignments", response_model=list[AssetAssignmentResponse])
def list_assignments(
    asset_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN", "ASSET_MANAGER", "OPERATOR", "VIEWER")),
) -> list[AssetAssignmentResponse]:
    return AssignmentService(db).list_assignments(asset_id)


@router.get("/{asset_id}/events", response_model=list[AssetEventResponse])
def list_events(
    asset_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN", "ASSET_MANAGER", "OPERATOR", "VIEWER")),
) -> list[AssetEventResponse]:
    return AssetService(db).list_events(asset_id)


@router.get("/{asset_id}/documents", response_model=list[AssetDocumentResponse])
def list_documents(
    asset_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN", "ASSET_MANAGER", "OPERATOR", "VIEWER")),
) -> list[AssetDocumentResponse]:
    return DocumentService(db).list_documents(asset_id)


@router.post("/{asset_id}/documents", response_model=AssetDocumentResponse)
async def upload_document(
    asset_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN", "ASSET_MANAGER", "OPERATOR")),
) -> AssetDocumentResponse:
    return await DocumentService(db).upload_document(asset_id=asset_id, file=file, current_user_id=current_user.id)
