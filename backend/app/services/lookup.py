from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.lookup import AssetCategory, AssetModel, Department, Location, Vendor
from app.repositories.lookup import LookupRepository
from app.schemas.lookup import (
    AssetModelCreateRequest,
    AssetModelUpdateRequest,
    LookupCreateRequest,
    LookupItemResponse,
    LookupListResponse,
    LookupUpdateRequest,
    VendorCreateRequest,
    VendorUpdateRequest,
)
from app.services.helpers import require_resource


class LookupService:
    def __init__(self, db: Session) -> None:
        self.repository = LookupRepository(db)

    def list_departments(self) -> LookupListResponse:
        return LookupListResponse(items=[LookupItemResponse.model_validate(item) for item in self.repository.list_departments()])

    def list_locations(self) -> LookupListResponse:
        return LookupListResponse(items=[LookupItemResponse.model_validate(item) for item in self.repository.list_locations()])

    def list_vendors(self) -> LookupListResponse:
        return LookupListResponse(items=[LookupItemResponse.model_validate(item) for item in self.repository.list_vendors()])

    def list_asset_categories(self) -> LookupListResponse:
        return LookupListResponse(items=[LookupItemResponse.model_validate(item) for item in self.repository.list_asset_categories()])

    def list_asset_statuses(self) -> LookupListResponse:
        return LookupListResponse(items=[LookupItemResponse.model_validate(item) for item in self.repository.list_asset_statuses()])

    def list_asset_models(self) -> LookupListResponse:
        return LookupListResponse(items=[LookupItemResponse.model_validate(item) for item in self.repository.list_asset_models()])

    def create_department(self, payload: LookupCreateRequest) -> LookupItemResponse:
        department = self.repository.add_department(Department(code=payload.code, name=payload.name, is_active=True))
        self._commit_with_conflict("Esiste gia un dipartimento con questo codice.")
        return LookupItemResponse.model_validate(department)

    def create_location(self, payload: LookupCreateRequest) -> LookupItemResponse:
        if payload.parent_id is not None:
            require_resource(self.repository.get_location(payload.parent_id), "Sede padre non trovata")
        location = self.repository.add_location(Location(code=payload.code, name=payload.name, parent_id=payload.parent_id))
        self._commit_with_conflict("Esiste gia una sede con questo codice.")
        return LookupItemResponse.model_validate(location)

    def create_vendor(self, payload: VendorCreateRequest) -> LookupItemResponse:
        vendor = self.repository.add_vendor(
            Vendor(name=payload.name, contact_email=payload.contact_email, contact_phone=payload.contact_phone)
        )
        self._commit_with_conflict("Impossibile creare il fornitore.")
        return LookupItemResponse.model_validate(vendor)

    def create_asset_category(self, payload: LookupCreateRequest) -> LookupItemResponse:
        if payload.parent_id is not None:
            require_resource(self.repository.get_category(payload.parent_id), "Categoria padre non trovata")
        category = self.repository.add_asset_category(AssetCategory(code=payload.code, name=payload.name, parent_id=payload.parent_id))
        self._commit_with_conflict("Esiste gia una categoria con questo codice.")
        return LookupItemResponse.model_validate(category)

    def create_asset_model(self, payload: AssetModelCreateRequest) -> LookupItemResponse:
        require_resource(self.repository.get_category(payload.category_id), "Asset category not found")
        if payload.vendor_id is not None:
            require_resource(self.repository.get_vendor(payload.vendor_id), "Vendor not found")
        model = self.repository.add_asset_model(
            AssetModel(
                category_id=payload.category_id,
                vendor_id=payload.vendor_id,
                name=payload.name,
                manufacturer=payload.manufacturer,
            )
        )
        self._commit_with_conflict("Impossibile creare il modello asset.")
        return LookupItemResponse.model_validate(model)

    def update_department(self, department_id: int, payload: LookupUpdateRequest) -> LookupItemResponse:
        department = require_resource(self.repository.get_department(department_id), "Dipartimento non trovato")
        department.code = payload.code
        department.name = payload.name
        self.repository.save(department)
        self._commit_with_conflict("Esiste gia un dipartimento con questo codice.")
        return LookupItemResponse.model_validate(department)

    def update_location(self, location_id: int, payload: LookupUpdateRequest) -> LookupItemResponse:
        location = require_resource(self.repository.get_location(location_id), "Sede non trovata")
        if payload.parent_id == location_id:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Una sede non puo essere figlia di se stessa.")
        if payload.parent_id is not None:
            require_resource(self.repository.get_location(payload.parent_id), "Sede padre non trovata")
        location.code = payload.code
        location.name = payload.name
        location.parent_id = payload.parent_id
        self.repository.save(location)
        self._commit_with_conflict("Esiste gia una sede con questo codice.")
        return LookupItemResponse.model_validate(location)

    def update_vendor(self, vendor_id: int, payload: VendorUpdateRequest) -> LookupItemResponse:
        vendor = require_resource(self.repository.get_vendor(vendor_id), "Fornitore non trovato")
        vendor.name = payload.name
        vendor.contact_email = payload.contact_email
        vendor.contact_phone = payload.contact_phone
        self.repository.save(vendor)
        self._commit_with_conflict("Impossibile aggiornare il fornitore.")
        return LookupItemResponse.model_validate(vendor)

    def update_asset_category(self, category_id: int, payload: LookupUpdateRequest) -> LookupItemResponse:
        category = require_resource(self.repository.get_category(category_id), "Categoria asset non trovata")
        if payload.parent_id == category_id:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Una categoria non puo essere figlia di se stessa.")
        if payload.parent_id is not None:
            require_resource(self.repository.get_category(payload.parent_id), "Categoria padre non trovata")
        category.code = payload.code
        category.name = payload.name
        category.parent_id = payload.parent_id
        self.repository.save(category)
        self._commit_with_conflict("Esiste gia una categoria con questo codice.")
        return LookupItemResponse.model_validate(category)

    def update_asset_model(self, model_id: int, payload: AssetModelUpdateRequest) -> LookupItemResponse:
        model = require_resource(self.repository.get_model(model_id), "Modello asset non trovato")
        require_resource(self.repository.get_category(payload.category_id), "Categoria asset non trovata")
        if payload.vendor_id is not None:
            require_resource(self.repository.get_vendor(payload.vendor_id), "Fornitore non trovato")
        model.category_id = payload.category_id
        model.vendor_id = payload.vendor_id
        model.name = payload.name
        model.manufacturer = payload.manufacturer
        self.repository.save(model)
        self._commit_with_conflict("Impossibile aggiornare il modello asset.")
        return LookupItemResponse.model_validate(model)

    def delete_department(self, department_id: int) -> None:
        department = require_resource(self.repository.get_department(department_id), "Dipartimento non trovato")
        self._ensure_not_in_use(
            self.repository.department_is_in_use(department_id),
            "Il dipartimento e gia usato da utenti, asset o assegnazioni.",
        )
        self.repository.delete(department)
        self.repository.db.commit()

    def delete_location(self, location_id: int) -> None:
        location = require_resource(self.repository.get_location(location_id), "Sede non trovata")
        self._ensure_not_in_use(
            self.repository.location_is_in_use(location_id),
            "La sede e gia usata da asset, assegnazioni o sedi figlie.",
        )
        self.repository.delete(location)
        self.repository.db.commit()

    def delete_vendor(self, vendor_id: int) -> None:
        vendor = require_resource(self.repository.get_vendor(vendor_id), "Fornitore non trovato")
        self._ensure_not_in_use(
            self.repository.vendor_is_in_use(vendor_id),
            "Il fornitore e gia collegato a modelli, asset o ticket di manutenzione.",
        )
        self.repository.delete(vendor)
        self.repository.db.commit()

    def delete_asset_category(self, category_id: int) -> None:
        category = require_resource(self.repository.get_category(category_id), "Categoria asset non trovata")
        self._ensure_not_in_use(
            self.repository.category_is_in_use(category_id),
            "La categoria asset e gia collegata a modelli o asset.",
        )
        self.repository.delete(category)
        self.repository.db.commit()

    def delete_asset_model(self, model_id: int) -> None:
        model = require_resource(self.repository.get_model(model_id), "Modello asset non trovato")
        self._ensure_not_in_use(self.repository.model_is_in_use(model_id), "Il modello asset e gia collegato ad asset.")
        self.repository.delete(model)
        self.repository.db.commit()

    def _commit_with_conflict(self, detail: str) -> None:
        try:
            self.repository.db.commit()
        except IntegrityError as exc:
            self.repository.db.rollback()
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=detail) from exc

    def _ensure_not_in_use(self, in_use: bool, detail: str) -> None:
        if in_use:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=detail)
