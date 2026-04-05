from typing import Literal

from sqlalchemy import Select, func, or_, select
from sqlalchemy.orm import Session

from app.models.software import SoftwareLicense, SoftwareLicenseAssignment, SoftwareLicenseEventLog


class SoftwareLicenseRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list_licenses(
        self,
        *,
        search: str | None = None,
        sort_by: Literal["product_name", "license_type", "expiry_date"] = "product_name",
        sort_dir: Literal["asc", "desc"] = "asc",
    ) -> list[SoftwareLicense]:
        query = self._build_sorted_query(search=search, sort_by=sort_by, sort_dir=sort_dir)
        return self.db.scalars(query).all()

    def list_licenses_paginated(
        self,
        *,
        search: str | None = None,
        page: int,
        page_size: int,
        sort_by: Literal["product_name", "license_type", "expiry_date"] = "product_name",
        sort_dir: Literal["asc", "desc"] = "asc",
    ) -> tuple[list[SoftwareLicense], int]:
        base_query = self._build_base_query(search=search)
        total = self.db.scalar(select(func.count()).select_from(base_query.subquery())) or 0
        statement = self._build_sorted_query(search=search, sort_by=sort_by, sort_dir=sort_dir).offset((page - 1) * page_size).limit(page_size)
        return self.db.scalars(statement).all(), total

    def _build_base_query(self, *, search: str | None = None) -> Select[tuple[SoftwareLicense]]:
        query: Select[tuple[SoftwareLicense]] = select(SoftwareLicense)
        if search:
            pattern = f"%{search}%"
            query = query.where(
                or_(
                    SoftwareLicense.product_name.ilike(pattern),
                    SoftwareLicense.license_type.ilike(pattern),
                )
            )
        return query

    def _build_sorted_query(
        self,
        *,
        search: str | None = None,
        sort_by: Literal["product_name", "license_type", "expiry_date"] = "product_name",
        sort_dir: Literal["asc", "desc"] = "asc",
    ) -> Select[tuple[SoftwareLicense]]:
        query = self._build_base_query(search=search)
        sort_column = {
            "product_name": SoftwareLicense.product_name,
            "license_type": SoftwareLicense.license_type,
            "expiry_date": SoftwareLicense.expiry_date,
        }[sort_by]
        if sort_dir == "desc":
            return query.order_by(sort_column.desc(), SoftwareLicense.id.desc())
        return query.order_by(sort_column.asc(), SoftwareLicense.id.asc())

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
