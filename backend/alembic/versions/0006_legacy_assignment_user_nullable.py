"""allow legacy assignment user column to be nullable

Revision ID: 0006_assign_user_null
Revises: 0005_employee_assignees
Create Date: 2026-04-05 11:00:00
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0006_assign_user_null"
down_revision: str | None = "0005_employee_assignees"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    inspector = sa.inspect(op.get_bind())
    user_column = next(column for column in inspector.get_columns("asset_assignments") if column["name"] == "user_id")
    if not user_column.get("nullable", False):
        op.alter_column("asset_assignments", "user_id", existing_type=sa.BigInteger(), nullable=True)


def downgrade() -> None:
    inspector = sa.inspect(op.get_bind())
    user_column = next(column for column in inspector.get_columns("asset_assignments") if column["name"] == "user_id")
    if user_column.get("nullable", True):
        op.alter_column("asset_assignments", "user_id", existing_type=sa.BigInteger(), nullable=False)
