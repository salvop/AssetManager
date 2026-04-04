from datetime import UTC, datetime

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.assignment import AssetAssignment
from app.repositories.asset import AssetRepository
from app.repositories.assignment import AssignmentRepository
from app.repositories.lookup import LookupRepository
from app.repositories.user import UserRepository
from app.schemas.asset import AssetAssignRequest, AssetAssignmentResponse, AssetReturnRequest
from app.services.email_notifications import EmailNotificationService
from app.services.events import AssetEventService
from app.services.helpers import assignment_response, require_resource


class AssignmentService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.asset_repository = AssetRepository(db)
        self.assignment_repository = AssignmentRepository(db)
        self.lookup_repository = LookupRepository(db)
        self.user_repository = UserRepository(db)
        self.event_service = AssetEventService(db)
        self.email_notification_service = EmailNotificationService()

    def assign_asset(
        self,
        *,
        asset_id: int,
        payload: AssetAssignRequest,
        current_user_id: int,
    ) -> AssetAssignmentResponse:
        asset = require_resource(self.asset_repository.get_by_id(asset_id), "Asset not found")
        target_user = require_resource(self.user_repository.get_by_id(payload.user_id), "User not found")
        current_user = require_resource(self.user_repository.get_by_id(current_user_id), "Current user not found")
        asset_status = require_resource(self.lookup_repository.get_status(asset.status_id), "Asset status not found")
        if asset_status.code in {"RETIRED", "DISPOSED"}:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Asset cannot be assigned in current status")
        open_assignment = self.assignment_repository.get_open_for_asset(asset_id)
        if open_assignment is not None:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Asset already has an open assignment")

        if payload.department_id is not None:
            require_resource(self.lookup_repository.get_department(payload.department_id), "Department not found")
        if payload.location_id is not None:
            require_resource(self.lookup_repository.get_location(payload.location_id), "Location not found")

        assignment = AssetAssignment(
            asset_id=asset.id,
            user_id=target_user.id,
            assigned_by_user_id=current_user_id,
            department_id=payload.department_id,
            location_id=payload.location_id,
            expected_return_at=payload.expected_return_at,
            notes=payload.notes,
        )
        self.assignment_repository.add(assignment)

        assigned_status = require_resource(self.lookup_repository.get_status_by_code("ASSIGNED"), "ASSIGNED status not found")
        asset.assigned_user_id = target_user.id
        asset.status_id = assigned_status.id
        if payload.department_id is not None:
            asset.current_department_id = payload.department_id
        if payload.location_id is not None:
            asset.location_id = payload.location_id
        self.db.flush()

        self.event_service.log_event(
            asset_id=asset.id,
            event_type="ASSIGN",
            summary=f"Asset assigned to {target_user.full_name}",
            performed_by_user_id=current_user_id,
            details={"assigned_user_id": target_user.id, "notes": payload.notes},
        )
        self.db.commit()
        self.email_notification_service.notify_asset_assigned(
            asset=asset,
            target_user=target_user,
            assigned_by_user=current_user,
        )
        return self._build_assignment_response(assignment)

    def return_asset(
        self,
        *,
        asset_id: int,
        payload: AssetReturnRequest,
        current_user_id: int,
    ) -> AssetAssignmentResponse:
        asset = require_resource(self.asset_repository.get_by_id(asset_id), "Asset not found")
        assignment = self.assignment_repository.get_open_for_asset(asset_id)
        if assignment is None:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Asset does not have an open assignment")
        previous_user = self.user_repository.get_by_id(assignment.user_id)
        current_user = require_resource(self.user_repository.get_by_id(current_user_id), "Current user not found")

        assignment.returned_at = datetime.now(UTC).replace(tzinfo=None)
        assignment.notes = payload.notes or assignment.notes
        in_stock_status = require_resource(self.lookup_repository.get_status_by_code("IN_STOCK"), "IN_STOCK status not found")
        asset.assigned_user_id = None
        asset.status_id = in_stock_status.id
        self.db.flush()

        self.event_service.log_event(
            asset_id=asset.id,
            event_type="RETURN",
            summary="Asset returned",
            performed_by_user_id=current_user_id,
            details={"notes": payload.notes},
        )
        self.db.commit()
        self.email_notification_service.notify_asset_returned(
            asset=asset,
            previous_user=previous_user,
            returned_by_user=current_user,
        )
        return self._build_assignment_response(assignment)

    def list_assignments(self, asset_id: int) -> list[AssetAssignmentResponse]:
        require_resource(self.asset_repository.get_by_id(asset_id), "Asset not found")
        assignments = self.assignment_repository.list_for_asset(asset_id)
        return [self._build_assignment_response(item) for item in assignments]

    def _build_assignment_response(self, assignment: AssetAssignment) -> AssetAssignmentResponse:
        user = require_resource(self.user_repository.get_by_id(assignment.user_id), "Assigned user not found")
        assigned_by_user = require_resource(
            self.user_repository.get_by_id(assignment.assigned_by_user_id),
            "Assigned by user not found",
        )
        department = self.lookup_repository.get_department(assignment.department_id) if assignment.department_id else None
        location = self.lookup_repository.get_location(assignment.location_id) if assignment.location_id else None
        return assignment_response(assignment, user, assigned_by_user, department, location)
