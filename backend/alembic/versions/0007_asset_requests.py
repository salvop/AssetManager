"""asset requests workflow base

Revision ID: 0007_asset_requests
Revises: 0006_assign_user_null
Create Date: 2026-04-05 12:05:00
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0007_asset_requests"
down_revision: str | None = "0006_assign_user_null"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "asset_requests",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("requested_by_user_id", sa.BigInteger(), nullable=False),
        sa.Column("requested_for_employee_id", sa.BigInteger(), nullable=True),
        sa.Column("department_id", sa.BigInteger(), nullable=True),
        sa.Column("category_id", sa.BigInteger(), nullable=False),
        sa.Column("suggested_model_id", sa.BigInteger(), nullable=True),
        sa.Column("suggested_vendor_id", sa.BigInteger(), nullable=True),
        sa.Column("priority", sa.String(length=20), nullable=False, server_default="NORMAL"),
        sa.Column("business_justification", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=30), nullable=False, server_default="PENDING_APPROVAL"),
        sa.Column("approved_by_user_id", sa.BigInteger(), nullable=True),
        sa.Column("approval_notes", sa.Text(), nullable=True),
        sa.Column("approved_at", sa.DateTime(), nullable=True),
        sa.Column("rejected_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["approved_by_user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["category_id"], ["asset_categories.id"]),
        sa.ForeignKeyConstraint(["department_id"], ["departments.id"]),
        sa.ForeignKeyConstraint(["requested_by_user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["requested_for_employee_id"], ["employees.id"]),
        sa.ForeignKeyConstraint(["suggested_model_id"], ["asset_models.id"]),
        sa.ForeignKeyConstraint(["suggested_vendor_id"], ["vendors.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_asset_requests_status", "asset_requests", ["status"])
    op.create_index("ix_asset_requests_requested_by", "asset_requests", ["requested_by_user_id"])
    op.create_index("ix_asset_requests_requested_for", "asset_requests", ["requested_for_employee_id"])


def downgrade() -> None:
    op.drop_index("ix_asset_requests_requested_for", table_name="asset_requests")
    op.drop_index("ix_asset_requests_requested_by", table_name="asset_requests")
    op.drop_index("ix_asset_requests_status", table_name="asset_requests")
    op.drop_table("asset_requests")
