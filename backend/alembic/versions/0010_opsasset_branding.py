"""update app settings branding to OpsAsset

Revision ID: 0010_opsasset_branding
Revises: 0009_user_prefs_settings
Create Date: 2026-04-05 18:20:00
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0010_opsasset_branding"
down_revision: str | None = "0009_user_prefs_settings"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    connection = op.get_bind()
    inspector = sa.inspect(connection)
    table_names = set(inspector.get_table_names())
    if "app_settings" not in table_names:
        return

    op.execute("ALTER TABLE app_settings ALTER COLUMN org_name SET DEFAULT 'OpsAsset'")
    connection.execute(
        sa.text("UPDATE app_settings SET org_name = :new_name WHERE id = 1 AND org_name = :old_name"),
        {"new_name": "OpsAsset", "old_name": "Asset Manager"},
    )


def downgrade() -> None:
    connection = op.get_bind()
    inspector = sa.inspect(connection)
    table_names = set(inspector.get_table_names())
    if "app_settings" not in table_names:
        return

    op.execute("ALTER TABLE app_settings ALTER COLUMN org_name SET DEFAULT 'Asset Manager'")
    connection.execute(
        sa.text("UPDATE app_settings SET org_name = :old_name WHERE id = 1 AND org_name = :new_name"),
        {"old_name": "Asset Manager", "new_name": "OpsAsset"},
    )
