from datetime import date, datetime

from pydantic import BaseModel

from app.schemas.employee import EmployeeReferenceResponse


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
    asset_type: str | None
    brand: str | None
    status: AssetReferenceResponse
    category: AssetReferenceResponse
    location: AssetReferenceResponse | None
    assigned_employee: EmployeeReferenceResponse | None
    purchase_date: date | None
    warranty_expiry_date: date | None
    expected_end_of_life_date: date | None
    cost_center: str | None
    location_floor: str | None
    location_room: str | None
    location_rack: str | None
    location_slot: str | None


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
    asset_type: str | None = None
    brand: str | None = None
    model_id: int | None = None
    location_id: int | None = None
    vendor_id: int | None = None
    current_department_id: int | None = None
    description: str | None = None
    purchase_date: date | None = None
    warranty_expiry_date: date | None = None
    expected_end_of_life_date: date | None = None
    disposal_date: date | None = None
    cost_center: str | None = None
    location_floor: str | None = None
    location_room: str | None = None
    location_rack: str | None = None
    location_slot: str | None = None


class AssetUpdateRequest(BaseModel):
    name: str
    category_id: int
    status_id: int
    serial_number: str | None = None
    asset_type: str | None = None
    brand: str | None = None
    model_id: int | None = None
    location_id: int | None = None
    vendor_id: int | None = None
    current_department_id: int | None = None
    description: str | None = None
    purchase_date: date | None = None
    warranty_expiry_date: date | None = None
    expected_end_of_life_date: date | None = None
    disposal_date: date | None = None
    cost_center: str | None = None
    location_floor: str | None = None
    location_room: str | None = None
    location_rack: str | None = None
    location_slot: str | None = None


class AssetStatusChangeRequest(BaseModel):
    status_id: int
    notes: str | None = None


class AssetLocationChangeRequest(BaseModel):
    location_id: int | None = None
    notes: str | None = None


class AssetAssignRequest(BaseModel):
    employee_id: int
    department_id: int | None = None
    location_id: int | None = None
    expected_return_at: datetime | None = None
    notes: str | None = None


class AssetReturnRequest(BaseModel):
    notes: str | None = None


class AssetAssignmentResponse(BaseModel):
    id: int
    asset_id: int
    employee: EmployeeReferenceResponse
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
    asset_type: str | None
    brand: str | None
    description: str | None
    purchase_date: date | None
    warranty_expiry_date: date | None
    expected_end_of_life_date: date | None
    disposal_date: date | None
    cost_center: str | None
    location_floor: str | None
    location_room: str | None
    location_rack: str | None
    location_slot: str | None
    category: AssetReferenceResponse
    model: AssetReferenceResponse | None
    status: AssetReferenceResponse
    location: AssetReferenceResponse | None
    vendor: AssetReferenceResponse | None
    current_department: AssetReferenceResponse | None
    assigned_employee: EmployeeReferenceResponse | None
    assignments: list[AssetAssignmentResponse]
    events: list[AssetEventResponse]
    documents: list[AssetDocumentResponse]
    photo_document: AssetDocumentResponse | None
