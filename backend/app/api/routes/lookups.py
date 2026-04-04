from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.security.deps import require_roles
from app.schemas.lookup import (
    AssetModelCreateRequest,
    AssetModelUpdateRequest,
    LookupCreateRequest,
    LookupItemResponse,
    LookupListResponse,
    LookupUpdateRequest,
    VendorCreateRequest,
    VendorUpdateRequest,
)
from app.services.lookup import LookupService

router = APIRouter()


@router.get("/departments", response_model=LookupListResponse)
def list_departments(
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN", "ASSET_MANAGER", "OPERATOR", "VIEWER")),
) -> LookupListResponse:
    return LookupService(db).list_departments()


@router.post("/departments", response_model=LookupItemResponse)
def create_department(
    payload: LookupCreateRequest,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN", "ASSET_MANAGER")),
) -> LookupItemResponse:
    return LookupService(db).create_department(payload)


@router.put("/departments/{department_id}", response_model=LookupItemResponse)
def update_department(
    department_id: int,
    payload: LookupUpdateRequest,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN", "ASSET_MANAGER")),
) -> LookupItemResponse:
    return LookupService(db).update_department(department_id, payload)


@router.delete("/departments/{department_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_department(
    department_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN", "ASSET_MANAGER")),
) -> Response:
    LookupService(db).delete_department(department_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/locations", response_model=LookupListResponse)
def list_locations(
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN", "ASSET_MANAGER", "OPERATOR", "VIEWER")),
) -> LookupListResponse:
    return LookupService(db).list_locations()


@router.post("/locations", response_model=LookupItemResponse)
def create_location(
    payload: LookupCreateRequest,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN", "ASSET_MANAGER")),
) -> LookupItemResponse:
    return LookupService(db).create_location(payload)


@router.put("/locations/{location_id}", response_model=LookupItemResponse)
def update_location(
    location_id: int,
    payload: LookupUpdateRequest,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN", "ASSET_MANAGER")),
) -> LookupItemResponse:
    return LookupService(db).update_location(location_id, payload)


@router.delete("/locations/{location_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_location(
    location_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN", "ASSET_MANAGER")),
) -> Response:
    LookupService(db).delete_location(location_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/vendors", response_model=LookupListResponse)
def list_vendors(
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN", "ASSET_MANAGER", "OPERATOR", "VIEWER")),
) -> LookupListResponse:
    return LookupService(db).list_vendors()


@router.post("/vendors", response_model=LookupItemResponse)
def create_vendor(
    payload: VendorCreateRequest,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN", "ASSET_MANAGER")),
) -> LookupItemResponse:
    return LookupService(db).create_vendor(payload)


@router.put("/vendors/{vendor_id}", response_model=LookupItemResponse)
def update_vendor(
    vendor_id: int,
    payload: VendorUpdateRequest,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN", "ASSET_MANAGER")),
) -> LookupItemResponse:
    return LookupService(db).update_vendor(vendor_id, payload)


@router.delete("/vendors/{vendor_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_vendor(
    vendor_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN", "ASSET_MANAGER")),
) -> Response:
    LookupService(db).delete_vendor(vendor_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/asset-categories", response_model=LookupListResponse)
def list_asset_categories(
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN", "ASSET_MANAGER", "OPERATOR", "VIEWER")),
) -> LookupListResponse:
    return LookupService(db).list_asset_categories()


@router.post("/asset-categories", response_model=LookupItemResponse)
def create_asset_category(
    payload: LookupCreateRequest,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN", "ASSET_MANAGER")),
) -> LookupItemResponse:
    return LookupService(db).create_asset_category(payload)


@router.put("/asset-categories/{category_id}", response_model=LookupItemResponse)
def update_asset_category(
    category_id: int,
    payload: LookupUpdateRequest,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN", "ASSET_MANAGER")),
) -> LookupItemResponse:
    return LookupService(db).update_asset_category(category_id, payload)


@router.delete("/asset-categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_asset_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN", "ASSET_MANAGER")),
) -> Response:
    LookupService(db).delete_asset_category(category_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/asset-statuses", response_model=LookupListResponse)
def list_asset_statuses(
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN", "ASSET_MANAGER", "OPERATOR", "VIEWER")),
) -> LookupListResponse:
    return LookupService(db).list_asset_statuses()


@router.get("/asset-models", response_model=LookupListResponse)
def list_asset_models(
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN", "ASSET_MANAGER", "OPERATOR", "VIEWER")),
) -> LookupListResponse:
    return LookupService(db).list_asset_models()


@router.post("/asset-models", response_model=LookupItemResponse)
def create_asset_model(
    payload: AssetModelCreateRequest,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN", "ASSET_MANAGER")),
) -> LookupItemResponse:
    return LookupService(db).create_asset_model(payload)


@router.put("/asset-models/{model_id}", response_model=LookupItemResponse)
def update_asset_model(
    model_id: int,
    payload: AssetModelUpdateRequest,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN", "ASSET_MANAGER")),
) -> LookupItemResponse:
    return LookupService(db).update_asset_model(model_id, payload)


@router.delete("/asset-models/{model_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_asset_model(
    model_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN", "ASSET_MANAGER")),
) -> Response:
    LookupService(db).delete_asset_model(model_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
