from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

from app.schemas.asset import AssetReferenceResponse, UserReferenceResponse
from app.schemas.employee import EmployeeReferenceResponse


class AssetRequestCreateRequest(BaseModel):
    requested_for_employee_id: int | None = None
    department_id: int | None = None
    category_id: int
    suggested_model_id: int | None = None
    suggested_vendor_id: int | None = None
    priority: Literal["LOW", "NORMAL", "HIGH", "URGENT"] = "NORMAL"
    business_justification: str = Field(min_length=3, max_length=4000)


class AssetRequestApproveRequest(BaseModel):
    approval_notes: str | None = Field(default=None, max_length=4000)


class AssetRequestResponse(BaseModel):
    id: int
    requested_by_user: UserReferenceResponse
    requested_for_employee: EmployeeReferenceResponse | None
    department: AssetReferenceResponse | None
    category: AssetReferenceResponse
    suggested_model: AssetReferenceResponse | None
    suggested_vendor: AssetReferenceResponse | None
    priority: str
    business_justification: str | None
    status: str
    approved_by_user: UserReferenceResponse | None
    approval_notes: str | None
    approved_at: datetime | None
    rejected_at: datetime | None
    created_at: datetime


class AssetRequestListResponse(BaseModel):
    items: list[AssetRequestResponse]
    total: int
    page: int
    page_size: int
