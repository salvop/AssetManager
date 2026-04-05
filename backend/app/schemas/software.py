from datetime import date, datetime

from pydantic import BaseModel

from app.schemas.asset import AssetReferenceResponse, UserReferenceResponse


class SoftwareLicenseListItemResponse(BaseModel):
    id: int
    product_name: str
    license_type: str
    purchased_quantity: int
    active_assignments: int
    available_quantity: int
    expiry_date: date | None
    vendor: AssetReferenceResponse | None


class SoftwareLicenseListSummaryResponse(BaseModel):
    total_licenses: int
    active_assignments: int
    available_quantity: int
    expiring_licenses: int


class SoftwareLicenseListResponse(BaseModel):
    items: list[SoftwareLicenseListItemResponse]
    total: int
    page: int
    page_size: int
    summary: SoftwareLicenseListSummaryResponse


class SoftwareLicenseCreateRequest(BaseModel):
    product_name: str
    vendor_id: int | None = None
    license_type: str
    purchased_quantity: int
    purchase_date: date | None = None
    expiry_date: date | None = None
    renewal_alert_days: int = 30
    notes: str | None = None


class SoftwareLicenseUpdateRequest(BaseModel):
    product_name: str
    vendor_id: int | None = None
    license_type: str
    purchased_quantity: int
    purchase_date: date | None = None
    expiry_date: date | None = None
    renewal_alert_days: int = 30
    notes: str | None = None


class SoftwareLicenseAssignRequest(BaseModel):
    user_id: int | None = None
    asset_id: int | None = None
    notes: str | None = None


class SoftwareLicenseRevokeRequest(BaseModel):
    notes: str | None = None


class SoftwareLicenseAssignmentResponse(BaseModel):
    id: int
    software_license_id: int
    user: UserReferenceResponse | None
    asset: AssetReferenceResponse | None
    assigned_by_user: UserReferenceResponse
    assigned_at: datetime
    revoked_at: datetime | None
    notes: str | None


class SoftwareLicenseEventResponse(BaseModel):
    id: int
    event_type: str
    summary: str
    created_at: datetime
    performed_by_user: UserReferenceResponse | None
    details: dict | None


class SoftwareLicenseDetailResponse(BaseModel):
    id: int
    product_name: str
    license_type: str
    purchased_quantity: int
    active_assignments: int
    available_quantity: int
    purchase_date: date | None
    expiry_date: date | None
    renewal_alert_days: int
    notes: str | None
    vendor: AssetReferenceResponse | None
    assignments: list[SoftwareLicenseAssignmentResponse]
    events: list[SoftwareLicenseEventResponse]
