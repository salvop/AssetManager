from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.asset import Asset
from app.models.lookup import AssetStatus
from app.models.maintenance import MaintenanceTicket
from app.schemas.dashboard import (
    DashboardRecentAssetResponse,
    DashboardRecentTicketResponse,
    DashboardSummaryResponse,
    StatusCountResponse,
)


class DashboardService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_summary(self) -> DashboardSummaryResponse:
        total_assets = self.db.scalar(select(func.count()).select_from(Asset)) or 0
        assigned_assets = self.db.scalar(
            select(func.count()).select_from(Asset).where(Asset.assigned_user_id.is_not(None))
        ) or 0
        assets_in_maintenance = self.db.scalar(
            select(func.count())
            .select_from(Asset)
            .join(AssetStatus, AssetStatus.id == Asset.status_id)
            .where(AssetStatus.code == "MAINTENANCE")
        ) or 0
        open_tickets = self.db.scalar(
            select(func.count()).select_from(MaintenanceTicket).where(MaintenanceTicket.closed_at.is_(None))
        ) or 0
        status_rows = self.db.execute(
            select(AssetStatus.id, AssetStatus.code, AssetStatus.name, func.count(Asset.id))
            .select_from(AssetStatus)
            .join(Asset, Asset.status_id == AssetStatus.id, isouter=True)
            .group_by(AssetStatus.id, AssetStatus.code, AssetStatus.name)
            .order_by(AssetStatus.name.asc())
        ).all()
        recent_assets = self.db.execute(
            select(Asset.id, Asset.asset_tag, Asset.name, AssetStatus.code, AssetStatus.name)
            .join(AssetStatus, AssetStatus.id == Asset.status_id)
            .order_by(Asset.created_at.desc())
            .limit(5)
        ).all()
        recent_open_tickets = self.db.execute(
            select(
                MaintenanceTicket.id,
                MaintenanceTicket.title,
                MaintenanceTicket.status,
                Asset.id,
                Asset.name,
                Asset.asset_tag,
            )
            .join(Asset, Asset.id == MaintenanceTicket.asset_id)
            .where(MaintenanceTicket.closed_at.is_(None))
            .order_by(MaintenanceTicket.opened_at.desc())
            .limit(5)
        ).all()

        return DashboardSummaryResponse(
            total_assets=total_assets,
            assigned_assets=assigned_assets,
            assets_in_maintenance=assets_in_maintenance,
            open_maintenance_tickets=open_tickets,
            assets_by_status=[
                StatusCountResponse(
                    status_id=row[0],
                    status_code=row[1],
                    status_name=row[2],
                    total=row[3],
                )
                for row in status_rows
            ],
            recent_assets=[
                DashboardRecentAssetResponse(
                    id=row[0],
                    asset_tag=row[1],
                    name=row[2],
                    status_code=row[3],
                    status_name=row[4],
                )
                for row in recent_assets
            ],
            recent_open_tickets=[
                DashboardRecentTicketResponse(
                    id=row[0],
                    title=row[1],
                    status=row[2],
                    asset_id=row[3],
                    asset_name=row[4],
                    asset_tag=row[5],
                )
                for row in recent_open_tickets
            ],
        )
