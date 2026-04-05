from datetime import datetime

from sqlalchemy import BigInteger, DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.common import TimestampMixin


class AssetRequest(TimestampMixin, Base):
    __tablename__ = "asset_requests"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    requested_by_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    requested_for_employee_id: Mapped[int | None] = mapped_column(ForeignKey("employees.id"), nullable=True)
    department_id: Mapped[int | None] = mapped_column(ForeignKey("departments.id"), nullable=True)
    category_id: Mapped[int] = mapped_column(ForeignKey("asset_categories.id"))
    suggested_model_id: Mapped[int | None] = mapped_column(ForeignKey("asset_models.id"), nullable=True)
    suggested_vendor_id: Mapped[int | None] = mapped_column(ForeignKey("vendors.id"), nullable=True)
    priority: Mapped[str] = mapped_column(String(20), nullable=False, server_default="NORMAL")
    business_justification: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(30), nullable=False, server_default="PENDING_APPROVAL")
    approved_by_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    approval_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    approved_at: Mapped[datetime | None] = mapped_column(DateTime(), nullable=True)
    rejected_at: Mapped[datetime | None] = mapped_column(DateTime(), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(), nullable=False, server_default=func.now(), onupdate=func.now())
