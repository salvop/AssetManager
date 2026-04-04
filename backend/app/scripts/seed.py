from datetime import UTC, date, datetime, timedelta
from pathlib import Path
from base64 import b64decode

from sqlalchemy import delete, select, text
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import SessionLocal
from app.models.asset import Asset, AssetDocument, AssetEventLog
from app.models.assignment import AssetAssignment
from app.models.employee import Employee
from app.models.lookup import AssetCategory, AssetModel, AssetStatus, Department, Location, Role, Vendor
from app.models.maintenance import MaintenanceTicket
from app.models.user import User, UserRole
from app.security.passwords import hash_password


def run_sql_file(db: Session, path: Path) -> None:
    statements = [statement.strip() for statement in path.read_text(encoding="utf-8").split(";") if statement.strip()]
    for statement in statements:
        db.execute(text(statement))


def upsert_model(db: Session, model_type, entity_id: int, **values):
    entity = db.get(model_type, entity_id)
    if entity is None:
        entity = model_type(id=entity_id, **values)
        db.add(entity)
    else:
        for key, value in values.items():
            setattr(entity, key, value)
    db.flush()
    return entity


def seed_users(db: Session) -> None:
    users = [
        {
            "id": 1,
            "department_id": 1,
            "username": "admin",
            "full_name": "System Administrator",
            "email": "admin@example.com",
            "password": "admin123",
            "role_ids": [1],
        },
        {
            "id": 2,
            "department_id": 1,
            "username": "asset.manager",
            "full_name": "Martina Rinaldi",
            "email": "martina.rinaldi@example.com",
            "password": "manager123",
            "role_ids": [2],
        },
        {
            "id": 3,
            "department_id": 1,
            "username": "operator",
            "full_name": "Luca Bianchi",
            "email": "luca.bianchi@example.com",
            "password": "operator123",
            "role_ids": [3],
        },
        {
            "id": 4,
            "department_id": 2,
            "username": "viewer",
            "full_name": "Giulia Conti",
            "email": "giulia.conti@example.com",
            "password": "viewer123",
            "role_ids": [4],
        },
        {
            "id": 5,
            "department_id": 1,
            "username": "marco.rossi",
            "full_name": "Marco Rossi",
            "email": "marco.rossi@example.com",
            "password": "employee123",
            "role_ids": [3],
        },
        {
            "id": 6,
            "department_id": 2,
            "username": "elena.verdi",
            "full_name": "Elena Verdi",
            "email": "elena.verdi@example.com",
            "password": "employee123",
            "role_ids": [4],
        },
    ]

    for user_data in users:
        user = upsert_model(
            db,
            User,
            user_data["id"],
            department_id=user_data["department_id"],
            username=user_data["username"],
            full_name=user_data["full_name"],
            email=user_data["email"],
            password_hash=hash_password(user_data["password"]),
            is_active=True,
        )
        db.execute(delete(UserRole).where(UserRole.user_id == user.id))
        for offset, role_id in enumerate(user_data["role_ids"], start=1):
            db.add(UserRole(id=user.id * 10 + offset, user_id=user.id, role_id=role_id))
    db.flush()


def seed_employees(db: Session) -> None:
    employees = [
        {
            "id": 1,
            "department_id": 1,
            "employee_code": "EMP-00001",
            "full_name": "System Administrator",
            "email": "admin@example.com",
            "is_active": True,
            "notes": "Profilo persona collegato all'account admin.",
        },
        {
            "id": 2,
            "department_id": 1,
            "employee_code": "EMP-00002",
            "full_name": "Martina Rinaldi",
            "email": "martina.rinaldi@example.com",
            "is_active": True,
            "notes": "Responsabile asset management.",
        },
        {
            "id": 3,
            "department_id": 1,
            "employee_code": "EMP-00003",
            "full_name": "Luca Bianchi",
            "email": "luca.bianchi@example.com",
            "is_active": True,
            "notes": "Operatore interno.",
        },
        {
            "id": 4,
            "department_id": 2,
            "employee_code": "EMP-00004",
            "full_name": "Giulia Conti",
            "email": "giulia.conti@example.com",
            "is_active": True,
            "notes": "Utente viewer interno.",
        },
        {
            "id": 5,
            "department_id": 1,
            "employee_code": "EMP-00005",
            "full_name": "Marco Rossi",
            "email": "marco.rossi@example.com",
            "is_active": True,
            "notes": "Dipendente assegnatario area IT.",
        },
        {
            "id": 6,
            "department_id": 2,
            "employee_code": "EMP-00006",
            "full_name": "Elena Verdi",
            "email": "elena.verdi@example.com",
            "is_active": True,
            "notes": "Dipendente assegnataria area operations.",
        },
    ]

    for employee_data in employees:
        upsert_model(db, Employee, employee_data["id"], **{k: v for k, v in employee_data.items() if k != "id"})
    db.flush()


