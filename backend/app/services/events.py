from sqlalchemy.orm import Session

from app.models.asset import AssetEventLog
from app.repositories.asset import AssetRepository


class AssetEventService:
    def __init__(self, db: Session) -> None:
        self.repository = AssetRepository(db)

    def log_event(
        self,
        *,
        asset_id: int,
        event_type: str,
        summary: str,
        performed_by_user_id: int | None,
        details: dict | None = None,
    ) -> AssetEventLog:
        event = AssetEventLog(
            asset_id=asset_id,
            event_type=event_type,
            summary=summary,
            performed_by_user_id=performed_by_user_id,
            details_json=details,
        )
        return self.repository.add_event(event)
