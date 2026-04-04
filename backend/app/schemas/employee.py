from pydantic import BaseModel


class EmployeeReferenceResponse(BaseModel):
    id: int
    employee_code: str
    full_name: str
    email: str | None


class EmployeeListItemResponse(BaseModel):
    id: int
    employee_code: str
    full_name: str
    email: str | None
    department_id: int | None
    is_active: bool
    notes: str | None


class EmployeeListResponse(BaseModel):
    items: list[EmployeeListItemResponse]


class EmployeeCreateRequest(BaseModel):
    employee_code: str
    full_name: str
    email: str | None = None
    department_id: int | None = None
    is_active: bool = True
    notes: str | None = None


class EmployeeUpdateRequest(BaseModel):
    employee_code: str
    full_name: str
    email: str | None = None
    department_id: int | None = None
    is_active: bool = True
    notes: str | None = None
