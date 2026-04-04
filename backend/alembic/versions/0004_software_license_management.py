"""software license management

Revision ID: 0004_software_license_management
Revises: 0003_asset_registry_extensions
Create Date: 2026-04-05 00:25:00
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0004_software_license_management"
down_revision: str | None = "0003_asset_registry_extensions"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "software_licenses",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("vendor_id", sa.BigInteger(), nullable=True),
        sa.Column("product_name", sa.String(length=150), nullable=False),
        sa.Column("license_type", sa.String(length=100), nullable=False),
        sa.Column("purchased_quantity", sa.Integer(), nullable=False),
        sa.Column("purchase_date", sa.Date(), nullable=True),
        sa.Column("expiry_date", sa.Date(), nullable=True),
        sa.Column("renewal_alert_days", sa.Integer(), nullable=False, server_default="30"),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["vendor_id"], ["vendors.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "software_license_assignments",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("software_license_id", sa.BigInteger(), nullable=False),
        sa.Column("user_id", sa.BigInteger(), nullable=True),
        sa.Column("asset_id", sa.BigInteger(), nullable=True),
        sa.Column("assigned_by_user_id", sa.BigInteger(), nullable=False),
        sa.Column("assigned_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("revoked_at", sa.DateTime(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["asset_id"], ["assets.id"]),
        sa.ForeignKeyConstraint(["assigned_by_user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["software_license_id"], ["software_licenses.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "software_license_id",
            "user_id",
            "asset_id",
            "revoked_at",
            name="uq_license_assignment_open_target",
        ),
    )
    op.create_table(
        "software_license_event_log",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("software_license_id", sa.BigInteger(), nullable=False),
        sa.Column("event_type", sa.String(length=50), nullable=False),
        sa.Column("performed_by_user_id", sa.BigInteger(), nullable=True),
        sa.Column("summary", sa.String(length=255), nullable=False),
        sa.Column("details_json", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["performed_by_user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["software_license_id"], ["software_licenses.id"]),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("software_license_event_log")
    op.drop_table("software_license_assignments")
    op.drop_table("software_licenses")
