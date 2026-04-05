from pydantic import BaseModel


class UserListItemResponse(BaseModel):
    id: int
    username: str
    full_name: str
    email: str | None
    department_id: int | None
    is_active: bool
    role_codes: list[str]


class UserListResponse(BaseModel):
    items: list[UserListItemResponse]
    total: int
    page: int
    page_size: int


class UserCreateRequest(BaseModel):
    department_id: int | None = None
    username: str
    full_name: str
    email: str | None = None
    password: str
    is_active: bool = True
    role_codes: list[str]


class UserUpdateRequest(BaseModel):
    department_id: int | None = None
    full_name: str
    email: str | None = None
    password: str | None = None
    is_active: bool = True
    role_codes: list[str]
