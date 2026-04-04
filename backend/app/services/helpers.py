from fastapi import HTTPException, status

from app.models.asset import AssetDocument, AssetEventLog
from app.models.employee import Employee
from app.models.assignment import AssetAssignment
from app.models.lookup import AssetCategory, AssetModel, AssetStatus, Department, Location, Vendor
from app.models.user import User
from app.schemas.asset import (
    AssetAssignmentResponse,
    AssetDetailResponse,
    AssetDocumentResponse,
    AssetEventResponse,
    AssetListItemResponse,
    AssetReferenceResponse,
    UserReferenceResponse,
)
from app.schemas.employee import EmployeeReferenceResponse
from app.schemas.maintenance import MaintenanceTicketResponse


def require_resource(resource, detail: str):
    if resource is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=detail)
    return resource


def asset_reference(resource: Department | Location | Vendor | AssetCategory | AssetModel | AssetStatus) -> AssetReferenceResponse:
    return AssetReferenceResponse(id=resource.id, name=resource.name, code=getattr(resource, "code", None))


def user_reference(user: User) -> UserReferenceResponse:
    return UserReferenceResponse(id=user.id, username=user.username, full_name=user.full_name)


def employee_reference(employee: Employee) -> EmployeeReferenceResponse:
    return EmployeeReferenceResponse(
        id=employee.id,
        employee_code=employee.employee_code,
        full_name=employee.full_name,
        email=employee.email,
    )


def assignment_response(
    assignment: AssetAssignment,
    employee: Employee,
    assigned_by_user: User,
    department: Department | None,
    location: Location | None,
) -> AssetAssignmentResponse:
    return AssetAssignmentResponse(
        id=assignment.id,
        asset_id=assignment.asset_id,
        employee=employee_reference(employee),
        assigned_by_user=user_reference(assigned_by_user),
        department=asset_reference(department) if department else None,
        location=asset_reference(location) if location else None,
        assigned_at=assignment.assigned_at,
        expected_return_at=assignment.expected_return_at,
        returned_at=assignment.returned_at,
        notes=assignment.notes,
    )


def event_response(event: AssetEventLog, performed_by_user: User | None) -> AssetEventResponse:
    return AssetEventResponse(
        id=event.id,
        event_type=event.event_type,
        summary=event.summary,
        created_at=event.created_at,
        performed_by_user=user_reference(performed_by_user) if performed_by_user else None,
        details=event.details_json,
    )


def document_response(document: AssetDocument, uploaded_by_user: User | None) -> AssetDocumentResponse:
    return AssetDocumentResponse(
        id=document.id,
        asset_id=document.asset_id,
        file_name=document.file_name,
        content_type=document.content_type,
        size_bytes=document.size_bytes,
        created_at=document.created_at,
        uploaded_by_user=user_reference(uploaded_by_user) if uploaded_by_user else None,
    )


def maintenance_response(
    *,
    ticket,
    asset,
    vendor,
    opened_by_user,
) -> MaintenanceTicketResponse:
    return MaintenanceTicketResponse(
        id=ticket.id,
        asset=AssetReferenceResponse(id=asset.id, name=asset.name, code=asset.asset_tag),
        vendor=asset_reference(vendor) if vendor else None,
        opened_by_user=user_reference(opened_by_user) if opened_by_user else None,
        status=ticket.status,
        title=ticket.title,
        description=ticket.description,
        opened_at=ticket.opened_at,
        closed_at=ticket.closed_at,
    )
