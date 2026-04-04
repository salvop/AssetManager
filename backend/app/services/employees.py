from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.employee import Employee
from app.repositories.employee import EmployeeRepository
from app.repositories.lookup import LookupRepository
from app.schemas.employee import (
    EmployeeCreateRequest,
    EmployeeListItemResponse,
    EmployeeListResponse,
    EmployeeUpdateRequest,
)


class EmployeeService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repository = EmployeeRepository(db)
        self.lookup_repository = LookupRepository(db)

    def list_employees(self) -> EmployeeListResponse:
        return EmployeeListResponse(items=[self._build_item(item) for item in self.repository.list_employees()])

    def get_employee(self, employee_id: int) -> EmployeeListItemResponse:
        employee = self.repository.get_by_id(employee_id)
        if employee is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")
        return self._build_item(employee)

    def create_employee(self, payload: EmployeeCreateRequest) -> EmployeeListItemResponse:
        self._validate_department(payload.department_id)
        employee = Employee(**payload.model_dump())
        self.repository.add(employee)
        self._commit_with_conflict("Esiste gia una risorsa con questo codice o email.")
        return self.get_employee(employee.id)

    def update_employee(self, employee_id: int, payload: EmployeeUpdateRequest) -> EmployeeListItemResponse:
        employee = self.repository.get_by_id(employee_id)
        if employee is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")
        self._validate_department(payload.department_id)
        for key, value in payload.model_dump().items():
            setattr(employee, key, value)
        self.repository.save(employee)
        self._commit_with_conflict("Esiste gia una risorsa con questo codice o email.")
        return self.get_employee(employee.id)

    def _validate_department(self, department_id: int | None) -> None:
        if department_id is not None and self.lookup_repository.get_department(department_id) is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Department not found")

    def _build_item(self, employee: Employee) -> EmployeeListItemResponse:
        return EmployeeListItemResponse(
            id=employee.id,
            employee_code=employee.employee_code,
            full_name=employee.full_name,
            email=employee.email,
            department_id=employee.department_id,
            is_active=employee.is_active,
            notes=employee.notes,
        )

    def _commit_with_conflict(self, detail: str) -> None:
        try:
            self.db.commit()
        except IntegrityError as exc:
            self.db.rollback()
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=detail) from exc
