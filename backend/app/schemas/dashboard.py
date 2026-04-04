from pydantic import BaseModel


class StatusCountResponse(BaseModel):
    status_id: int
    status_code: str
    status_name: str
    total: int


class DashboardRecentAssetResponse(BaseModel):
    id: int
    asset_tag: str
    name: str
    status_code: str
    status_name: str


class DashboardRecentTicketResponse(BaseModel):
    id: int
    title: str
    status: str
    asset_id: int
    asset_name: str
    asset_tag: str


class DashboardSummaryResponse(BaseModel):
    total_assets: int
    assigned_assets: int
    assets_in_maintenance: int
    open_maintenance_tickets: int
    assets_by_status: list[StatusCountResponse]
    recent_assets: list[DashboardRecentAssetResponse]
    recent_open_tickets: list[DashboardRecentTicketResponse]