def seed_vendors_and_models(db: Session) -> None:
    vendors = [
        (1, {"name": "Dell Italia", "contact_email": "support@dell.example.com", "contact_phone": "+39-02-5555001"}),
        (2, {"name": "Lenovo Enterprise", "contact_email": "care@lenovo.example.com", "contact_phone": "+39-02-5555002"}),
        (3, {"name": "HP Business", "contact_email": "servizi@hp.example.com", "contact_phone": "+39-02-5555003"}),
    ]
    for vendor_id, payload in vendors:
        upsert_model(db, Vendor, vendor_id, **payload)

    models = [
        (1, {"category_id": 1, "vendor_id": 2, "name": "ThinkPad T14 Gen 4", "manufacturer": "Lenovo"}),
        (2, {"category_id": 3, "vendor_id": 1, "name": "UltraSharp U2723QE", "manufacturer": "Dell"}),
        (3, {"category_id": 4, "vendor_id": 1, "name": "iPhone 15 128GB", "manufacturer": "Apple"}),
        (4, {"category_id": 2, "vendor_id": 3, "name": "EliteDesk 800 G9", "manufacturer": "HP"}),
        (5, {"category_id": 6, "vendor_id": 1, "name": "PowerEdge R760", "manufacturer": "Dell"}),
    ]
    for model_id, payload in models:
        upsert_model(db, AssetModel, model_id, **payload)

    category_updates = [
        (1, {"parent_id": None}),
        (2, {"parent_id": None}),
        (3, {"parent_id": None}),
        (4, {"parent_id": None}),
        (5, {"parent_id": None}),
        (6, {"parent_id": None}),
    ]
    for category_id, payload in category_updates:
        category = db.get(AssetCategory, category_id)
        if category is not None:
            for key, value in payload.items():
                setattr(category, key, value)
    db.flush()


def get_status_id_by_code(db: Session, code: str) -> int:
    status_id = db.scalar(select(AssetStatus.id).where(AssetStatus.code == code))
    if status_id is None:
        raise RuntimeError(f"Asset status {code} not found")
    return int(status_id)


def clear_seeded_domain_data(db: Session) -> None:
    seeded_asset_ids = [1, 2, 3, 4, 5, 6]
    seeded_document_ids = [1, 2, 3]
    seeded_ticket_ids = [1, 2, 3]
    seeded_assignment_ids = [1, 2]
    seeded_event_ids = list(range(1, 25))

    db.execute(delete(AssetDocument).where(AssetDocument.id.in_(seeded_document_ids)))
    db.execute(delete(AssetEventLog).where(AssetEventLog.id.in_(seeded_event_ids)))
    db.execute(delete(MaintenanceTicket).where(MaintenanceTicket.id.in_(seeded_ticket_ids)))
    db.execute(delete(AssetAssignment).where(AssetAssignment.id.in_(seeded_assignment_ids)))
    db.execute(delete(Asset).where(Asset.id.in_(seeded_asset_ids)))
    db.flush()


def ensure_document_storage_root() -> Path | None:
    configured = Path(settings.document_storage_path)
    candidates = [configured]
    if str(configured).startswith("/app/"):
        candidates.append(Path(__file__).resolve().parents[2] / "storage" / "documents")

    for candidate in candidates:
        try:
            candidate.mkdir(parents=True, exist_ok=True)
            return candidate
        except OSError:
            continue
    return None


