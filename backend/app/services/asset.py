import csv
from io import BytesIO, StringIO
from xml.sax.saxutils import escape
from zipfile import ZIP_DEFLATED, ZipFile

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.asset import Asset
from app.repositories.asset import AssetRepository
from app.repositories.assignment import AssignmentRepository
from app.repositories.lookup import LookupRepository
from app.repositories.user import UserRepository
from app.schemas.asset import (
    AssetCreateRequest,
    AssetDetailResponse,
    AssetEventResponse,
    AssetListItemResponse,
    AssetListResponse,
    AssetLocationChangeRequest,
    AssetReferenceResponse,
    AssetStatusChangeRequest,
    AssetUpdateRequest,
)
from app.services.events import AssetEventService
from app.services.helpers import (
    asset_reference,
    assignment_response,
    document_response,
    event_response,
    require_resource,
    user_reference,
)


class AssetService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repository = AssetRepository(db)
        self.assignment_repository = AssignmentRepository(db)
        self.lookup_repository = LookupRepository(db)
        self.user_repository = UserRepository(db)
        self.event_service = AssetEventService(db)

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
    ) -> AssetListResponse:
        items, total = self.repository.list_assets(
            search=search,
            status_id=status_id,
            category_id=category_id,
            model_id=model_id,
            location_id=location_id,
            department_id=department_id,
            assigned_user_id=assigned_user_id,
            vendor_id=vendor_id,
            page=page,
            page_size=page_size,
            sort_by=sort_by,
            sort_dir=sort_dir,
        )
        return AssetListResponse(
            items=[self._build_list_item(item) for item in items],
            total=total,
            page=page,
            page_size=page_size,
        )

    def get_asset(self, asset_id: int) -> AssetDetailResponse:
        asset = self._require_asset(asset_id)
        assignments = self.assignment_repository.list_for_asset(asset_id)
        events = self.repository.list_events(asset_id)
        documents = self.repository.list_documents(asset_id)

        return AssetDetailResponse(
            id=asset.id,
            asset_tag=asset.asset_tag,
            name=asset.name,
            serial_number=asset.serial_number,
            description=asset.description,
            purchase_date=asset.purchase_date,
            warranty_expiry_date=asset.warranty_expiry_date,
            expected_end_of_life_date=asset.expected_end_of_life_date,
            disposal_date=asset.disposal_date,
            cost_center=asset.cost_center,
            category=asset_reference(self._require_category(asset.category_id)),
            model=self._optional_reference(asset.model_id, self.lookup_repository.get_model),
            status=asset_reference(self._require_status(asset.status_id)),
            location=self._optional_reference(asset.location_id, self.lookup_repository.get_location),
            vendor=self._optional_reference(asset.vendor_id, self.lookup_repository.get_vendor),
            current_department=self._optional_reference(
                asset.current_department_id,
                self.lookup_repository.get_department,
            ),
            assigned_user=self._optional_user_reference(asset.assigned_user_id),
            assignments=[self._build_assignment_response(item) for item in assignments],
            events=[self._build_event_response(item) for item in events],
            documents=[self._build_document_response(item) for item in documents],
        )

    def create_asset(self, payload: AssetCreateRequest, current_user_id: int) -> AssetDetailResponse:
        self._validate_lifecycle_fields(payload.status_id, payload.disposal_date)
        self._validate_asset_references(
            category_id=payload.category_id,
            status_id=payload.status_id,
            model_id=payload.model_id,
            location_id=payload.location_id,
            vendor_id=payload.vendor_id,
            department_id=payload.current_department_id,
        )
        if self.repository.get_by_asset_tag(payload.asset_tag) is not None:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Asset tag already exists")

        asset = Asset(**payload.model_dump())
        self.repository.add(asset)
        self.event_service.log_event(
            asset_id=asset.id,
            event_type="CREATE",
            summary=f"Asset {asset.asset_tag} created",
            performed_by_user_id=current_user_id,
            details={"asset_tag": asset.asset_tag},
        )
        self.db.commit()
        return self.get_asset(asset.id)

    def update_asset(self, asset_id: int, payload: AssetUpdateRequest, current_user_id: int) -> AssetDetailResponse:
        asset = self._require_asset(asset_id)
        previous_status_id = asset.status_id
        previous_location_id = asset.location_id
        previous_disposal_date = asset.disposal_date
        self._validate_asset_references(
            category_id=payload.category_id,
            status_id=payload.status_id,
            model_id=payload.model_id,
            location_id=payload.location_id,
            vendor_id=payload.vendor_id,
            department_id=payload.current_department_id,
        )
        self._validate_lifecycle_fields(payload.status_id, payload.disposal_date)

        for key, value in payload.model_dump().items():
            setattr(asset, key, value)

        self.db.flush()
        self.event_service.log_event(
            asset_id=asset.id,
            event_type="UPDATE",
            summary=f"Asset {asset.asset_tag} updated",
            performed_by_user_id=current_user_id,
            details={"status_changed": previous_status_id != asset.status_id, "location_changed": previous_location_id != asset.location_id},
        )
        if previous_status_id != asset.status_id:
            previous_status = self._require_status(previous_status_id)
            new_status = self._require_status(asset.status_id)
            self.event_service.log_event(
                asset_id=asset.id,
                event_type="STATUS_CHANGE",
                summary=f"Status changed from {previous_status.code} to {new_status.code}",
                performed_by_user_id=current_user_id,
                details={"from_status": previous_status.code, "to_status": new_status.code},
            )
        if previous_location_id != asset.location_id:
            previous_location = self.lookup_repository.get_location(previous_location_id) if previous_location_id else None
            new_location = self.lookup_repository.get_location(asset.location_id) if asset.location_id else None
            self.event_service.log_event(
                asset_id=asset.id,
                event_type="LOCATION_CHANGE",
                summary="Location updated",
                performed_by_user_id=current_user_id,
                details={
                    "from_location": previous_location.code if previous_location else None,
                    "to_location": new_location.code if new_location else None,
                },
            )
        if previous_disposal_date != asset.disposal_date and asset.disposal_date is not None:
            self.event_service.log_event(
                asset_id=asset.id,
                event_type="DISPOSAL_RECORDED",
                summary=f"Dismissione registrata per il {asset.disposal_date.isoformat()}",
                performed_by_user_id=current_user_id,
                details={"disposal_date": asset.disposal_date.isoformat()},
            )
        self.db.commit()
        return self.get_asset(asset.id)

    def change_status(self, asset_id: int, payload: AssetStatusChangeRequest, current_user_id: int) -> AssetDetailResponse:
        asset = self._require_asset(asset_id)
        current_status = self._require_status(asset.status_id)
        new_status = self._require_status(payload.status_id)
        asset.status_id = new_status.id
        self.db.flush()
        self.event_service.log_event(
            asset_id=asset.id,
            event_type="STATUS_CHANGE",
            summary=f"Status changed from {current_status.code} to {new_status.code}",
            performed_by_user_id=current_user_id,
            details={"from_status": current_status.code, "to_status": new_status.code, "notes": payload.notes},
        )
        self.db.commit()
        return self.get_asset(asset.id)

    def change_location(self, asset_id: int, payload: AssetLocationChangeRequest, current_user_id: int) -> AssetDetailResponse:
        asset = self._require_asset(asset_id)
        previous_location = self.lookup_repository.get_location(asset.location_id) if asset.location_id else None
        new_location = self.lookup_repository.get_location(payload.location_id) if payload.location_id else None
        if payload.location_id is not None and new_location is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Location not found")

        asset.location_id = payload.location_id
        self.db.flush()
        self.event_service.log_event(
            asset_id=asset.id,
            event_type="LOCATION_CHANGE",
            summary="Location updated",
            performed_by_user_id=current_user_id,
            details={
                "from_location": previous_location.code if previous_location else None,
                "to_location": new_location.code if new_location else None,
                "notes": payload.notes,
            },
        )
        self.db.commit()
        return self.get_asset(asset.id)

    def list_events(self, asset_id: int) -> list[AssetEventResponse]:
        self._require_asset(asset_id)
        return [self._build_event_response(item) for item in self.repository.list_events(asset_id)]

    def export_assets_csv(
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
        sort_by: str,
        sort_dir: str,
    ) -> tuple[str, bytes]:
        rows = self._build_export_rows(
            search=search,
            status_id=status_id,
            category_id=category_id,
            model_id=model_id,
            location_id=location_id,
            department_id=department_id,
            assigned_user_id=assigned_user_id,
            vendor_id=vendor_id,
            sort_by=sort_by,
            sort_dir=sort_dir,
        )
        buffer = StringIO()
        writer = csv.writer(buffer)
        writer.writerow(self._export_headers())
        writer.writerows(rows)
        filename = "asset-inventory-export.csv"
        return filename, buffer.getvalue().encode("utf-8-sig")

    def export_assets_xlsx(
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
        sort_by: str,
        sort_dir: str,
    ) -> tuple[str, bytes]:
        rows = self._build_export_rows(
            search=search,
            status_id=status_id,
            category_id=category_id,
            model_id=model_id,
            location_id=location_id,
            department_id=department_id,
            assigned_user_id=assigned_user_id,
            vendor_id=vendor_id,
            sort_by=sort_by,
            sort_dir=sort_dir,
        )
        workbook = self._build_xlsx_workbook([self._export_headers(), *rows])
        return "asset-inventory-export.xlsx", workbook

    def _build_list_item(self, asset: Asset) -> AssetListItemResponse:
        return AssetListItemResponse(
            id=asset.id,
            asset_tag=asset.asset_tag,
            name=asset.name,
            serial_number=asset.serial_number,
            status=asset_reference(self._require_status(asset.status_id)),
            category=asset_reference(self._require_category(asset.category_id)),
            location=self._optional_reference(asset.location_id, self.lookup_repository.get_location),
            assigned_user=self._optional_user_reference(asset.assigned_user_id),
            purchase_date=asset.purchase_date,
            warranty_expiry_date=asset.warranty_expiry_date,
            expected_end_of_life_date=asset.expected_end_of_life_date,
            cost_center=asset.cost_center,
        )

    def _build_assignment_response(self, assignment):
        user = require_resource(self.user_repository.get_by_id(assignment.user_id), "Assigned user not found")
        assigned_by_user = require_resource(
            self.user_repository.get_by_id(assignment.assigned_by_user_id),
            "Assigned by user not found",
        )
        department = self.lookup_repository.get_department(assignment.department_id) if assignment.department_id else None
        location = self.lookup_repository.get_location(assignment.location_id) if assignment.location_id else None
        return assignment_response(assignment, user, assigned_by_user, department, location)

    def _build_event_response(self, event):
        user = self.user_repository.get_by_id(event.performed_by_user_id) if event.performed_by_user_id else None
        return event_response(event, user)

    def _build_document_response(self, document):
        user = self.user_repository.get_by_id(document.uploaded_by_user_id) if document.uploaded_by_user_id else None
        return document_response(document, user)

    def _optional_reference(self, resource_id: int | None, getter) -> AssetReferenceResponse | None:
        if resource_id is None:
            return None
        resource = getter(resource_id)
        return asset_reference(require_resource(resource, "Reference not found"))

    def _optional_user_reference(self, user_id: int | None):
        if user_id is None:
            return None
        user = require_resource(self.user_repository.get_by_id(user_id), "User not found")
        return user_reference(user)

    def _validate_asset_references(
        self,
        *,
        category_id: int,
        status_id: int,
        model_id: int | None,
        location_id: int | None,
        vendor_id: int | None,
        department_id: int | None,
    ) -> None:
        self._require_category(category_id)
        self._require_status(status_id)
        if model_id is not None:
            require_resource(self.lookup_repository.get_model(model_id), "Asset model not found")
        if location_id is not None:
            require_resource(self.lookup_repository.get_location(location_id), "Location not found")
        if vendor_id is not None:
            require_resource(self.lookup_repository.get_vendor(vendor_id), "Vendor not found")
        if department_id is not None:
            require_resource(self.lookup_repository.get_department(department_id), "Department not found")

    def _validate_lifecycle_fields(self, status_id: int, disposal_date) -> None:
        asset_status = self._require_status(status_id)
        if disposal_date is not None and asset_status.code != "DISPOSED":
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="Disposal date requires DISPOSED status",
            )

    def _export_headers(self) -> list[str]:
        return [
            "Tag asset",
            "Nome",
            "Categoria",
            "Stato",
            "Sede",
            "Dipartimento",
            "Utente assegnato",
            "Fornitore",
            "Seriale",
            "Data acquisto",
            "Scadenza garanzia",
            "Fine vita prevista",
            "Data dismissione",
            "Cost center",
        ]

    def _build_export_rows(
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
        sort_by: str,
        sort_dir: str,
    ) -> list[list[str]]:
        assets = self.repository.list_assets_for_export(
            search=search,
            status_id=status_id,
            category_id=category_id,
            model_id=model_id,
            location_id=location_id,
            department_id=department_id,
            assigned_user_id=assigned_user_id,
            vendor_id=vendor_id,
            sort_by=sort_by,
            sort_dir=sort_dir,
        )
        rows: list[list[str]] = []
        for asset in assets:
            rows.append(
                [
                    asset.asset_tag,
                    asset.name,
                    self._require_category(asset.category_id).name,
                    self._require_status(asset.status_id).name,
                    self.lookup_repository.get_location(asset.location_id).name if asset.location_id else "",
                    self.lookup_repository.get_department(asset.current_department_id).name if asset.current_department_id else "",
                    self.user_repository.get_by_id(asset.assigned_user_id).full_name if asset.assigned_user_id else "",
                    self.lookup_repository.get_vendor(asset.vendor_id).name if asset.vendor_id else "",
                    asset.serial_number or "",
                    asset.purchase_date.isoformat() if asset.purchase_date else "",
                    asset.warranty_expiry_date.isoformat() if asset.warranty_expiry_date else "",
                    asset.expected_end_of_life_date.isoformat() if asset.expected_end_of_life_date else "",
                    asset.disposal_date.isoformat() if asset.disposal_date else "",
                    asset.cost_center or "",
                ]
            )
        return rows

    def _build_xlsx_workbook(self, rows: list[list[str]]) -> bytes:
        worksheet_rows = []
        for row_index, row in enumerate(rows, start=1):
            cells = []
            for column_index, value in enumerate(row, start=1):
                cell_ref = f"{self._column_name(column_index)}{row_index}"
                safe_value = escape(value or "")
                cells.append(
                    f'<c r="{cell_ref}" t="inlineStr"><is><t>{safe_value}</t></is></c>'
                )
            worksheet_rows.append(f'<row r="{row_index}">{"".join(cells)}</row>')

        sheet_xml = (
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
            f'<sheetData>{"".join(worksheet_rows)}</sheetData>'
            "</worksheet>"
        )
        workbook_xml = (
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" '
            'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
            '<sheets><sheet name="Asset Inventory" sheetId="1" r:id="rId1"/></sheets>'
            "</workbook>"
        )
        workbook_rels_xml = (
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            '<Relationship Id="rId1" '
            'Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" '
            'Target="worksheets/sheet1.xml"/>'
            "</Relationships>"
        )
        root_rels_xml = (
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            '<Relationship Id="rId1" '
            'Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" '
            'Target="xl/workbook.xml"/>'
            "</Relationships>"
        )
        content_types_xml = (
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
            '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
            '<Default Extension="xml" ContentType="application/xml"/>'
            '<Override PartName="/xl/workbook.xml" '
            'ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
            '<Override PartName="/xl/worksheets/sheet1.xml" '
            'ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'
            '</Types>'
        )

        output = BytesIO()
        with ZipFile(output, "w", compression=ZIP_DEFLATED) as archive:
            archive.writestr("[Content_Types].xml", content_types_xml)
            archive.writestr("_rels/.rels", root_rels_xml)
            archive.writestr("xl/workbook.xml", workbook_xml)
            archive.writestr("xl/_rels/workbook.xml.rels", workbook_rels_xml)
            archive.writestr("xl/worksheets/sheet1.xml", sheet_xml)
        return output.getvalue()

    def _column_name(self, index: int) -> str:
        result = ""
        current = index
        while current > 0:
            current, remainder = divmod(current - 1, 26)
            result = chr(65 + remainder) + result
        return result

    def _require_asset(self, asset_id: int) -> Asset:
        return require_resource(self.repository.get_by_id(asset_id), "Asset not found")

    def _require_status(self, status_id: int):
        return require_resource(self.lookup_repository.get_status(status_id), "Asset status not found")

    def _require_category(self, category_id: int):
        return require_resource(self.lookup_repository.get_category(category_id), "Asset category not found")
