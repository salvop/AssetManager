from datetime import date

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.asset import Asset
from app.models.employee import Employee
from app.models.assignment import AssetAssignment
from app.models.lookup import AssetStatus, Location
from app.models.maintenance import MaintenanceTicket
from app.schemas.dashboard import (
    DashboardAssignmentAlertResponse,
    DashboardNotificationResponse,
    DashboardLifecycleAlertResponse,
    DashboardRecentAssetResponse,
    DashboardRecentTicketResponse,
    DashboardSoftwareLicenseAlertResponse,
    DashboardSummaryResponse,
    DashboardWorkflowAssetResponse,
    DashboardWorkflowTicketResponse,
    StatusCountResponse,
)
from app.services.software import SoftwareLicenseService


class DashboardService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_summary(self) -> DashboardSummaryResponse:
        today = date.today()
        total_assets = self.db.scalar(select(func.count()).select_from(Asset)) or 0
        assigned_assets = self.db.scalar(
            select(func.count()).select_from(Asset).where(Asset.assigned_employee_id.is_not(None))
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
        software_license_alerts_raw = SoftwareLicenseService(self.db).build_license_alerts(today=today)
        software_licenses_expiring_soon = len(software_license_alerts_raw)
        warranties_expiring_soon = self.db.scalar(
            select(func.count())
            .select_from(Asset)
            .where(Asset.warranty_expiry_date.is_not(None))
            .where(func.datediff(Asset.warranty_expiry_date, func.curdate()) >= 0)
            .where(func.datediff(Asset.warranty_expiry_date, func.curdate()) <= 60)
        ) or 0
        end_of_life_soon = self.db.scalar(
            select(func.count())
            .select_from(Asset)
            .where(Asset.expected_end_of_life_date.is_not(None))
            .where(func.datediff(Asset.expected_end_of_life_date, func.curdate()) >= 0)
            .where(func.datediff(Asset.expected_end_of_life_date, func.curdate()) <= 60)
        ) or 0
        status_rows = self.db.execute(
            select(AssetStatus.id, AssetStatus.code, AssetStatus.name, func.count(Asset.id))
            .select_from(AssetStatus)
            .join(Asset, Asset.status_id == AssetStatus.id, isouter=True)
            .group_by(AssetStatus.id, AssetStatus.code, AssetStatus.name)
            .order_by(AssetStatus.name.asc())
        ).all()
        recent_assets = self.db.execute(
            select(
                Asset.id,
                Asset.asset_tag,
                Asset.name,
                AssetStatus.code,
                AssetStatus.name,
                Asset.warranty_expiry_date,
                Asset.expected_end_of_life_date,
            )
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
        ready_for_assignment_rows = self.db.execute(
            select(
                Asset.id,
                Asset.asset_tag,
                Asset.name,
                AssetStatus.code,
                AssetStatus.name,
                Location.name,
            )
            .join(AssetStatus, AssetStatus.id == Asset.status_id)
            .join(Location, Location.id == Asset.location_id, isouter=True)
            .where(Asset.assigned_employee_id.is_(None))
            .where(AssetStatus.code == "IN_STOCK")
            .order_by(Asset.created_at.desc())
            .limit(6)
        ).all()
        retired_pending_disposal_rows = self.db.execute(
            select(
                Asset.id,
                Asset.asset_tag,
                Asset.name,
                AssetStatus.code,
                AssetStatus.name,
                Location.name,
            )
            .join(AssetStatus, AssetStatus.id == Asset.status_id)
            .join(Location, Location.id == Asset.location_id, isouter=True)
            .where(AssetStatus.code == "RETIRED")
            .where(Asset.disposal_date.is_(None))
            .order_by(Asset.updated_at.desc())
            .limit(6)
        ).all()
        maintenance_queue_rows = self.db.execute(
            select(
                MaintenanceTicket.id,
                MaintenanceTicket.title,
                MaintenanceTicket.status,
                Asset.id,
                Asset.asset_tag,
                Asset.name,
                MaintenanceTicket.opened_at,
            )
            .join(Asset, Asset.id == MaintenanceTicket.asset_id)
            .where(MaintenanceTicket.closed_at.is_(None))
            .order_by(MaintenanceTicket.opened_at.asc())
            .limit(6)
        ).all()
        assignment_candidates = self.db.execute(
            select(
                AssetAssignment.asset_id,
                Asset.asset_tag,
                Asset.name,
                Employee.full_name,
                AssetAssignment.expected_return_at,
            )
            .join(Asset, Asset.id == AssetAssignment.asset_id)
            .join(Employee, Employee.id == AssetAssignment.employee_id)
            .where(AssetAssignment.returned_at.is_(None))
            .where(AssetAssignment.expected_return_at.is_not(None))
            .order_by(AssetAssignment.expected_return_at.asc())
        ).all()
        lifecycle_candidates = self.db.execute(
            select(
                Asset.id,
                Asset.asset_tag,
                Asset.name,
                Asset.warranty_expiry_date,
                Asset.expected_end_of_life_date,
            )
            .where(
                ((Asset.warranty_expiry_date.is_not(None)) & (Asset.warranty_expiry_date >= today))
                | ((Asset.expected_end_of_life_date.is_not(None)) & (Asset.expected_end_of_life_date >= today))
            )
            .order_by(Asset.asset_tag.asc())
        ).all()
        lifecycle_alerts: list[DashboardLifecycleAlertResponse] = []
        for row in lifecycle_candidates:
            asset_id, asset_tag, asset_name, warranty_expiry_date, expected_end_of_life_date = row
            if warranty_expiry_date is not None:
                days_remaining = (warranty_expiry_date - today).days
                if days_remaining <= 60:
                    lifecycle_alerts.append(
                        DashboardLifecycleAlertResponse(
                            asset_id=asset_id,
                            asset_tag=asset_tag,
                            asset_name=asset_name,
                            due_date=warranty_expiry_date.isoformat(),
                            alert_type="WARRANTY",
                            days_remaining=days_remaining,
                        )
                    )
            if expected_end_of_life_date is not None:
                days_remaining = (expected_end_of_life_date - today).days
                if days_remaining <= 60:
                    lifecycle_alerts.append(
                        DashboardLifecycleAlertResponse(
                            asset_id=asset_id,
                            asset_tag=asset_tag,
                            asset_name=asset_name,
                            due_date=expected_end_of_life_date.isoformat(),
                            alert_type="END_OF_LIFE",
                            days_remaining=days_remaining,
                        )
                    )
        lifecycle_alerts.sort(key=lambda item: (item.days_remaining, item.asset_tag))
        assignment_alerts: list[DashboardAssignmentAlertResponse] = []
        for row in assignment_candidates:
            asset_id, asset_tag, asset_name, assigned_employee_name, expected_return_at = row
            if expected_return_at is None:
                continue
            days_remaining = (expected_return_at.date() - today).days
            if days_remaining <= 14:
                assignment_alerts.append(
                    DashboardAssignmentAlertResponse(
                        asset_id=asset_id,
                        asset_tag=asset_tag,
                        asset_name=asset_name,
                        assigned_employee_name=assigned_employee_name,
                        expected_return_at=expected_return_at.isoformat(),
                        days_remaining=days_remaining,
                        alert_type="OVERDUE" if days_remaining < 0 else "RETURN_DUE",
                    )
                )
        assignment_alerts.sort(key=lambda item: (item.days_remaining, item.asset_tag))
        assignments_due_soon = sum(1 for item in assignment_alerts if item.days_remaining >= 0)
        overdue_assignments = sum(1 for item in assignment_alerts if item.days_remaining < 0)
        notifications: list[DashboardNotificationResponse] = []
        for alert in lifecycle_alerts[:4]:
            category = "Garanzie" if alert.alert_type == "WARRANTY" else "Fine vita"
            severity = "high" if alert.days_remaining <= 7 else "medium"
            notifications.append(
                DashboardNotificationResponse(
                    title=f"{category} in scadenza",
                    body=f"{alert.asset_tag} · {alert.asset_name} entro {alert.days_remaining} giorni",
                    severity=severity,
                    link=f"/assets/{alert.asset_id}",
                    category=category,
                )
            )
        for alert in assignment_alerts[:4]:
            severity = "high" if alert.days_remaining < 0 else "medium"
            body_suffix = (
                f"in ritardo di {abs(alert.days_remaining)} giorni"
                if alert.days_remaining < 0
                else f"rientro previsto tra {alert.days_remaining} giorni"
            )
            notifications.append(
                DashboardNotificationResponse(
                    title="Rientro asset da verificare",
                    body=f"{alert.asset_tag} · {alert.assigned_employee_name} · {body_suffix}",
                    severity=severity,
                    link=f"/assets/{alert.asset_id}/assignments",
                    category="Assegnazioni",
                )
            )
        for alert in software_license_alerts_raw[:4]:
            severity = "high" if alert["days_remaining"] <= 7 else "medium"
            notifications.append(
                DashboardNotificationResponse(
                    title="Licenza software in scadenza",
                    body=f'{alert["product_name"]} entro {alert["days_remaining"]} giorni',
                    severity=severity,
                    link=f'/software-licenses/{alert["license_id"]}',
                    category="Licenze",
                )
            )

        return DashboardSummaryResponse(
            total_assets=total_assets,
            assigned_assets=assigned_assets,
            assets_in_maintenance=assets_in_maintenance,
            open_maintenance_tickets=open_tickets,
            software_licenses_expiring_soon=software_licenses_expiring_soon,
            warranties_expiring_soon=warranties_expiring_soon,
            end_of_life_soon=end_of_life_soon,
            assignments_due_soon=assignments_due_soon,
            overdue_assignments=overdue_assignments,
            total_notifications=len(notifications),
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
                    warranty_expiry_date=row[5].isoformat() if row[5] else None,
                    expected_end_of_life_date=row[6].isoformat() if row[6] else None,
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
            lifecycle_alerts=lifecycle_alerts[:6],
            assignment_alerts=assignment_alerts[:6],
            notifications=notifications[:6],
            software_license_alerts=[
                DashboardSoftwareLicenseAlertResponse(**item)
                for item in software_license_alerts_raw[:6]
            ],
            assets_ready_for_assignment=[
                DashboardWorkflowAssetResponse(
                    asset_id=row[0],
                    asset_tag=row[1],
                    asset_name=row[2],
                    status_code=row[3],
                    status_name=row[4],
                    location_name=row[5],
                )
                for row in ready_for_assignment_rows
            ],
            retired_assets_pending_disposal=[
                DashboardWorkflowAssetResponse(
                    asset_id=row[0],
                    asset_tag=row[1],
                    asset_name=row[2],
                    status_code=row[3],
                    status_name=row[4],
                    location_name=row[5],
                )
                for row in retired_pending_disposal_rows
            ],
            maintenance_queue=[
                DashboardWorkflowTicketResponse(
                    ticket_id=row[0],
                    title=row[1],
                    status=row[2],
                    asset_id=row[3],
                    asset_tag=row[4],
                    asset_name=row[5],
                    opened_at=row[6].isoformat(),
                    opened_days=(today - row[6].date()).days,
                )
                for row in maintenance_queue_rows
            ],
        )
