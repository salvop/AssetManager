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
    warranty_expiry_date: str | None = None
    expected_end_of_life_date: str | None = None


class DashboardRecentTicketResponse(BaseModel):
    id: int
    title: str
    status: str
    asset_id: int
    asset_name: str
    asset_tag: str


class DashboardLifecycleAlertResponse(BaseModel):
    asset_id: int
    asset_tag: str
    asset_name: str
    due_date: str
    alert_type: str
    days_remaining: int


class DashboardAssignmentAlertResponse(BaseModel):
    asset_id: int
    asset_tag: str
    asset_name: str
    assigned_employee_name: str
    expected_return_at: str
    days_remaining: int
    alert_type: str


class DashboardNotificationResponse(BaseModel):
    title: str
    body: str
    severity: str
    link: str
    category: str


class DashboardWorkflowAssetResponse(BaseModel):
    asset_id: int
    asset_tag: str
    asset_name: str
    status_code: str
    status_name: str
    location_name: str | None = None
    assigned_employee_name: str | None = None


class DashboardWorkflowTicketResponse(BaseModel):
    ticket_id: int
    title: str
    status: str
    asset_id: int
    asset_tag: str
    asset_name: str
    opened_at: str
    opened_days: int


class DashboardSummaryResponse(BaseModel):
    total_assets: int
    assigned_assets: int
    assets_in_maintenance: int
    open_maintenance_tickets: int
    warranties_expiring_soon: int
    end_of_life_soon: int
    assignments_due_soon: int
    overdue_assignments: int
    total_notifications: int
    assets_by_status: list[StatusCountResponse]
    recent_assets: list[DashboardRecentAssetResponse]
    recent_open_tickets: list[DashboardRecentTicketResponse]
    lifecycle_alerts: list[DashboardLifecycleAlertResponse]
    assignment_alerts: list[DashboardAssignmentAlertResponse]
    notifications: list[DashboardNotificationResponse]
    assets_ready_for_assignment: list[DashboardWorkflowAssetResponse]
    retired_assets_pending_disposal: list[DashboardWorkflowAssetResponse]
    maintenance_queue: list[DashboardWorkflowTicketResponse]
