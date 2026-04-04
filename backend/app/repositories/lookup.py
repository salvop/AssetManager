from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.asset import Asset
from app.models.assignment import AssetAssignment
from app.models.lookup import AssetCategory, AssetModel, AssetStatus, Department, Location, Vendor
from app.models.maintenance import MaintenanceTicket
from app.models.user import User


class LookupRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list_departments(self) -> list[Department]:
        return self.db.scalars(select(Department).order_by(Department.name)).all()

    def list_locations(self) -> list[Location]:
        return self.db.scalars(select(Location).order_by(Location.name)).all()

    def list_vendors(self) -> list[Vendor]:
        return self.db.scalars(select(Vendor).order_by(Vendor.name)).all()

    def list_asset_categories(self) -> list[AssetCategory]:
        return self.db.scalars(select(AssetCategory).order_by(AssetCategory.name)).all()

    def list_asset_statuses(self) -> list[AssetStatus]:
        return self.db.scalars(select(AssetStatus).order_by(AssetStatus.name)).all()

    def list_asset_models(self) -> list[AssetModel]:
        return self.db.scalars(select(AssetModel).order_by(AssetModel.name)).all()

    def get_department(self, department_id: int) -> Department | None:
        return self.db.get(Department, department_id)

    def get_location(self, location_id: int) -> Location | None:
        return self.db.get(Location, location_id)

    def get_vendor(self, vendor_id: int) -> Vendor | None:
        return self.db.get(Vendor, vendor_id)

    def get_category(self, category_id: int) -> AssetCategory | None:
        return self.db.get(AssetCategory, category_id)

    def get_model(self, model_id: int) -> AssetModel | None:
        return self.db.get(AssetModel, model_id)

    def get_status(self, status_id: int) -> AssetStatus | None:
        return self.db.get(AssetStatus, status_id)

    def get_status_by_code(self, code: str) -> AssetStatus | None:
        return self.db.scalars(select(AssetStatus).where(AssetStatus.code == code)).first()

    def add_department(self, department: Department) -> Department:
        self.db.add(department)
        return department

    def add_location(self, location: Location) -> Location:
        self.db.add(location)
        return location

    def add_vendor(self, vendor: Vendor) -> Vendor:
        self.db.add(vendor)
        return vendor

    def add_asset_category(self, category: AssetCategory) -> AssetCategory:
        self.db.add(category)
        return category

    def add_asset_model(self, model: AssetModel) -> AssetModel:
        self.db.add(model)
        return model

    def save(self, entity):
        self.db.add(entity)
        return entity

    def delete(self, entity) -> None:
        self.db.delete(entity)

    def department_is_in_use(self, department_id: int) -> bool:
        return any(
            (
                self._has_references(User.department_id == department_id, User),
                self._has_references(Asset.current_department_id == department_id, Asset),
                self._has_references(AssetAssignment.department_id == department_id, AssetAssignment),
            )
        )

    def location_is_in_use(self, location_id: int) -> bool:
        return any(
            (
                self._has_references(Location.parent_id == location_id, Location),
                self._has_references(Asset.location_id == location_id, Asset),
                self._has_references(AssetAssignment.location_id == location_id, AssetAssignment),
            )
        )

    def vendor_is_in_use(self, vendor_id: int) -> bool:
        return any(
            (
                self._has_references(Asset.vendor_id == vendor_id, Asset),
                self._has_references(AssetModel.vendor_id == vendor_id, AssetModel),
                self._has_references(MaintenanceTicket.vendor_id == vendor_id, MaintenanceTicket),
            )
        )

    def category_is_in_use(self, category_id: int) -> bool:
        return any(
            (
                self._has_references(Asset.category_id == category_id, Asset),
                self._has_references(AssetModel.category_id == category_id, AssetModel),
            )
        )

    def model_is_in_use(self, model_id: int) -> bool:
        return self._has_references(Asset.model_id == model_id, Asset)

    def _has_references(self, where_clause, model) -> bool:
        total = self.db.scalar(select(func.count()).select_from(model).where(where_clause))
        return bool(total)
