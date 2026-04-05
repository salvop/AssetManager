"""add user preferences and app settings

Revision ID: 0009_user_prefs_settings
Revises: 0008_normalize_assignment_schema
Create Date: 2026-04-05 16:10:00
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0009_user_prefs_settings"
down_revision: str | None = "0008_normalize_assignment_schema"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    connection = op.get_bind()
    inspector = sa.inspect(connection)
    table_names = set(inspector.get_table_names())

    if "user_preferences" not in table_names:
        op.create_table(
            "user_preferences",
            sa.Column("user_id", sa.BigInteger(), sa.ForeignKey("users.id"), primary_key=True),
            sa.Column("language", sa.String(length=10), nullable=False, server_default="it-IT"),
            sa.Column("timezone", sa.String(length=64), nullable=False, server_default="Europe/Rome"),
            sa.Column("date_format", sa.String(length=20), nullable=False, server_default="DD/MM/YYYY"),
            sa.Column("table_density", sa.String(length=20), nullable=False, server_default="comfortable"),
            sa.Column("default_page_size", sa.Integer(), nullable=False, server_default="25"),
            sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
            sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
            sa.CheckConstraint("default_page_size BETWEEN 10 AND 200", name="ck_user_preferences_page_size"),
        )

    if "app_settings" not in table_names:
        op.create_table(
            "app_settings",
            sa.Column("id", sa.SmallInteger(), primary_key=True),
            sa.Column("org_name", sa.String(length=120), nullable=False, server_default="Asset Manager"),
            sa.Column(
                "default_asset_status_on_create_id",
                sa.BigInteger(),
                sa.ForeignKey("asset_statuses.id"),
                nullable=False,
            ),
            sa.Column("max_document_size_mb", sa.Integer(), nullable=False, server_default="10"),
            sa.Column("allowed_document_mime_types", sa.Text(), nullable=False),
            sa.Column("updated_by_user_id", sa.BigInteger(), sa.ForeignKey("users.id"), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
            sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
            sa.CheckConstraint("max_document_size_mb BETWEEN 1 AND 100", name="ck_app_settings_max_document_size"),
        )

    status_id = connection.execute(
        sa.text("SELECT id FROM asset_statuses WHERE code = :code"),
        {"code": "IN_STOCK"},
    ).scalar()
    if status_id is None:
        raise RuntimeError("IN_STOCK status must exist before creating app settings")

    existing_settings_id = connection.execute(sa.text("SELECT id FROM app_settings WHERE id = 1")).scalar()
    if existing_settings_id is None:
        connection.execute(
            sa.text(
                """
                INSERT INTO app_settings (
                    id,
                    org_name,
                    default_asset_status_on_create_id,
                    max_document_size_mb,
                    allowed_document_mime_types
                ) VALUES (
                    1,
                    :org_name,
                    :status_id,
                    :max_document_size_mb,
                    :allowed_document_mime_types
                )
                """
            ),
            {
                "org_name": "Asset Manager",
                "status_id": int(status_id),
                "max_document_size_mb": 10,
                "allowed_document_mime_types": "application/pdf,image/png,image/jpeg,text/plain",
            },
        )


def downgrade() -> None:
    op.drop_table("app_settings")
    op.drop_table("user_preferences")
