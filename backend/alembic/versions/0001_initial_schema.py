"""initial schema"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa

revision = "0001_initial_schema"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "departments",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("code", sa.String(length=50), nullable=False),
        sa.Column("name", sa.String(length=150), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint("code", name="uq_departments_code"),
    )
    op.create_table(
        "roles",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("code", sa.String(length=50), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint("code", name="uq_roles_code"),
    )
    op.create_table(
        "locations",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("code", sa.String(length=50), nullable=False),
        sa.Column("name", sa.String(length=150), nullable=False),
        sa.Column("parent_id", sa.BigInteger(), sa.ForeignKey("locations.id"), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint("code", name="uq_locations_code"),
    )
    op.create_table(
        "vendors",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("name", sa.String(length=150), nullable=False),
        sa.Column("contact_email", sa.String(length=255), nullable=True),
        sa.Column("contact_phone", sa.String(length=50), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )
    op.create_table(
        "asset_categories",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("code", sa.String(length=50), nullable=False),
        sa.Column("name", sa.String(length=150), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint("code", name="uq_asset_categories_code"),
    )
    op.create_table(
        "asset_statuses",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("code", sa.String(length=50), nullable=False),
        sa.Column("name", sa.String(length=150), nullable=False),
        sa.Column("is_assignable", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint("code", name="uq_asset_statuses_code"),
    )
    op.create_table(
        "users",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("department_id", sa.BigInteger(), sa.ForeignKey("departments.id"), nullable=True),
        sa.Column("username", sa.String(length=100), nullable=False),
        sa.Column("full_name", sa.String(length=150), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=True),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint("username", name="uq_users_username"),
    )
    op.create_table(
        "user_roles",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.BigInteger(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("role_id", sa.BigInteger(), sa.ForeignKey("roles.id"), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint("user_id", "role_id", name="uq_user_roles_user_role"),
    )
    op.create_table(
        "asset_models",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("category_id", sa.BigInteger(), sa.ForeignKey("asset_categories.id"), nullable=False),
        sa.Column("vendor_id", sa.BigInteger(), sa.ForeignKey("vendors.id"), nullable=True),
        sa.Column("name", sa.String(length=150), nullable=False),
        sa.Column("manufacturer", sa.String(length=150), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )
    op.create_table(
        "assets",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("asset_tag", sa.String(length=100), nullable=False),
        sa.Column("serial_number", sa.String(length=150), nullable=True),
        sa.Column("category_id", sa.BigInteger(), sa.ForeignKey("asset_categories.id"), nullable=False),
        sa.Column("model_id", sa.BigInteger(), sa.ForeignKey("asset_models.id"), nullable=True),
        sa.Column("status_id", sa.BigInteger(), sa.ForeignKey("asset_statuses.id"), nullable=False),
        sa.Column("location_id", sa.BigInteger(), sa.ForeignKey("locations.id"), nullable=True),
        sa.Column("vendor_id", sa.BigInteger(), sa.ForeignKey("vendors.id"), nullable=True),
        sa.Column("assigned_user_id", sa.BigInteger(), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("current_department_id", sa.BigInteger(), sa.ForeignKey("departments.id"), nullable=True),
        sa.Column("name", sa.String(length=150), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("purchase_date", sa.Date(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint("asset_tag", name="uq_assets_asset_tag"),
    )
    op.create_table(
        "asset_assignments",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("asset_id", sa.BigInteger(), sa.ForeignKey("assets.id"), nullable=False),
        sa.Column("user_id", sa.BigInteger(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("assigned_by_user_id", sa.BigInteger(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("department_id", sa.BigInteger(), sa.ForeignKey("departments.id"), nullable=True),
        sa.Column("location_id", sa.BigInteger(), sa.ForeignKey("locations.id"), nullable=True),
        sa.Column("assigned_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("expected_return_at", sa.DateTime(), nullable=True),
        sa.Column("returned_at", sa.DateTime(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
    )
    op.create_table(
        "asset_event_log",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("asset_id", sa.BigInteger(), sa.ForeignKey("assets.id"), nullable=False),
        sa.Column("event_type", sa.String(length=50), nullable=False),
        sa.Column("performed_by_user_id", sa.BigInteger(), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("summary", sa.String(length=255), nullable=False),
        sa.Column("details_json", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )
    op.create_table(
        "asset_documents",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("asset_id", sa.BigInteger(), sa.ForeignKey("assets.id"), nullable=False),
        sa.Column("uploaded_by_user_id", sa.BigInteger(), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("file_name", sa.String(length=255), nullable=False),
        sa.Column("stored_name", sa.String(length=255), nullable=False),
        sa.Column("content_type", sa.String(length=100), nullable=False),
        sa.Column("size_bytes", sa.BigInteger(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )
    op.create_table(
        "maintenance_tickets",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("asset_id", sa.BigInteger(), sa.ForeignKey("assets.id"), nullable=False),
        sa.Column("vendor_id", sa.BigInteger(), sa.ForeignKey("vendors.id"), nullable=True),
        sa.Column("opened_by_user_id", sa.BigInteger(), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("status", sa.String(length=50), nullable=False),
        sa.Column("title", sa.String(length=150), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("opened_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("closed_at", sa.DateTime(), nullable=True),
    )

    op.create_index("ix_assets_status_id", "assets", ["status_id"])
    op.create_index("ix_assets_category_id", "assets", ["category_id"])
    op.create_index("ix_assets_model_id", "assets", ["model_id"])
    op.create_index("ix_assets_location_id", "assets", ["location_id"])
    op.create_index("ix_assets_department_id", "assets", ["current_department_id"])
    op.create_index("ix_assets_assigned_user_id", "assets", ["assigned_user_id"])
    op.create_index("ix_assets_vendor_id", "assets", ["vendor_id"])
    op.create_index("ix_asset_assignments_asset_id", "asset_assignments", ["asset_id"])
    op.create_index("ix_asset_assignments_user_id", "asset_assignments", ["user_id"])
    op.create_index("ix_asset_events_asset_id", "asset_event_log", ["asset_id"])
    op.create_index("ix_maintenance_tickets_asset_id", "maintenance_tickets", ["asset_id"])


def downgrade() -> None:
    op.drop_index("ix_maintenance_tickets_asset_id", table_name="maintenance_tickets")
    op.drop_index("ix_asset_events_asset_id", table_name="asset_event_log")
    op.drop_index("ix_asset_assignments_user_id", table_name="asset_assignments")
    op.drop_index("ix_asset_assignments_asset_id", table_name="asset_assignments")
    op.drop_index("ix_assets_vendor_id", table_name="assets")
    op.drop_index("ix_assets_assigned_user_id", table_name="assets")
    op.drop_index("ix_assets_department_id", table_name="assets")
    op.drop_index("ix_assets_location_id", table_name="assets")
    op.drop_index("ix_assets_model_id", table_name="assets")
    op.drop_index("ix_assets_category_id", table_name="assets")
    op.drop_index("ix_assets_status_id", table_name="assets")
    op.drop_table("maintenance_tickets")
    op.drop_table("asset_documents")
    op.drop_table("asset_event_log")
    op.drop_table("asset_assignments")
    op.drop_table("assets")
    op.drop_table("asset_models")
    op.drop_table("user_roles")
    op.drop_table("users")
    op.drop_table("asset_statuses")
    op.drop_table("asset_categories")
    op.drop_table("vendors")
    op.drop_table("locations")
    op.drop_table("roles")
    op.drop_table("departments")
