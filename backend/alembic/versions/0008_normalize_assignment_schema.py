"""normalize assignment schema deterministically

Revision ID: 0008_normalize_assignment_schema
Revises: 0007_asset_requests
Create Date: 2026-04-05 14:30:00
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0008_normalize_assignment_schema"
down_revision: str | None = "0007_asset_requests"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Canonical schema for assignment interoperability after legacy transitions.
    op.alter_column("asset_assignments", "user_id", existing_type=sa.BigInteger(), nullable=True)
    op.alter_column("asset_assignments", "employee_id", existing_type=sa.BigInteger(), nullable=False)
    op.alter_column("assets", "assigned_employee_id", existing_type=sa.BigInteger(), nullable=True)


def downgrade() -> None:
    op.alter_column("asset_assignments", "employee_id", existing_type=sa.BigInteger(), nullable=True)
    op.alter_column("asset_assignments", "user_id", existing_type=sa.BigInteger(), nullable=False)
