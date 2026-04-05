from datetime import UTC, datetime

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.maintenance import MaintenanceTicket
from app.repositories.asset import AssetRepository
from app.repositories.lookup import LookupRepository
from app.repositories.maintenance import MaintenanceTicketRepository
from app.repositories.user import UserRepository
from app.schemas.maintenance import (
    MaintenanceTicketCreateRequest,
    MaintenanceTicketListResponse,
    MaintenanceTicketResponse,
    MaintenanceTicketStatusChangeRequest,
    MaintenanceTicketUpdateRequest,
)
from app.services.email_notifications import EmailNotificationService
from app.services.events import AssetEventService
from app.services.helpers import maintenance_response, require_resource


class MaintenanceTicketService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repository = MaintenanceTicketRepository(db)
        self.asset_repository = AssetRepository(db)
        self.lookup_repository = LookupRepository(db)
        self.user_repository = UserRepository(db)
        self.event_service = AssetEventService(db)
        self.email_notification_service = EmailNotificationService()

    def list_tickets(self, *, page: int, page_size: int) -> MaintenanceTicketListResponse:
        tickets, total = self.repository.list_tickets_paginated(page=page, page_size=page_size)
        return MaintenanceTicketListResponse(
            items=[self._build_response(ticket) for ticket in tickets],
            total=total,
            page=page,
            page_size=page_size,
        )

    def get_ticket(self, ticket_id: int) -> MaintenanceTicketResponse:
        ticket = require_resource(self.repository.get_by_id(ticket_id), "Maintenance ticket not found")
        return self._build_response(ticket)

    def list_for_asset(self, asset_id: int, *, page: int, page_size: int) -> MaintenanceTicketListResponse:
        require_resource(self.asset_repository.get_by_id(asset_id), "Asset not found")
        tickets, total = self.repository.list_for_asset_paginated(asset_id=asset_id, page=page, page_size=page_size)
        return MaintenanceTicketListResponse(
            items=[self._build_response(ticket) for ticket in tickets],
            total=total,
            page=page,
            page_size=page_size,
        )

    def create_ticket(self, payload: MaintenanceTicketCreateRequest, current_user_id: int) -> MaintenanceTicketResponse:
        asset = require_resource(self.asset_repository.get_by_id(payload.asset_id), "Asset not found")
        if payload.vendor_id is not None:
            require_resource(self.lookup_repository.get_vendor(payload.vendor_id), "Vendor not found")
        opened_by_user = self.user_repository.get_by_id(current_user_id)

        ticket = MaintenanceTicket(
            asset_id=payload.asset_id,
            vendor_id=payload.vendor_id,
            opened_by_user_id=current_user_id,
            status="OPEN",
            title=payload.title,
            description=payload.description,
        )
        self.repository.add(ticket)
        self.event_service.log_event(
            asset_id=payload.asset_id,
            event_type="MAINTENANCE_OPEN",
            summary=f"Maintenance ticket opened: {payload.title}",
            performed_by_user_id=current_user_id,
            details={"ticket_id": ticket.id},
        )
        self.db.commit()
        self.email_notification_service.notify_maintenance_ticket_opened(
            ticket=ticket,
            asset=asset,
            opened_by_user=opened_by_user,
        )
        return self._build_response(ticket)

    def update_ticket(self, ticket_id: int, payload: MaintenanceTicketUpdateRequest) -> MaintenanceTicketResponse:
        ticket = require_resource(self.repository.get_by_id(ticket_id), "Maintenance ticket not found")
        if payload.vendor_id is not None:
            require_resource(self.lookup_repository.get_vendor(payload.vendor_id), "Vendor not found")

        ticket.vendor_id = payload.vendor_id
        ticket.title = payload.title
        ticket.description = payload.description
        self.db.commit()
        return self._build_response(ticket)

    def change_status(self, ticket_id: int, payload: MaintenanceTicketStatusChangeRequest, current_user_id: int) -> MaintenanceTicketResponse:
        ticket = require_resource(self.repository.get_by_id(ticket_id), "Maintenance ticket not found")
        asset = require_resource(self.asset_repository.get_by_id(ticket.asset_id), "Asset not found")
        opened_by_user = self.user_repository.get_by_id(ticket.opened_by_user_id) if ticket.opened_by_user_id else None
        normalized_status = payload.status.upper()
        if normalized_status not in {"OPEN", "IN_PROGRESS", "CLOSED"}:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid maintenance status")

        ticket.status = normalized_status
        ticket.closed_at = datetime.now(UTC).replace(tzinfo=None) if normalized_status == "CLOSED" else None
        self.db.flush()
        self.event_service.log_event(
            asset_id=ticket.asset_id,
            event_type="MAINTENANCE_STATUS_CHANGE",
            summary=f"Maintenance ticket status changed to {normalized_status}",
            performed_by_user_id=current_user_id,
            details={"ticket_id": ticket.id, "status": normalized_status},
        )
        self.db.commit()
        self.email_notification_service.notify_maintenance_status_changed(
            ticket=ticket,
            asset=asset,
            opened_by_user=opened_by_user,
        )
        return self._build_response(ticket)

    def _build_response(self, ticket: MaintenanceTicket) -> MaintenanceTicketResponse:
        asset = require_resource(self.asset_repository.get_by_id(ticket.asset_id), "Asset not found")
        vendor = self.lookup_repository.get_vendor(ticket.vendor_id) if ticket.vendor_id else None
        opened_by_user = self.user_repository.get_by_id(ticket.opened_by_user_id) if ticket.opened_by_user_id else None
        return maintenance_response(ticket=ticket, asset=asset, vendor=vendor, opened_by_user=opened_by_user)
