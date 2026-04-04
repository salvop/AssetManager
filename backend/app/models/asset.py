from datetime import date, datetime

from sqlalchemy import JSON, BigInteger, Date, DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.common import TimestampMixin


class Asset(TimestampMixin, Base):
    __tablename__ = "assets"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    asset_tag: Mapped[str] = mapped_column(String(100), unique=True)
    serial_number: Mapped[str | None] = mapped_column(String(150), nullable=True)
    asset_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    brand: Mapped[str | None] = mapped_column(String(150), nullable=True)
    category_id: Mapped[int] = mapped_column(ForeignKey("asset_categories.id"))
    model_id: Mapped[int | None] = mapped_column(ForeignKey("asset_models.id"), nullable=True)
    status_id: Mapped[int] = mapped_column(ForeignKey("asset_statuses.id"))
    location_id: Mapped[int | None] = mapped_column(ForeignKey("locations.id"), nullable=True)
    vendor_id: Mapped[int | None] = mapped_column(ForeignKey("vendors.id"), nullable=True)
    assigned_employee_id: Mapped[int | None] = mapped_column(ForeignKey("employees.id"), nullable=True)
    current_department_id: Mapped[int | None] = mapped_column(ForeignKey("departments.id"), nullable=True)
    name: Mapped[str] = mapped_column(String(150))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    purchase_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    warranty_expiry_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    expected_end_of_life_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    disposal_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    cost_center: Mapped[str | None] = mapped_column(String(100), nullable=True)
    location_floor: Mapped[str | None] = mapped_column(String(50), nullable=True)
    location_room: Mapped[str | None] = mapped_column(String(100), nullable=True)
    location_rack: Mapped[str | None] = mapped_column(String(100), nullable=True)
    location_slot: Mapped[str | None] = mapped_column(String(100), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(), nullable=False, server_default=func.now(), onupdate=func.now())


class AssetEventLog(TimestampMixin, Base):
    __tablename__ = "asset_event_log"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    asset_id: Mapped[int] = mapped_column(ForeignKey("assets.id"))
    event_type: Mapped[str] = mapped_column(String(50))
    performed_by_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    summary: Mapped[str] = mapped_column(String(255))
    details_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)


class AssetDocument(TimestampMixin, Base):
    __tablename__ = "asset_documents"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    asset_id: Mapped[int] = mapped_column(ForeignKey("assets.id"))
    uploaded_by_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    file_name: Mapped[str] = mapped_column(String(255))
    stored_name: Mapped[str] = mapped_column(String(255))
    content_type: Mapped[str] = mapped_column(String(100))
    size_bytes: Mapped[int] = mapped_column(BigInteger)
