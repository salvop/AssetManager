from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.maintenance import (
    MaintenanceTicketCreateRequest,
    MaintenanceTicketListResponse,
    MaintenanceTicketResponse,
    MaintenanceTicketStatusChangeRequest,
    MaintenanceTicketUpdateRequest,
)
from app.security.deps import require_roles
from app.services.maintenance import MaintenanceTicketService

router = APIRouter()


@router.get("", response_model=MaintenanceTicketListResponse)
def list_tickets(
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN", "ASSET_MANAGER", "OPERATOR", "VIEWER")),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> MaintenanceTicketListResponse:
    return MaintenanceTicketService(db).list_tickets(page=page, page_size=page_size)


@router.get("/by-asset/{asset_id}", response_model=MaintenanceTicketListResponse)
def list_tickets_for_asset(
    asset_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN", "ASSET_MANAGER", "OPERATOR", "VIEWER")),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> MaintenanceTicketListResponse:
    return MaintenanceTicketService(db).list_for_asset(asset_id, page=page, page_size=page_size)


@router.post("", response_model=MaintenanceTicketResponse)
def create_ticket(
    payload: MaintenanceTicketCreateRequest,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN", "ASSET_MANAGER", "OPERATOR")),
) -> MaintenanceTicketResponse:
    return MaintenanceTicketService(db).create_ticket(payload, current_user.id)


@router.get("/{ticket_id}", response_model=MaintenanceTicketResponse)
def get_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN", "ASSET_MANAGER", "OPERATOR", "VIEWER")),
) -> MaintenanceTicketResponse:
    return MaintenanceTicketService(db).get_ticket(ticket_id)


@router.put("/{ticket_id}", response_model=MaintenanceTicketResponse)
def update_ticket(
    ticket_id: int,
    payload: MaintenanceTicketUpdateRequest,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN", "ASSET_MANAGER", "OPERATOR")),
) -> MaintenanceTicketResponse:
    return MaintenanceTicketService(db).update_ticket(ticket_id, payload)


@router.patch("/{ticket_id}/status", response_model=MaintenanceTicketResponse)
def change_ticket_status(
    ticket_id: int,
    payload: MaintenanceTicketStatusChangeRequest,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN", "ASSET_MANAGER", "OPERATOR")),
) -> MaintenanceTicketResponse:
    return MaintenanceTicketService(db).change_status(ticket_id, payload, current_user.id)
