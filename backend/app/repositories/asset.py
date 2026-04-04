from sqlalchemy import Select, func, or_, select
from sqlalchemy.orm import Session

from app.models.asset import Asset, AssetDocument, AssetEventLog


class AssetRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list_assets(
        self,
        *,
        search: str | None,
        status_id: int | None,
        category_id: int | None,
        model_id: int | None,
        location_id: int | None,
        department_id: int | None,
        assigned_user_id: int | None,
        vendor_id: int | None,
        page: int,
        page_size: int,
        sort_by: str,
        sort_dir: str,
    ) -> tuple[list[Asset], int]:
        query: Select[tuple[Asset]] = select(Asset)

        if search:
            pattern = f"%{search}%"
            query = query.where(or_(Asset.asset_tag.ilike(pattern), Asset.name.ilike(pattern)))
        if status_id:
            query = query.where(Asset.status_id == status_id)
        if category_id:
            query = query.where(Asset.category_id == category_id)
        if model_id:
            query = query.where(Asset.model_id == model_id)
        if location_id:
            query = query.where(Asset.location_id == location_id)
        if department_id:
            query = query.where(Asset.current_department_id == department_id)
        if assigned_user_id:
            query = query.where(Asset.assigned_user_id == assigned_user_id)
        if vendor_id:
            query = query.where(Asset.vendor_id == vendor_id)

        sort_map = {
            "asset_tag": Asset.asset_tag,
            "name": Asset.name,
            "created_at": Asset.created_at,
            "updated_at": Asset.updated_at,
        }
        sort_column = sort_map.get(sort_by, Asset.asset_tag)
        if sort_dir.lower() == "desc":
            query = query.order_by(sort_column.desc())
        else:
            query = query.order_by(sort_column.asc())

        total = self.db.scalar(select(func.count()).select_from(query.subquery())) or 0
        items = self.db.scalars(query.offset((page - 1) * page_size).limit(page_size)).all()
        return items, total

    def add(self, asset: Asset) -> Asset:
        self.db.add(asset)
        self.db.flush()
        self.db.refresh(asset)
        return asset

    def get_by_id(self, asset_id: int) -> Asset | None:
        return self.db.get(Asset, asset_id)

    def get_by_asset_tag(self, asset_tag: str) -> Asset | None:
        return self.db.scalars(select(Asset).where(Asset.asset_tag == asset_tag)).first()

    def add_event(self, event: AssetEventLog) -> AssetEventLog:
        self.db.add(event)
        self.db.flush()
        self.db.refresh(event)
        return event

    def list_events(self, asset_id: int) -> list[AssetEventLog]:
        return self.db.scalars(
            select(AssetEventLog).where(AssetEventLog.asset_id == asset_id).order_by(AssetEventLog.created_at.desc())
        ).all()

    def add_document(self, document: AssetDocument) -> AssetDocument:
        self.db.add(document)
        self.db.flush()
        self.db.refresh(document)
        return document

    def list_documents(self, asset_id: int) -> list[AssetDocument]:
        return self.db.scalars(
            select(AssetDocument).where(AssetDocument.asset_id == asset_id).order_by(AssetDocument.created_at.desc())
        ).all()

    def get_document(self, document_id: int) -> AssetDocument | None:
        return self.db.get(AssetDocument, document_id)

    def delete_document(self, document: AssetDocument) -> None:
        self.db.delete(document)
