from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.assignment import AssetAssignment


class AssignmentRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def add(self, assignment: AssetAssignment) -> AssetAssignment:
        self.db.add(assignment)
        self.db.flush()
        self.db.refresh(assignment)
        return assignment

    def get_open_for_asset(self, asset_id: int) -> AssetAssignment | None:
        statement = (
            select(AssetAssignment)
            .where(AssetAssignment.asset_id == asset_id, AssetAssignment.returned_at.is_(None))
            .order_by(AssetAssignment.assigned_at.desc())
        )
        return self.db.scalars(statement).first()

    def list_for_asset(self, asset_id: int) -> list[AssetAssignment]:
        statement = (
            select(AssetAssignment)
            .where(AssetAssignment.asset_id == asset_id)
            .order_by(AssetAssignment.assigned_at.desc())
        )
        return self.db.scalars(statement).all()
