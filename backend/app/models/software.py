from datetime import date, datetime

from sqlalchemy import JSON, BigInteger, Date, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.common import TimestampMixin


class SoftwareLicense(TimestampMixin, Base):
    __tablename__ = "software_licenses"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    vendor_id: Mapped[int | None] = mapped_column(ForeignKey("vendors.id"), nullable=True)
    product_name: Mapped[str] = mapped_column(String(150))
    license_type: Mapped[str] = mapped_column(String(100))
    purchased_quantity: Mapped[int] = mapped_column(Integer)
    purchase_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    expiry_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    renewal_alert_days: Mapped[int] = mapped_column(Integer, default=30)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)


class SoftwareLicenseAssignment(TimestampMixin, Base):
    __tablename__ = "software_license_assignments"
    __table_args__ = (
        UniqueConstraint("software_license_id", "user_id", "asset_id", "revoked_at", name="uq_license_assignment_open_target"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    software_license_id: Mapped[int] = mapped_column(ForeignKey("software_licenses.id"))
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    asset_id: Mapped[int | None] = mapped_column(ForeignKey("assets.id"), nullable=True)
    assigned_by_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    assigned_at: Mapped[datetime] = mapped_column(DateTime(), nullable=False, server_default=func.now())
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)


class SoftwareLicenseEventLog(TimestampMixin, Base):
    __tablename__ = "software_license_event_log"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    software_license_id: Mapped[int] = mapped_column(ForeignKey("software_licenses.id"))
    event_type: Mapped[str] = mapped_column(String(50))
    performed_by_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    summary: Mapped[str] = mapped_column(String(255))
    details_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)
