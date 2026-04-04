from sqlalchemy import Select, func, or_, select
from sqlalchemy.orm import Session

from app.models.software import SoftwareLicense, SoftwareLicenseAssignment, SoftwareLicenseEventLog


class SoftwareLicenseRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list_licenses(self, *, search: str | None = None) -> list[SoftwareLicense]:
        query: Select[tuple[SoftwareLicense]] = select(SoftwareLicense).order_by(SoftwareLicense.product_name.asc())
        if search:
            pattern = f"%{search}%"
            query = query.where(
                or_(
                    SoftwareLicense.product_name.ilike(pattern),
                    SoftwareLicense.license_type.ilike(pattern),
                )
            )
        return self.db.scalars(query).all()

    def get_by_id(self, license_id: int) -> SoftwareLicense | None:
        return self.db.get(SoftwareLicense, license_id)

    def add(self, license_item: SoftwareLicense) -> SoftwareLicense:
        self.db.add(license_item)
        self.db.flush()
        self.db.refresh(license_item)
        return license_item

    def count_active_assignments(self, license_id: int) -> int:
        return self.db.scalar(
            select(func.count())
            .select_from(SoftwareLicenseAssignment)
            .where(SoftwareLicenseAssignment.software_license_id == license_id)
            .where(SoftwareLicenseAssignment.revoked_at.is_(None))
        ) or 0

    def list_assignments(self, license_id: int) -> list[SoftwareLicenseAssignment]:
        return self.db.scalars(
            select(SoftwareLicenseAssignment)
            .where(SoftwareLicenseAssignment.software_license_id == license_id)
            .order_by(SoftwareLicenseAssignment.assigned_at.desc())
        ).all()

    def find_open_assignment_for_target(
        self,
        *,
        license_id: int,
        user_id: int | None,
        asset_id: int | None,
    ) -> SoftwareLicenseAssignment | None:
        query = (
            select(SoftwareLicenseAssignment)
            .where(SoftwareLicenseAssignment.software_license_id == license_id)
            .where(SoftwareLicenseAssignment.revoked_at.is_(None))
        )
        if user_id is not None:
            query = query.where(SoftwareLicenseAssignment.user_id == user_id)
        if asset_id is not None:
            query = query.where(SoftwareLicenseAssignment.asset_id == asset_id)
        return self.db.scalars(query).first()

    def add_assignment(self, assignment: SoftwareLicenseAssignment) -> SoftwareLicenseAssignment:
        self.db.add(assignment)
        self.db.flush()
        self.db.refresh(assignment)
        return assignment

    def get_assignment(self, assignment_id: int) -> SoftwareLicenseAssignment | None:
        return self.db.get(SoftwareLicenseAssignment, assignment_id)

    def add_event(self, event: SoftwareLicenseEventLog) -> SoftwareLicenseEventLog:
        self.db.add(event)
        self.db.flush()
        self.db.refresh(event)
        return event

    def list_events(self, license_id: int) -> list[SoftwareLicenseEventLog]:
        return self.db.scalars(
            select(SoftwareLicenseEventLog)
            .where(SoftwareLicenseEventLog.software_license_id == license_id)
            .order_by(SoftwareLicenseEventLog.created_at.desc())
        ).all()
