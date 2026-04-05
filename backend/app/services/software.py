from datetime import UTC, date, datetime
from typing import Literal

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.software import SoftwareLicense, SoftwareLicenseAssignment, SoftwareLicenseEventLog
from app.repositories.asset import AssetRepository
from app.repositories.lookup import LookupRepository
from app.repositories.software import SoftwareLicenseRepository
from app.repositories.user import UserRepository
from app.schemas.asset import AssetReferenceResponse
from app.schemas.software import (
    SoftwareLicenseAssignRequest,
    SoftwareLicenseAssignmentResponse,
    SoftwareLicenseCreateRequest,
    SoftwareLicenseDetailResponse,
    SoftwareLicenseEventResponse,
    SoftwareLicenseListItemResponse,
    SoftwareLicenseListResponse,
    SoftwareLicenseListSummaryResponse,
    SoftwareLicenseRevokeRequest,
    SoftwareLicenseUpdateRequest,
)
from app.services.helpers import asset_reference, require_resource, user_reference


class SoftwareLicenseService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repository = SoftwareLicenseRepository(db)
        self.lookup_repository = LookupRepository(db)
        self.user_repository = UserRepository(db)
        self.asset_repository = AssetRepository(db)

    def list_licenses(
        self,
        *,
        search: str | None = None,
        page: int,
        page_size: int,
        sort_by: Literal["product_name", "license_type", "expiry_date"] = "product_name",
        sort_dir: Literal["asc", "desc"] = "asc",
    ) -> SoftwareLicenseListResponse:
        items, total = self.repository.list_licenses_paginated(
            search=search,
            page=page,
            page_size=page_size,
            sort_by=sort_by,
            sort_dir=sort_dir,
        )
        matched_items = self.repository.list_licenses(search=search)
        return SoftwareLicenseListResponse(
            items=[self._build_list_item(item) for item in items],
            total=total,
            page=page,
            page_size=page_size,
            summary=self._build_list_summary(matched_items),
        )

    def get_license(self, license_id: int) -> SoftwareLicenseDetailResponse:
        license_item = require_resource(self.repository.get_by_id(license_id), "Software license not found")
        return self._build_detail(license_item)

    def create_license(self, payload: SoftwareLicenseCreateRequest, current_user_id: int) -> SoftwareLicenseDetailResponse:
        self._validate_license_payload(payload.purchased_quantity, payload.renewal_alert_days)
        if payload.vendor_id is not None:
            require_resource(self.lookup_repository.get_vendor(payload.vendor_id), "Vendor not found")

        license_item = self.repository.add(SoftwareLicense(**payload.model_dump()))
        self.repository.add_event(
            SoftwareLicenseEventLog(
                software_license_id=license_item.id,
                event_type="CREATE",
                performed_by_user_id=current_user_id,
                summary=f"Licenza creata: {license_item.product_name}",
                details_json={"purchased_quantity": license_item.purchased_quantity},
            )
        )
        self.db.commit()
        return self._build_detail(license_item)

    def update_license(
        self,
        license_id: int,
        payload: SoftwareLicenseUpdateRequest,
        current_user_id: int,
    ) -> SoftwareLicenseDetailResponse:
        license_item = require_resource(self.repository.get_by_id(license_id), "Software license not found")
        self._validate_license_payload(payload.purchased_quantity, payload.renewal_alert_days)
        if payload.vendor_id is not None:
            require_resource(self.lookup_repository.get_vendor(payload.vendor_id), "Vendor not found")

        active_assignments = self.repository.count_active_assignments(license_id)
        if payload.purchased_quantity < active_assignments:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Purchased quantity cannot be lower than active assignments",
            )

        for key, value in payload.model_dump().items():
            setattr(license_item, key, value)
        self.db.flush()
        self.repository.add_event(
            SoftwareLicenseEventLog(
                software_license_id=license_item.id,
                event_type="UPDATE",
                performed_by_user_id=current_user_id,
                summary=f"Licenza aggiornata: {license_item.product_name}",
                details_json={"purchased_quantity": license_item.purchased_quantity},
            )
        )
        self.db.commit()
        return self._build_detail(license_item)

    def assign_license(
        self,
        license_id: int,
        payload: SoftwareLicenseAssignRequest,
        current_user_id: int,
    ) -> SoftwareLicenseAssignmentResponse:
        license_item = require_resource(self.repository.get_by_id(license_id), "Software license not found")
        assigned_by_user = require_resource(self.user_repository.get_by_id(current_user_id), "Current user not found")
        if (payload.user_id is None and payload.asset_id is None) or (payload.user_id is not None and payload.asset_id is not None):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Exactly one target between user and asset is required",
            )
        if payload.user_id is not None:
            require_resource(self.user_repository.get_by_id(payload.user_id), "User not found")
        if payload.asset_id is not None:
            require_resource(self.asset_repository.get_by_id(payload.asset_id), "Asset not found")

        if self.repository.count_active_assignments(license_id) >= license_item.purchased_quantity:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="No license seats available")
        if self.repository.find_open_assignment_for_target(
            license_id=license_id,
            user_id=payload.user_id,
            asset_id=payload.asset_id,
        ):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Target already has an active assignment")

        assignment = self.repository.add_assignment(
            SoftwareLicenseAssignment(
                software_license_id=license_item.id,
                user_id=payload.user_id,
                asset_id=payload.asset_id,
                assigned_by_user_id=current_user_id,
                notes=payload.notes,
            )
        )
        summary_target = self._build_assignment_target_summary(assignment.user_id, assignment.asset_id)
        self.repository.add_event(
            SoftwareLicenseEventLog(
                software_license_id=license_item.id,
                event_type="ASSIGN",
                performed_by_user_id=current_user_id,
                summary=f"Licenza assegnata a {summary_target}",
                details_json={"user_id": assignment.user_id, "asset_id": assignment.asset_id, "notes": assignment.notes},
            )
        )
        self.db.commit()
        return self._build_assignment_response(assignment, assigned_by_user=assigned_by_user)

    def revoke_assignment(
        self,
        assignment_id: int,
        payload: SoftwareLicenseRevokeRequest,
        current_user_id: int,
    ) -> SoftwareLicenseAssignmentResponse:
        assignment = require_resource(self.repository.get_assignment(assignment_id), "Software license assignment not found")
        if assignment.revoked_at is not None:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Assignment already revoked")
        assigned_by_user = require_resource(self.user_repository.get_by_id(assignment.assigned_by_user_id), "Assigned by user not found")
        assignment.revoked_at = datetime.now(UTC).replace(tzinfo=None)
        assignment.notes = payload.notes or assignment.notes
        self.db.flush()
        summary_target = self._build_assignment_target_summary(assignment.user_id, assignment.asset_id)
        self.repository.add_event(
            SoftwareLicenseEventLog(
                software_license_id=assignment.software_license_id,
                event_type="REVOKE",
                performed_by_user_id=current_user_id,
                summary=f"Assegnazione licenza revocata per {summary_target}",
                details_json={"user_id": assignment.user_id, "asset_id": assignment.asset_id, "notes": assignment.notes},
            )
        )
        self.db.commit()
        return self._build_assignment_response(assignment, assigned_by_user=assigned_by_user)

    def build_license_alerts(self, *, today: date | None = None) -> list[dict]:
        reference_date = today or date.today()
        alerts: list[dict] = []
        for license_item in self.repository.list_licenses():
            if license_item.expiry_date is None:
                continue
            days_remaining = (license_item.expiry_date - reference_date).days
            if days_remaining <= license_item.renewal_alert_days:
                alerts.append(
                    {
                        "license_id": license_item.id,
                        "product_name": license_item.product_name,
                        "expiry_date": license_item.expiry_date.isoformat(),
                        "days_remaining": days_remaining,
                        "available_quantity": license_item.purchased_quantity - self.repository.count_active_assignments(license_item.id),
                    }
                )
        alerts.sort(key=lambda item: (item["days_remaining"], item["product_name"]))
        return alerts

    def _build_list_item(self, license_item: SoftwareLicense) -> SoftwareLicenseListItemResponse:
        active_assignments = self.repository.count_active_assignments(license_item.id)
        return SoftwareLicenseListItemResponse(
            id=license_item.id,
            product_name=license_item.product_name,
            license_type=license_item.license_type,
            purchased_quantity=license_item.purchased_quantity,
            active_assignments=active_assignments,
            available_quantity=license_item.purchased_quantity - active_assignments,
            expiry_date=license_item.expiry_date,
            vendor=self._optional_vendor_reference(license_item.vendor_id),
        )

    def _build_detail(self, license_item: SoftwareLicense) -> SoftwareLicenseDetailResponse:
        active_assignments = self.repository.count_active_assignments(license_item.id)
        assignments = self.repository.list_assignments(license_item.id)
        events = self.repository.list_events(license_item.id)
        return SoftwareLicenseDetailResponse(
            id=license_item.id,
            product_name=license_item.product_name,
            license_type=license_item.license_type,
            purchased_quantity=license_item.purchased_quantity,
            active_assignments=active_assignments,
            available_quantity=license_item.purchased_quantity - active_assignments,
            purchase_date=license_item.purchase_date,
            expiry_date=license_item.expiry_date,
            renewal_alert_days=license_item.renewal_alert_days,
            notes=license_item.notes,
            vendor=self._optional_vendor_reference(license_item.vendor_id),
            assignments=[self._build_assignment_response(item) for item in assignments],
            events=[self._build_event_response(item) for item in events],
        )

    def _build_list_summary(self, license_items: list[SoftwareLicense]) -> SoftwareLicenseListSummaryResponse:
        total_licenses = len(license_items)
        active_assignments = 0
        available_quantity = 0
        expiring_licenses = 0

        for license_item in license_items:
            current_active_assignments = self.repository.count_active_assignments(license_item.id)
            active_assignments += current_active_assignments
            available_quantity += license_item.purchased_quantity - current_active_assignments
            if license_item.expiry_date is not None:
                expiring_licenses += 1

        return SoftwareLicenseListSummaryResponse(
            total_licenses=total_licenses,
            active_assignments=active_assignments,
            available_quantity=available_quantity,
            expiring_licenses=expiring_licenses,
        )

    def _build_assignment_response(
        self,
        assignment: SoftwareLicenseAssignment,
        *,
        assigned_by_user=None,
    ) -> SoftwareLicenseAssignmentResponse:
        user = self.user_repository.get_by_id(assignment.user_id) if assignment.user_id else None
        asset = self.asset_repository.get_by_id(assignment.asset_id) if assignment.asset_id else None
        assigned_by = assigned_by_user or require_resource(
            self.user_repository.get_by_id(assignment.assigned_by_user_id),
            "Assigned by user not found",
        )
        return SoftwareLicenseAssignmentResponse(
            id=assignment.id,
            software_license_id=assignment.software_license_id,
            user=user_reference(user) if user else None,
            asset=AssetReferenceResponse(id=asset.id, code=asset.asset_tag, name=asset.name) if asset else None,
            assigned_by_user=user_reference(assigned_by),
            assigned_at=assignment.assigned_at,
            revoked_at=assignment.revoked_at,
            notes=assignment.notes,
        )

    def _build_event_response(self, event: SoftwareLicenseEventLog) -> SoftwareLicenseEventResponse:
        user = self.user_repository.get_by_id(event.performed_by_user_id) if event.performed_by_user_id else None
        return SoftwareLicenseEventResponse(
            id=event.id,
            event_type=event.event_type,
            summary=event.summary,
            created_at=event.created_at,
            performed_by_user=user_reference(user) if user else None,
            details=event.details_json,
        )

    def _optional_vendor_reference(self, vendor_id: int | None):
        if vendor_id is None:
            return None
        vendor = require_resource(self.lookup_repository.get_vendor(vendor_id), "Vendor not found")
        return asset_reference(vendor)

    def _validate_license_payload(self, purchased_quantity: int, renewal_alert_days: int) -> None:
        if purchased_quantity < 1:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Purchased quantity must be at least 1")
        if renewal_alert_days < 0:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Renewal alert days cannot be negative")

    def _build_assignment_target_summary(self, user_id: int | None, asset_id: int | None) -> str:
        if user_id is not None:
            user = require_resource(self.user_repository.get_by_id(user_id), "User not found")
            return user.full_name
        asset = require_resource(self.asset_repository.get_by_id(asset_id), "Asset not found")
        return f"{asset.asset_tag} - {asset.name}"
