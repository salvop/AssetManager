from datetime import datetime

from sqlalchemy import BigInteger, DateTime, ForeignKey, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class AssetAssignment(Base):
    __tablename__ = "asset_assignments"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    asset_id: Mapped[int] = mapped_column(ForeignKey("assets.id"))
    employee_id: Mapped[int] = mapped_column(ForeignKey("employees.id"))
    assigned_by_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    department_id: Mapped[int | None] = mapped_column(ForeignKey("departments.id"), nullable=True)
    location_id: Mapped[int | None] = mapped_column(ForeignKey("locations.id"), nullable=True)
    assigned_at: Mapped[datetime] = mapped_column(DateTime(), nullable=False, server_default=func.now())
    expected_return_at: Mapped[datetime | None] = mapped_column(DateTime(), nullable=True)
    returned_at: Mapped[datetime | None] = mapped_column(DateTime(), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
