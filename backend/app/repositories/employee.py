from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.employee import Employee


class EmployeeRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list_employees(self) -> list[Employee]:
        return self.db.scalars(select(Employee).order_by(Employee.full_name.asc())).all()

    def list_employees_paginated(self, *, page: int, page_size: int) -> tuple[list[Employee], int]:
        total = self.db.scalar(select(func.count()).select_from(Employee)) or 0
        statement = (
            select(Employee)
            .order_by(Employee.full_name.asc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        return self.db.scalars(statement).all(), total

    def get_by_id(self, employee_id: int) -> Employee | None:
        return self.db.get(Employee, employee_id)

    def add(self, employee: Employee) -> Employee:
        self.db.add(employee)
        self.db.flush()
        self.db.refresh(employee)
        return employee

    def save(self, employee: Employee) -> Employee:
        self.db.add(employee)
        self.db.flush()
        self.db.refresh(employee)
        return employee
