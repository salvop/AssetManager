from datetime import datetime

from pydantic import BaseModel

from app.schemas.asset import AssetReferenceResponse, UserReferenceResponse


class MaintenanceTicketCreateRequest(BaseModel):
    asset_id: int
    vendor_id: int | None = None
    title: str
    description: str | None = None


class MaintenanceTicketUpdateRequest(BaseModel):
    vendor_id: int | None = None
    title: str
    description: str | None = None


class MaintenanceTicketStatusChangeRequest(BaseModel):
    status: str


class MaintenanceTicketResponse(BaseModel):
    id: int
    asset: AssetReferenceResponse
    vendor: AssetReferenceResponse | None
    opened_by_user: UserReferenceResponse | None
    status: str
    title: str
    description: str | None
    opened_at: datetime
    closed_at: datetime | None


class MaintenanceTicketListResponse(BaseModel):
    items: list[MaintenanceTicketResponse]
    total: int
    page: int
    page_size: int
