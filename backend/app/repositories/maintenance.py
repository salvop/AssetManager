from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.maintenance import MaintenanceTicket


class MaintenanceTicketRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def count_open_tickets(self) -> int:
        return self.db.scalar(
            select(func.count()).select_from(MaintenanceTicket).where(MaintenanceTicket.closed_at.is_(None))
        ) or 0

    def add(self, ticket: MaintenanceTicket) -> MaintenanceTicket:
        self.db.add(ticket)
        self.db.flush()
        self.db.refresh(ticket)
        return ticket

    def get_by_id(self, ticket_id: int) -> MaintenanceTicket | None:
        return self.db.get(MaintenanceTicket, ticket_id)

    def list_tickets(self) -> list[MaintenanceTicket]:
        return self.db.scalars(select(MaintenanceTicket).order_by(MaintenanceTicket.opened_at.desc())).all()

    def list_for_asset(self, asset_id: int) -> list[MaintenanceTicket]:
        return self.db.scalars(
            select(MaintenanceTicket).where(MaintenanceTicket.asset_id == asset_id).order_by(MaintenanceTicket.opened_at.desc())
        ).all()
