from datetime import UTC, datetime

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.request import AssetRequest
from app.repositories.employee import EmployeeRepository
from app.repositories.lookup import LookupRepository
from app.repositories.request import AssetRequestRepository
from app.repositories.user import UserRepository
from app.schemas.request import (
    AssetRequestApproveRequest,
    AssetRequestCreateRequest,
    AssetRequestListResponse,
    AssetRequestResponse,
)
from app.services.helpers import (
    asset_reference,
    employee_reference,
    require_resource,
    user_reference,
)


class AssetRequestService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.request_repository = AssetRequestRepository(db)
        self.user_repository = UserRepository(db)
        self.employee_repository = EmployeeRepository(db)
        self.lookup_repository = LookupRepository(db)

    def list_requests(self, *, page: int, page_size: int) -> AssetRequestListResponse:
        items, total = self.request_repository.list_requests(page=page, page_size=page_size)
        return AssetRequestListResponse(
            items=[self._build_response(item) for item in items],
            total=total,
            page=page,
            page_size=page_size,
        )

    def create_request(self, payload: AssetRequestCreateRequest, current_user_id: int) -> AssetRequestResponse:
        requested_by_user = require_resource(
            self.user_repository.get_by_id(current_user_id),
            "Current user not found",
        )
        self._validate_references(payload)

        request = AssetRequest(
            requested_by_user_id=requested_by_user.id,
            requested_for_employee_id=payload.requested_for_employee_id,
            department_id=payload.department_id,
            category_id=payload.category_id,
            suggested_model_id=payload.suggested_model_id,
            suggested_vendor_id=payload.suggested_vendor_id,
            priority=payload.priority,
            business_justification=payload.business_justification,
        )
        self.request_repository.add(request)
        self.db.commit()
        return self._build_response(request)

    def approve_request(
        self,
        request_id: int,
        payload: AssetRequestApproveRequest,
        current_user_id: int,
    ) -> AssetRequestResponse:
        request = require_resource(self.request_repository.get_by_id(request_id), "Asset request not found")
        require_resource(self.user_repository.get_by_id(current_user_id), "Current user not found")

        if request.status != "PENDING_APPROVAL":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Only pending requests can be approved",
            )

        request.status = "APPROVED"
        request.approved_by_user_id = current_user_id
        request.approval_notes = payload.approval_notes
        request.approved_at = datetime.now(UTC).replace(tzinfo=None)
        self.db.commit()
        return self._build_response(request)

    def _validate_references(self, payload: AssetRequestCreateRequest) -> None:
        require_resource(self.lookup_repository.get_category(payload.category_id), "Asset category not found")
        if payload.department_id is not None:
            require_resource(self.lookup_repository.get_department(payload.department_id), "Department not found")
        if payload.suggested_model_id is not None:
            require_resource(self.lookup_repository.get_model(payload.suggested_model_id), "Asset model not found")
        if payload.suggested_vendor_id is not None:
            require_resource(self.lookup_repository.get_vendor(payload.suggested_vendor_id), "Vendor not found")
        if payload.requested_for_employee_id is not None:
            employee = require_resource(
                self.employee_repository.get_by_id(payload.requested_for_employee_id),
                "Employee not found",
            )
            if not employee.is_active:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Employee is not active",
                )

    def _build_response(self, request: AssetRequest) -> AssetRequestResponse:
        requested_by_user = require_resource(
            self.user_repository.get_by_id(request.requested_by_user_id),
            "Requested by user not found",
        )
        requested_for_employee = (
            require_resource(
                self.employee_repository.get_by_id(request.requested_for_employee_id),
                "Requested for employee not found",
            )
            if request.requested_for_employee_id
            else None
        )
        department = self.lookup_repository.get_department(request.department_id) if request.department_id else None
        category = require_resource(
            self.lookup_repository.get_category(request.category_id),
            "Asset category not found",
        )
        suggested_model = self.lookup_repository.get_model(request.suggested_model_id) if request.suggested_model_id else None
        suggested_vendor = self.lookup_repository.get_vendor(request.suggested_vendor_id) if request.suggested_vendor_id else None
        approved_by_user = self.user_repository.get_by_id(request.approved_by_user_id) if request.approved_by_user_id else None

        return AssetRequestResponse(
            id=request.id,
            requested_by_user=user_reference(requested_by_user),
            requested_for_employee=employee_reference(requested_for_employee) if requested_for_employee else None,
            department=asset_reference(department) if department else None,
            category=asset_reference(category),
            suggested_model=asset_reference(suggested_model) if suggested_model else None,
            suggested_vendor=asset_reference(suggested_vendor) if suggested_vendor else None,
            priority=request.priority,
            business_justification=request.business_justification,
            status=request.status,
            approved_by_user=user_reference(approved_by_user) if approved_by_user else None,
            approval_notes=request.approval_notes,
            approved_at=request.approved_at,
            rejected_at=request.rejected_at,
            created_at=request.created_at,
        )
