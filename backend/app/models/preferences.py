from datetime import datetime

from sqlalchemy import BigInteger, DateTime, ForeignKey, Integer, SmallInteger, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.common import TimestampMixin


class UserPreference(TimestampMixin, Base):
    __tablename__ = "user_preferences"

    user_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id"), primary_key=True)
    language: Mapped[str] = mapped_column(String(10), nullable=False, server_default="it-IT")
    timezone: Mapped[str] = mapped_column(String(64), nullable=False, server_default="Europe/Rome")
    date_format: Mapped[str] = mapped_column(String(20), nullable=False, server_default="DD/MM/YYYY")
    table_density: Mapped[str] = mapped_column(String(20), nullable=False, server_default="comfortable")
    default_page_size: Mapped[int] = mapped_column(Integer, nullable=False, server_default="25")
    updated_at: Mapped[datetime] = mapped_column(DateTime(), nullable=False, server_default=func.now(), onupdate=func.now())


class AppSetting(TimestampMixin, Base):
    __tablename__ = "app_settings"

    id: Mapped[int] = mapped_column(SmallInteger, primary_key=True)
    org_name: Mapped[str] = mapped_column(String(120), nullable=False, server_default="OpsAsset")
    default_asset_status_on_create_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("asset_statuses.id"),
        nullable=False,
    )
    max_document_size_mb: Mapped[int] = mapped_column(Integer, nullable=False, server_default="10")
    allowed_document_mime_types: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        server_default="application/pdf,image/png,image/jpeg,text/plain",
    )
    updated_by_user_id: Mapped[int | None] = mapped_column(BigInteger, ForeignKey("users.id"), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(), nullable=False, server_default=func.now(), onupdate=func.now())
