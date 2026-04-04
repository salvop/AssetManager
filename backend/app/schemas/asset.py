from datetime import date, datetime

from pydantic import BaseModel, ConfigDict


class AssetReferenceResponse(BaseModel):
    id: int
    name: str
    code: str | None = None


class UserReferenceResponse(BaseModel):
    id: int
    username: str
    full_name: str


class AssetListItemResponse(BaseModel):
    id: int
    asset_tag: str
    name: str
    serial_number: str | None
    status: AssetReferenceResponse
    category: AssetReferenceResponse
    location: AssetReferenceResponse | None
    assigned_user: UserReferenceResponse | None
    purchase_date: date | None


class AssetListResponse(BaseModel):
    items: list[AssetListItemResponse]
    total: int
    page: int
    page_size: int


class AssetCreateRequest(BaseModel):
    asset_tag: str
    name: str
    category_id: int
    status_id: int
    serial_number: str | None = None
    model_id: int | None = None
    location_id: int | None = None
    vendor_id: int | None = None
    current_department_id: int | None = None
    description: str | None = None
    purchase_date: date | None = None


class AssetUpdateRequest(BaseModel):
    name: str
    category_id: int
    status_id: int
    serial_number: str | None = None
    model_id: int | None = None
    location_id: int | None = None
    vendor_id: int | None = None
    current_department_id: int | None = None
    description: str | None = None
    purchase_date: date | None = None


class AssetStatusChangeRequest(BaseModel):
    status_id: int
    notes: str | None = None


class AssetLocationChangeRequest(BaseModel):
    location_id: int | None = None
    notes: str | None = None


class AssetAssignRequest(BaseModel):
    user_id: int
    department_id: int | None = None
    location_id: int | None = None
    expected_return_at: datetime | None = None
    notes: str | None = None


class AssetReturnRequest(BaseModel):
    notes: str | None = None


class AssetAssignmentResponse(BaseModel):
    id: int
    asset_id: int
    user: UserReferenceResponse
    assigned_by_user: UserReferenceResponse
    department: AssetReferenceResponse | None
    location: AssetReferenceResponse | None
    assigned_at: datetime
    expected_return_at: datetime | None
    returned_at: datetime | None
    notes: str | None


class AssetEventResponse(BaseModel):
    id: int
    event_type: str
    summary: str
    created_at: datetime
    performed_by_user: UserReferenceResponse | None
    details: dict | None


class AssetDocumentResponse(BaseModel):
    id: int
    asset_id: int
    file_name: str
    content_type: str
    size_bytes: int
    created_at: datetime
    uploaded_by_user: UserReferenceResponse | None


class AssetDetailResponse(BaseModel):
    id: int
    asset_tag: str
    name: str
    serial_number: str | None
    description: str | None
    purchase_date: date | None
    category: AssetReferenceResponse
    model: AssetReferenceResponse | None
    status: AssetReferenceResponse
    location: AssetReferenceResponse | None
    vendor: AssetReferenceResponse | None
    current_department: AssetReferenceResponse | None
    assigned_user: UserReferenceResponse | None
    assignments: list[AssetAssignmentResponse]
    events: list[AssetEventResponse]
    documents: list[AssetDocumentResponse]
