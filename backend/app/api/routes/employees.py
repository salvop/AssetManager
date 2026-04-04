from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.employee import (
    EmployeeCreateRequest,
    EmployeeListItemResponse,
    EmployeeListResponse,
    EmployeeUpdateRequest,
)
from app.security.deps import require_roles
from app.services.employees import EmployeeService

router = APIRouter()


@router.get("", response_model=EmployeeListResponse)
def list_employees(
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN", "ASSET_MANAGER", "OPERATOR", "VIEWER")),
) -> EmployeeListResponse:
    return EmployeeService(db).list_employees()


@router.get("/{employee_id}", response_model=EmployeeListItemResponse)
def get_employee(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN", "ASSET_MANAGER", "OPERATOR", "VIEWER")),
) -> EmployeeListItemResponse:
    return EmployeeService(db).get_employee(employee_id)


@router.post("", response_model=EmployeeListItemResponse)
def create_employee(
    payload: EmployeeCreateRequest,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN", "ASSET_MANAGER", "OPERATOR")),
) -> EmployeeListItemResponse:
    return EmployeeService(db).create_employee(payload)


@router.put("/{employee_id}", response_model=EmployeeListItemResponse)
def update_employee(
    employee_id: int,
    payload: EmployeeUpdateRequest,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN", "ASSET_MANAGER", "OPERATOR")),
) -> EmployeeListItemResponse:
    return EmployeeService(db).update_employee(employee_id, payload)