def seed_assets_domain_data(db: Session) -> None:
    clear_seeded_domain_data(db)

    status_ids = {
        "IN_STOCK": get_status_id_by_code(db, "IN_STOCK"),
        "ASSIGNED": get_status_id_by_code(db, "ASSIGNED"),
        "MAINTENANCE": get_status_id_by_code(db, "MAINTENANCE"),
        "RETIRED": get_status_id_by_code(db, "RETIRED"),
        "DISPOSED": get_status_id_by_code(db, "DISPOSED"),
    }
    now = datetime.now(UTC).replace(tzinfo=None)

    assets = [
        Asset(
            id=1,
            asset_tag="LT-2026-001",
            name="Notebook Direzione IT",
            serial_number="LNV-T14-0001",
            asset_type="Notebook",
            brand="Lenovo",
            category_id=1,
            model_id=1,
            status_id=status_ids["ASSIGNED"],
            location_id=1,
            vendor_id=2,
            assigned_employee_id=5,
            current_department_id=1,
            description="Portatile principale assegnato al team IT.",
            purchase_date=date(2025, 11, 18),
            warranty_expiry_date=date(2028, 11, 18),
            expected_end_of_life_date=date(2029, 11, 18),
            disposal_date=None,
            cost_center="CC-IT-001",
            location_floor="3",
            location_room="3.14",
            location_rack=None,
            location_slot=None,
        ),
        Asset(
            id=2,
            asset_tag="MON-2026-014",
            name="Monitor Sala Operativa",
            serial_number="DLL-U2723-0014",
            asset_type="Monitor",
            brand="Dell",
            category_id=3,
            model_id=2,
            status_id=status_ids["IN_STOCK"],
            location_id=2,
            vendor_id=1,
            assigned_employee_id=None,
            current_department_id=1,
            description="Monitor disponibile in magazzino IT.",
            purchase_date=date(2025, 12, 4),
            warranty_expiry_date=date(2028, 12, 4),
            expected_end_of_life_date=date(2030, 12, 4),
            disposal_date=None,
            cost_center="CC-IT-002",
            location_floor="1",
            location_room="Magazzino IT",
            location_rack=None,
            location_slot="Shelf-02",
        ),
        Asset(
            id=3,
            asset_tag="PHN-2026-003",
            name="Telefono commerciale Elena",
            serial_number="APL-IP15-0003",
            asset_type="Smartphone",
            brand="Apple",
            category_id=4,
            model_id=3,
            status_id=status_ids["MAINTENANCE"],
            location_id=3,
            vendor_id=1,
            assigned_employee_id=None,
            current_department_id=2,
            description="Smartphone aziendale in verifica per batteria difettosa.",
            purchase_date=date(2025, 10, 2),
            warranty_expiry_date=date(2027, 10, 2),
            expected_end_of_life_date=date(2028, 10, 2),
            disposal_date=None,
            cost_center="CC-SALES-001",
            location_floor="2",
            location_room="Supporto tecnico",
            location_rack=None,
            location_slot=None,
        ),
        Asset(
            id=4,
            asset_tag="DST-2024-009",
            name="Desktop front office",
            serial_number="HP-ED-0009",
            asset_type="Desktop",
            brand="HP",
            category_id=2,
            model_id=4,
            status_id=status_ids["RETIRED"],
            location_id=3,
            vendor_id=3,
            assigned_employee_id=None,
            current_department_id=2,
            description="Desktop ritirato dal servizio e sostituito.",
            purchase_date=date(2023, 6, 12),
            warranty_expiry_date=date(2026, 6, 12),
            expected_end_of_life_date=date(2027, 6, 12),
            disposal_date=None,
            cost_center="CC-HR-002",
            location_floor="0",
            location_room="Front office",
            location_rack=None,
            location_slot=None,
        ),
        Asset(
            id=5,
            asset_tag="SRV-2025-002",
            name="Server virtualizzazione nodo 2",
            serial_number="DLL-R760-0002",
            asset_type="Server",
            brand="Dell",
            category_id=6,
            model_id=5,
            status_id=status_ids["IN_STOCK"],
            location_id=1,
            vendor_id=1,
            assigned_employee_id=None,
            current_department_id=1,
            description="Server on-premise predisposto per cluster interno.",
            purchase_date=date(2025, 7, 20),
            warranty_expiry_date=date(2030, 7, 20),
            expected_end_of_life_date=date(2032, 7, 20),
            disposal_date=None,
            cost_center="CC-INFRA-010",
            location_floor="-1",
            location_room="Sala server",
            location_rack="Rack-A",
            location_slot="U18-U20",
        ),
        Asset(
            id=6,
            asset_tag="LT-2023-011",
            name="Notebook dismesso area finance",
            serial_number="LNV-T14-0011",
            asset_type="Notebook",
            brand="Lenovo",
            category_id=1,
            model_id=1,
            status_id=status_ids["DISPOSED"],
            location_id=2,
            vendor_id=2,
            assigned_employee_id=None,
            current_department_id=3,
            description="Asset dismesso e in attesa di smaltimento definitivo.",
            purchase_date=date(2023, 1, 15),
            warranty_expiry_date=date(2026, 1, 15),
            expected_end_of_life_date=date(2027, 1, 15),
            disposal_date=date(2026, 3, 15),
            cost_center="CC-FIN-004",
            location_floor="1",
            location_room="Magazzino dismissioni",
            location_rack=None,
            location_slot="DISP-11",
        ),
    ]
    db.add_all(assets)
    db.flush()

    assignments = [
        AssetAssignment(
            id=1,
            asset_id=1,
            employee_id=5,
            assigned_by_user_id=2,
            department_id=1,
            location_id=1,
            assigned_at=now - timedelta(days=12),
            expected_return_at=now + timedelta(days=180),
            returned_at=None,
            notes="Assegnazione standard nuovo inserimento.",
        ),
        AssetAssignment(
            id=2,
            asset_id=4,
            employee_id=6,
            assigned_by_user_id=2,
            department_id=2,
            location_id=3,
            assigned_at=now - timedelta(days=420),
            expected_return_at=None,
            returned_at=now - timedelta(days=120),
            notes="Assegnazione storica chiusa dopo sostituzione macchina.",
        ),
    ]
    db.add_all(assignments)
    db.flush()

    tickets = [
        MaintenanceTicket(
            id=1,
            asset_id=3,
            vendor_id=1,
            opened_by_user_id=3,
            status="OPEN",
            title="Verifica batteria e surriscaldamento",
            description="Il dispositivo mostra scarica anomala e temperatura elevata.",
            opened_at=now - timedelta(days=3),
            closed_at=None,
        ),
        MaintenanceTicket(
            id=2,
            asset_id=5,
            vendor_id=1,
            opened_by_user_id=2,
            status="IN_PROGRESS",
            title="Aggiornamento firmware controller RAID",
            description="Intervento pianificato con fornitore nel weekend.",
            opened_at=now - timedelta(days=1, hours=6),
            closed_at=None,
        ),
        MaintenanceTicket(
            id=3,
            asset_id=4,
            vendor_id=3,
            opened_by_user_id=2,
            status="CLOSED",
            title="Verifica guasto alimentatore",
            description="Ticket chiuso dopo valutazione economica negativa e ritiro asset.",
            opened_at=now - timedelta(days=150),
            closed_at=now - timedelta(days=145),
        ),
    ]
    db.add_all(tickets)
    db.flush()

    events = [
        AssetEventLog(id=1, asset_id=1, event_type="CREATE", performed_by_user_id=2, summary="Asset LT-2026-001 creato", details_json={"asset_tag": "LT-2026-001"}),
        AssetEventLog(id=2, asset_id=1, event_type="ASSIGN", performed_by_user_id=2, summary="Asset assegnato a Marco Rossi", details_json={"assigned_employee_id": 5, "assigned_employee_name": "Marco Rossi"}),
        AssetEventLog(id=3, asset_id=2, event_type="CREATE", performed_by_user_id=2, summary="Asset MON-2026-014 creato", details_json={"asset_tag": "MON-2026-014"}),
        AssetEventLog(id=4, asset_id=2, event_type="LOCATION_CHANGE", performed_by_user_id=3, summary="Asset spostato a magazzino IT", details_json={"to_location": "HQ-IT"}),
        AssetEventLog(id=5, asset_id=3, event_type="CREATE", performed_by_user_id=2, summary="Asset PHN-2026-003 creato", details_json={"asset_tag": "PHN-2026-003"}),
        AssetEventLog(id=6, asset_id=3, event_type="STATUS_CHANGE", performed_by_user_id=3, summary="Stato cambiato da ASSIGNED a MAINTENANCE", details_json={"from_status": "ASSIGNED", "to_status": "MAINTENANCE"}),
        AssetEventLog(id=7, asset_id=3, event_type="MAINTENANCE_OPEN", performed_by_user_id=3, summary="Ticket manutenzione aperto: Verifica batteria e surriscaldamento", details_json={"ticket_id": 1}),
        AssetEventLog(id=8, asset_id=4, event_type="CREATE", performed_by_user_id=2, summary="Asset DST-2024-009 creato", details_json={"asset_tag": "DST-2024-009"}),
        AssetEventLog(id=9, asset_id=4, event_type="ASSIGN", performed_by_user_id=2, summary="Asset assegnato a Elena Verdi", details_json={"assigned_employee_id": 6, "assigned_employee_name": "Elena Verdi"}),
        AssetEventLog(id=10, asset_id=4, event_type="RETURN", performed_by_user_id=2, summary="Asset rientrato", details_json={"notes": "Sostituito con nuovo desktop."}),
        AssetEventLog(id=11, asset_id=4, event_type="STATUS_CHANGE", performed_by_user_id=2, summary="Stato cambiato da IN_STOCK a RETIRED", details_json={"from_status": "IN_STOCK", "to_status": "RETIRED"}),
        AssetEventLog(id=12, asset_id=4, event_type="MAINTENANCE_OPEN", performed_by_user_id=2, summary="Ticket manutenzione aperto: Verifica guasto alimentatore", details_json={"ticket_id": 3}),
        AssetEventLog(id=13, asset_id=4, event_type="MAINTENANCE_STATUS_CHANGE", performed_by_user_id=2, summary="Ticket manutenzione chiuso", details_json={"ticket_id": 3, "status": "CLOSED"}),
        AssetEventLog(id=14, asset_id=5, event_type="CREATE", performed_by_user_id=2, summary="Asset SRV-2025-002 creato", details_json={"asset_tag": "SRV-2025-002"}),
        AssetEventLog(id=15, asset_id=5, event_type="MAINTENANCE_OPEN", performed_by_user_id=2, summary="Ticket manutenzione aperto: Aggiornamento firmware controller RAID", details_json={"ticket_id": 2}),
        AssetEventLog(id=16, asset_id=5, event_type="MAINTENANCE_STATUS_CHANGE", performed_by_user_id=2, summary="Ticket manutenzione in lavorazione", details_json={"ticket_id": 2, "status": "IN_PROGRESS"}),
        AssetEventLog(id=17, asset_id=6, event_type="CREATE", performed_by_user_id=2, summary="Asset LT-2023-011 creato", details_json={"asset_tag": "LT-2023-011"}),
        AssetEventLog(id=18, asset_id=6, event_type="STATUS_CHANGE", performed_by_user_id=2, summary="Stato cambiato da RETIRED a DISPOSED", details_json={"from_status": "RETIRED", "to_status": "DISPOSED"}),
    ]
    db.add_all(events)
    db.flush()

    storage_root = ensure_document_storage_root()
    if storage_root is None:
        return

    documents = [
        (
            1,
            1,
            2,
            "verbale-consegna-lt-2026-001.txt",
            "seed-asset-1-verbale.txt",
            "text/plain",
            "Verbale di consegna notebook LT-2026-001 a Marco Rossi.\n",
        ),
        (
            2,
            5,
            2,
            "checklist-firmware-srv-2025-002.txt",
            "seed-asset-5-firmware.txt",
            "text/plain",
            "Checklist manutenzione server SRV-2025-002.\nFirmware RAID da aggiornare.\n",
        ),
        (
            3,
            1,
            2,
            "foto-lt-2026-001.png",
            "seed-asset-1-photo.png",
            "image/png",
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9pX6lz8AAAAASUVORK5CYII=",
        ),
    ]
    for document_id, asset_id, uploaded_by_user_id, file_name, stored_name, content_type, content in documents:
        target = storage_root / stored_name
        if content_type.startswith("image/"):
            target.write_bytes(b64decode(content))
        else:
            target.write_text(content, encoding="utf-8")
        db.add(
            AssetDocument(
                id=document_id,
                asset_id=asset_id,
                uploaded_by_user_id=uploaded_by_user_id,
                file_name=file_name,
                stored_name=stored_name,
                content_type=content_type,
                size_bytes=target.stat().st_size,
            )
        )
    db.flush()


def main() -> None:
    db = SessionLocal()
    try:
        run_sql_file(db, Path(__file__).resolve().parents[3] / "database" / "seeds" / "seed_reference_data.sql")
        seed_users(db)
        seed_employees(db)
        seed_vendors_and_models(db)
        seed_assets_domain_data(db)
        db.commit()
    finally:
        db.close()


if __name__ == "__main__":
    main()
