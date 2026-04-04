from pydantic import BaseModel, ConfigDict


class LookupItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    code: str | None = None
    name: str
    contact_email: str | None = None
    contact_phone: str | None = None
    category_id: int | None = None
    vendor_id: int | None = None
    manufacturer: str | None = None


class LookupListResponse(BaseModel):
    items: list[LookupItemResponse]


class LookupCreateRequest(BaseModel):
    code: str
    name: str


class LookupUpdateRequest(BaseModel):
    code: str
    name: str


class VendorCreateRequest(BaseModel):
    name: str
    contact_email: str | None = None
    contact_phone: str | None = None


class VendorUpdateRequest(BaseModel):
    name: str
    contact_email: str | None = None
    contact_phone: str | None = None


class AssetModelCreateRequest(BaseModel):
    category_id: int
    vendor_id: int | None = None
    name: str
    manufacturer: str | None = None


class AssetModelUpdateRequest(BaseModel):
    category_id: int
    vendor_id: int | None = None
    name: str
    manufacturer: str | None = None
