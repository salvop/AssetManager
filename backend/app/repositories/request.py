from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.request import AssetRequest


class AssetRequestRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def add(self, request: AssetRequest) -> AssetRequest:
        self.db.add(request)
        self.db.flush()
        self.db.refresh(request)
        return request

    def get_by_id(self, request_id: int) -> AssetRequest | None:
        return self.db.get(AssetRequest, request_id)

    def list_requests(self, *, page: int, page_size: int) -> tuple[list[AssetRequest], int]:
        query = select(AssetRequest).order_by(AssetRequest.created_at.desc())
        total = self.db.scalar(select(func.count()).select_from(AssetRequest)) or 0
        items = self.db.scalars(query.offset((page - 1) * page_size).limit(page_size)).all()
        return items, total
