from __future__ import annotations

from base64 import b64decode
from datetime import UTC, date, datetime, timedelta
from pathlib import Path

from sqlalchemy import delete, select, text
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import SessionLocal
from app.models.asset import Asset, AssetDocument, AssetEventLog
from app.models.assignment import AssetAssignment
from app.models.employee import Employee
from app.models.lookup import AssetCategory, AssetModel, AssetStatus, Department, Location, Role, Vendor
from app.models.maintenance import MaintenanceTicket
from app.models.preferences import AppSetting
from app.models.software import SoftwareLicense, SoftwareLicenseAssignment, SoftwareLicenseEventLog
from app.models.user import User, UserRole
from app.security.passwords import hash_password

TOTAL_USERS = 100
TOTAL_EMPLOYEES = 150

ASSET_ID_START = 10_001
ASSET_ASSIGNMENT_ID_START = 40_001
ASSET_EVENT_ID_START = 60_001
ASSET_DOCUMENT_ID_START = 80_001
MAINTENANCE_ID_START = 90_001

SOFTWARE_LICENSE_ID_START = 20_001
SOFTWARE_ASSIGNMENT_ID_START = 30_001
SOFTWARE_EVENT_ID_START = 50_001

BASE_NOW = datetime(2026, 4, 1, 9, 0, 0)
SEED_ASSET_TAG_PREFIX = "SEED-"
SEED_DOC_PREFIX = "seed-"
SEED_SOFTWARE_PREFIX = "SEED - "

ASSET_MIX: dict[int, int] = {
    1: 220,  # Laptop
    2: 90,  # Desktop
    3: 40,  # Monitor
    4: 25,  # Phone
    5: 15,  # Printer
    6: 10,  # Server
}

FIRST_NAMES = [
    "Andrea",
    "Luca",
    "Marco",
    "Davide",
    "Matteo",
    "Simone",
    "Fabio",
    "Stefano",
    "Alessio",
    "Giorgio",
    "Francesco",
    "Roberto",
    "Paolo",
    "Michele",
    "Riccardo",
    "Elena",
    "Giulia",
    "Martina",
    "Sara",
    "Valentina",
]

LAST_NAMES = [
    "Rossi",
    "Bianchi",
    "Verdi",
    "Gallo",
    "Romano",
    "Conti",
    "Esposito",
    "Costa",
    "Lombardi",
    "Marino",
    "Greco",
    "Bruno",
    "Fontana",
    "Moretti",
    "Barbieri",
    "Rinaldi",
    "Ferrari",
    "DeLuca",
    "Martinelli",
    "Colombo",
]


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


def get_role_ids(db: Session) -> dict[str, int]:
    return {role.code: role.id for role in db.scalars(select(Role)).all()}


def get_status_ids(db: Session) -> dict[str, int]:
    return {status.code: status.id for status in db.scalars(select(AssetStatus)).all()}


def get_department_id(index: int) -> int:
    cycle = (index - 1) % 3
    return [1, 2, 3][cycle]


def build_name(index: int) -> str:
    first = FIRST_NAMES[(index - 1) % len(FIRST_NAMES)]
    last = LAST_NAMES[((index - 1) // len(FIRST_NAMES)) % len(LAST_NAMES)]
    return f"{first} {last}"


def seed_users(db: Session) -> dict[int, str]:
    role_ids = get_role_ids(db)
    users: list[dict[str, object]] = [
        {
            "id": 1,
            "department_id": 1,
            "username": "admin",
            "full_name": "System Administrator",
            "email": "admin@example.com",
            "password": "admin123",
            "role_code": "ADMIN",
        },
        {
            "id": 2,
            "department_id": 1,
            "username": "asset.manager",
            "full_name": "Martina Rinaldi",
            "email": "martina.rinaldi@example.com",
            "password": "manager123",
            "role_code": "ASSET_MANAGER",
        },
        {
            "id": 3,
            "department_id": 1,
            "username": "operator",
            "full_name": "Luca Bianchi",
            "email": "luca.bianchi@example.com",
            "password": "operator123",
            "role_code": "OPERATOR",
        },
        {
            "id": 4,
            "department_id": 2,
            "username": "viewer",
            "full_name": "Giulia Conti",
            "email": "giulia.conti@example.com",
            "password": "viewer123",
            "role_code": "VIEWER",
        },
        {
            "id": 5,
            "department_id": 1,
            "username": "admin.ops",
            "full_name": "Operations Administrator",
            "email": "admin.ops@example.com",
            "password": "admin123",
            "role_code": "ADMIN",
        },
        {
            "id": 6,
            "department_id": 1,
            "username": "admin.audit",
            "full_name": "Audit Administrator",
            "email": "admin.audit@example.com",
            "password": "admin123",
            "role_code": "ADMIN",
        },
    ]

    for user_id in range(7, TOTAL_USERS + 1):
        full_name = build_name(user_id)
        username = f"user{user_id:03d}"
        email = f"user{user_id:03d}@example.com"

        if user_id % 12 == 0:
            role_code = "ASSET_MANAGER"
        elif user_id % 4 == 0:
            role_code = "VIEWER"
        else:
            role_code = "OPERATOR"

        users.append(
            {
                "id": user_id,
                "department_id": get_department_id(user_id),
                "username": username,
                "full_name": full_name,
                "email": email,
                "password": "user123",
                "role_code": role_code,
            }
        )

    role_by_user: dict[int, str] = {}
    for user_data in users:
        user = upsert_model(
            db,
            User,
            int(user_data["id"]),
            department_id=int(user_data["department_id"]),
            username=str(user_data["username"]),
            full_name=str(user_data["full_name"]),
            email=str(user_data["email"]),
            password_hash=hash_password(str(user_data["password"])),
            is_active=True,
        )
        role_code = str(user_data["role_code"])
        role_by_user[user.id] = role_code
        db.execute(delete(UserRole).where(UserRole.user_id == user.id))
        db.add(UserRole(id=100_000 + user.id, user_id=user.id, role_id=role_ids[role_code]))
    db.flush()
    return role_by_user


def seed_employees(db: Session) -> None:
    employee_rows: list[dict[str, object]] = []

    for employee_id in range(1, TOTAL_EMPLOYEES + 1):
        if employee_id == 1:
            full_name = "System Administrator"
            email = "admin@example.com"
        elif employee_id == 2:
            full_name = "Martina Rinaldi"
            email = "martina.rinaldi@example.com"
        elif employee_id == 3:
            full_name = "Luca Bianchi"
            email = "luca.bianchi@example.com"
        elif employee_id == 4:
            full_name = "Giulia Conti"
            email = "giulia.conti@example.com"
        elif employee_id == 5:
            full_name = "Operations Administrator"
            email = "admin.ops@example.com"
        elif employee_id == 6:
            full_name = "Audit Administrator"
            email = "admin.audit@example.com"
        else:
            full_name = build_name(employee_id + 50)
            email = f"employee{employee_id:03d}@example.com"

        employee_rows.append(
            {
                "id": employee_id,
                "department_id": get_department_id(employee_id),
                "employee_code": f"EMP-{employee_id:05d}",
                "full_name": full_name,
                "email": email,
                "is_active": True,
                "notes": "Seed enterprise dataset",
            }
        )

    for employee_data in employee_rows:
        upsert_model(db, Employee, int(employee_data["id"]), **{k: v for k, v in employee_data.items() if k != "id"})
    db.flush()


def seed_vendors_and_models(db: Session) -> None:
    vendors = [
        (1, {"name": "Dell Italia", "contact_email": "support@dell.example.com", "contact_phone": "+39-02-5555001"}),
        (2, {"name": "Lenovo Enterprise", "contact_email": "care@lenovo.example.com", "contact_phone": "+39-02-5555002"}),
        (3, {"name": "HP Business", "contact_email": "servizi@hp.example.com", "contact_phone": "+39-02-5555003"}),
        (4, {"name": "Apple Business", "contact_email": "enterprise@apple.example.com", "contact_phone": "+39-02-5555004"}),
        (5, {"name": "Samsung Enterprise", "contact_email": "b2b@samsung.example.com", "contact_phone": "+39-02-5555005"}),
        (6, {"name": "Zebra Technologies", "contact_email": "support@zebra.example.com", "contact_phone": "+39-02-5555006"}),
        (7, {"name": "Brother Business", "contact_email": "sales@brother.example.com", "contact_phone": "+39-02-5555007"}),
        (8, {"name": "Canon Enterprise", "contact_email": "helpdesk@canon.example.com", "contact_phone": "+39-02-5555008"}),
    ]
    for vendor_id, payload in vendors:
        upsert_model(db, Vendor, vendor_id, **payload)

    models = [
        (1, {"category_id": 1, "vendor_id": 2, "name": "ThinkPad T14 Gen 5", "manufacturer": "Lenovo"}),
        (2, {"category_id": 1, "vendor_id": 1, "name": "Latitude 7450", "manufacturer": "Dell"}),
        (3, {"category_id": 1, "vendor_id": 3, "name": "EliteBook 840 G11", "manufacturer": "HP"}),
        (4, {"category_id": 2, "vendor_id": 1, "name": "OptiPlex 7010", "manufacturer": "Dell"}),
        (5, {"category_id": 2, "vendor_id": 2, "name": "ThinkCentre M90s", "manufacturer": "Lenovo"}),
        (6, {"category_id": 2, "vendor_id": 3, "name": "EliteDesk 800 G9", "manufacturer": "HP"}),
        (7, {"category_id": 3, "vendor_id": 1, "name": "UltraSharp U2723QE", "manufacturer": "Dell"}),
        (8, {"category_id": 3, "vendor_id": 2, "name": "ThinkVision P24h", "manufacturer": "Lenovo"}),
        (9, {"category_id": 3, "vendor_id": 3, "name": "E24q G5", "manufacturer": "HP"}),
        (10, {"category_id": 4, "vendor_id": 4, "name": "iPhone 15 128GB", "manufacturer": "Apple"}),
        (11, {"category_id": 4, "vendor_id": 5, "name": "Galaxy S24 Enterprise", "manufacturer": "Samsung"}),
        (12, {"category_id": 4, "vendor_id": 6, "name": "TC58", "manufacturer": "Zebra"}),
        (13, {"category_id": 5, "vendor_id": 3, "name": "LaserJet Enterprise M611", "manufacturer": "HP"}),
        (14, {"category_id": 5, "vendor_id": 7, "name": "HL-L6400DW", "manufacturer": "Brother"}),
        (15, {"category_id": 5, "vendor_id": 8, "name": "imageRUNNER C3326i", "manufacturer": "Canon"}),
        (16, {"category_id": 6, "vendor_id": 1, "name": "PowerEdge R760", "manufacturer": "Dell"}),
        (17, {"category_id": 6, "vendor_id": 3, "name": "ProLiant DL380 Gen11", "manufacturer": "HP"}),
        (18, {"category_id": 6, "vendor_id": 2, "name": "ThinkSystem SR650 V3", "manufacturer": "Lenovo"}),
    ]
    for model_id, payload in models:
        upsert_model(db, AssetModel, model_id, **payload)

    for category_id in range(1, 7):
        category = db.get(AssetCategory, category_id)
        if category is not None:
            category.parent_id = None
    db.flush()


def seed_app_settings(db: Session) -> None:
    in_stock_status = db.scalar(select(AssetStatus).where(AssetStatus.code == "IN_STOCK"))
    if in_stock_status is None:
        raise RuntimeError("IN_STOCK status not found")
    upsert_model(
        db,
        AppSetting,
        1,
        org_name="Asset Manager",
        default_asset_status_on_create_id=in_stock_status.id,
        max_document_size_mb=10,
        allowed_document_mime_types="application/pdf,image/png,image/jpeg,text/plain",
        updated_by_user_id=1,
    )
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


def status_code_for_index(index: int) -> str:
    marker = index % 100
    if marker < 55:
        return "ASSIGNED"
    if marker < 83:
        return "IN_STOCK"
    if marker < 93:
        return "MAINTENANCE"
    if marker < 98:
        return "RETIRED"
    return "DISPOSED"


def seed_asset_domain_data(db: Session) -> list[dict[str, int | str | None]]:
    status_ids = get_status_ids(db)
    all_seed_asset_ids = list(range(ASSET_ID_START, ASSET_ID_START + sum(ASSET_MIX.values())))
    legacy_seed_asset_ids = [1, 2, 3, 4, 5, 6]

    db.execute(delete(AssetDocument).where(AssetDocument.asset_id.in_(all_seed_asset_ids + legacy_seed_asset_ids)))
    db.execute(delete(AssetDocument).where(AssetDocument.id >= ASSET_DOCUMENT_ID_START))
    db.execute(delete(AssetEventLog).where(AssetEventLog.asset_id.in_(all_seed_asset_ids + legacy_seed_asset_ids)))
    db.execute(delete(AssetEventLog).where(AssetEventLog.id >= ASSET_EVENT_ID_START))
    db.execute(delete(MaintenanceTicket).where(MaintenanceTicket.asset_id.in_(all_seed_asset_ids + legacy_seed_asset_ids)))
    db.execute(delete(MaintenanceTicket).where(MaintenanceTicket.id >= MAINTENANCE_ID_START))
    db.execute(delete(AssetAssignment).where(AssetAssignment.asset_id.in_(all_seed_asset_ids + legacy_seed_asset_ids)))
    db.execute(delete(AssetAssignment).where(AssetAssignment.id >= ASSET_ASSIGNMENT_ID_START))
    db.execute(delete(Asset).where(Asset.id.in_(legacy_seed_asset_ids)))
    db.execute(delete(Asset).where(Asset.id.in_(all_seed_asset_ids)))
    db.execute(delete(Asset).where(Asset.asset_tag.like(f"{SEED_ASSET_TAG_PREFIX}%")))
    db.flush()

    model_by_category = {
        1: [1, 2, 3],
        2: [4, 5, 6],
        3: [7, 8, 9],
        4: [10, 11, 12],
        5: [13, 14, 15],
        6: [16, 17, 18],
    }
    vendor_by_model = {
        1: 2,
        2: 1,
        3: 3,
        4: 1,
        5: 2,
        6: 3,
        7: 1,
        8: 2,
        9: 3,
        10: 4,
        11: 5,
        12: 6,
        13: 3,
        14: 7,
        15: 8,
        16: 1,
        17: 3,
        18: 2,
    }
    type_info = {
        1: {"tag": "LTP", "name": "Laptop", "type": "Laptop", "brand": "Mixed"},
        2: {"tag": "DST", "name": "Desktop", "type": "Desktop", "brand": "Mixed"},
        3: {"tag": "MON", "name": "Monitor", "type": "Monitor", "brand": "Mixed"},
        4: {"tag": "PHN", "name": "Smartphone", "type": "Smartphone", "brand": "Mixed"},
        5: {"tag": "PRN", "name": "Printer", "type": "Printer", "brand": "Mixed"},
        6: {"tag": "SRV", "name": "Server", "type": "Server", "brand": "Mixed"},
    }

    assets: list[Asset] = []
    asset_context: list[dict[str, int | str | None]] = []
    global_index = 0
    for category_id, count in ASSET_MIX.items():
        for local_index in range(1, count + 1):
            global_index += 1
            asset_id = ASSET_ID_START + global_index - 1
            status_code = status_code_for_index(global_index)
            employee_id = ((global_index - 1) % TOTAL_EMPLOYEES) + 1 if status_code == "ASSIGNED" else None
            department_id = get_department_id(employee_id if employee_id is not None else global_index)
            location_id = 1 if category_id == 6 else (2 if category_id in {3, 5} else 3 if global_index % 7 == 0 else 1)
            model_id = model_by_category[category_id][(local_index - 1) % len(model_by_category[category_id])]
            vendor_id = vendor_by_model[model_id]
            purchased_on = date(2023 + (global_index % 3), ((global_index % 12) + 1), ((global_index % 27) + 1))
            warranty = purchased_on + timedelta(days=365 * 3)
            end_of_life = purchased_on + timedelta(days=365 * 5)
            disposal_date = purchased_on + timedelta(days=365 * 4) if status_code == "DISPOSED" else None

            asset_info = type_info[category_id]
            tag = f"{SEED_ASSET_TAG_PREFIX}{asset_info['tag']}-{global_index:04d}"
            cost_center = {1: "CC-IT", 2: "CC-HR", 3: "CC-FIN"}[department_id] + f"-{(global_index % 90) + 10}"

            assets.append(
                Asset(
                    id=asset_id,
                    asset_tag=tag,
                    name=f"{asset_info['name']} Enterprise #{global_index:04d}",
                    serial_number=f"{asset_info['tag']}-SN-{global_index:06d}",
                    asset_type=str(asset_info["type"]),
                    brand=str(asset_info["brand"]),
                    category_id=category_id,
                    model_id=model_id,
                    status_id=status_ids[status_code],
                    location_id=location_id,
                    vendor_id=vendor_id,
                    assigned_employee_id=employee_id,
                    current_department_id=department_id,
                    description="Generated enterprise seed asset",
                    purchase_date=purchased_on,
                    warranty_expiry_date=warranty,
                    expected_end_of_life_date=end_of_life,
                    disposal_date=disposal_date,
                    cost_center=cost_center,
                    location_floor="-1" if category_id == 6 else str((global_index % 5) + 1),
                    location_room="Server Room" if category_id == 6 else f"Office {(global_index % 30) + 1}",
                    location_rack=f"Rack-{(global_index % 6) + 1}" if category_id == 6 else None,
                    location_slot=f"U{(global_index % 20) + 1}" if category_id == 6 else None,
                )
            )
            asset_context.append(
                {
                    "asset_id": asset_id,
                    "status_code": status_code,
                    "employee_id": employee_id,
                    "department_id": department_id,
                    "location_id": location_id,
                    "category_id": category_id,
                    "tag": tag,
                }
            )

    db.add_all(assets)
    db.flush()
    return asset_context


def seed_assignments_and_events(
    db: Session,
    asset_context: list[dict[str, int | str | None]],
) -> tuple[list[int], list[int]]:
    assignment_id = ASSET_ASSIGNMENT_ID_START
    event_id = ASSET_EVENT_ID_START
    ticket_candidate_asset_ids: list[int] = []
    assigned_laptop_desktop_asset_ids: list[int] = []

    assignments: list[AssetAssignment] = []
    events: list[AssetEventLog] = []

    for index, ctx in enumerate(asset_context, start=1):
        asset_id = int(ctx["asset_id"])
        status_code = str(ctx["status_code"])
        employee_id = int(ctx["employee_id"]) if ctx["employee_id"] is not None else None
        category_id = int(ctx["category_id"])
        department_id = int(ctx["department_id"])
        location_id = int(ctx["location_id"])
        tag = str(ctx["tag"])

        events.append(
            AssetEventLog(
                id=event_id,
                asset_id=asset_id,
                event_type="CREATE",
                performed_by_user_id=2,
                summary=f"Asset {tag} creato",
                details_json={"asset_tag": tag},
                created_at=BASE_NOW - timedelta(days=220 - (index % 180)),
            )
        )
        event_id += 1

        if status_code == "ASSIGNED" and employee_id is not None:
            assigned_at = BASE_NOW - timedelta(days=(index % 120) + 5)
            assignments.append(
                AssetAssignment(
                    id=assignment_id,
                    asset_id=asset_id,
                    employee_id=employee_id,
                    assigned_by_user_id=2 if index % 5 else 1,
                    department_id=department_id,
                    location_id=location_id,
                    assigned_at=assigned_at,
                    expected_return_at=None if category_id == 6 else assigned_at + timedelta(days=180),
                    returned_at=None,
                    notes="Assegnazione operativa seed",
                )
            )
            assignment_id += 1
            events.append(
                AssetEventLog(
                    id=event_id,
                    asset_id=asset_id,
                    event_type="ASSIGN",
                    performed_by_user_id=2,
                    summary=f"Asset assegnato a dipendente {employee_id}",
                    details_json={"assigned_employee_id": employee_id},
                    created_at=assigned_at + timedelta(minutes=2),
                )
            )
            event_id += 1
            if category_id in {1, 2}:
                assigned_laptop_desktop_asset_ids.append(asset_id)
        else:
            if index % 6 == 0:
                historical_start = BASE_NOW - timedelta(days=(index % 300) + 120)
                historical_employee_id = ((index + 25) % TOTAL_EMPLOYEES) + 1
                assignments.append(
                    AssetAssignment(
                        id=assignment_id,
                        asset_id=asset_id,
                        employee_id=historical_employee_id,
                        assigned_by_user_id=2,
                        department_id=get_department_id(historical_employee_id),
                        location_id=location_id,
                        assigned_at=historical_start,
                        expected_return_at=historical_start + timedelta(days=90),
                        returned_at=historical_start + timedelta(days=60),
                        notes="Assegnazione storica chiusa seed",
                    )
                )
                assignment_id += 1
                events.append(
                    AssetEventLog(
                        id=event_id,
                        asset_id=asset_id,
                        event_type="RETURN",
                        performed_by_user_id=2,
                        summary="Asset rientrato da assegnazione storica",
                        details_json={"employee_id": historical_employee_id},
                        created_at=historical_start + timedelta(days=60, minutes=5),
                    )
                )
                event_id += 1

        if status_code in {"MAINTENANCE", "RETIRED", "DISPOSED"}:
            from_status = "ASSIGNED" if status_code == "MAINTENANCE" else "IN_STOCK"
            events.append(
                AssetEventLog(
                    id=event_id,
                    asset_id=asset_id,
                    event_type="STATUS_CHANGE",
                    performed_by_user_id=2,
                    summary=f"Stato aggiornato a {status_code}",
                    details_json={"from_status": from_status, "to_status": status_code},
                    created_at=BASE_NOW - timedelta(days=(index % 110) + 2),
                )
            )
            event_id += 1
            if status_code == "MAINTENANCE":
                ticket_candidate_asset_ids.append(asset_id)

        if index % 10 == 0:
            events.append(
                AssetEventLog(
                    id=event_id,
                    asset_id=asset_id,
                    event_type="LOCATION_CHANGE",
                    performed_by_user_id=3,
                    summary="Asset ricollocato per riallocazione interna",
                    details_json={"to_location_id": location_id},
                    created_at=BASE_NOW - timedelta(days=(index % 50)),
                )
            )
            event_id += 1

    db.add_all(assignments)
    db.add_all(events)
    db.flush()
    return ticket_candidate_asset_ids, assigned_laptop_desktop_asset_ids


def seed_maintenance_and_documents(db: Session, ticket_asset_ids: list[int]) -> None:
    ticket_id = MAINTENANCE_ID_START
    event_id = ASSET_EVENT_ID_START + 50_000

    maintenance_tickets: list[MaintenanceTicket] = []
    maintenance_events: list[AssetEventLog] = []

    for index, asset_id in enumerate(ticket_asset_ids, start=1):
        status = "IN_PROGRESS" if index % 2 == 0 else "OPEN"
        opened_at = BASE_NOW - timedelta(days=(index % 45) + 1)
        maintenance_tickets.append(
            MaintenanceTicket(
                id=ticket_id,
                asset_id=asset_id,
                vendor_id=((index - 1) % 8) + 1,
                opened_by_user_id=2 if index % 3 else 3,
                status=status,
                title=f"Intervento tecnico asset #{asset_id}",
                description="Ticket seed per manutenzione preventiva/correttiva.",
                opened_at=opened_at,
                closed_at=None,
            )
        )
        maintenance_events.append(
            AssetEventLog(
                id=event_id,
                asset_id=asset_id,
                event_type="MAINTENANCE_OPEN",
                performed_by_user_id=2,
                summary="Ticket manutenzione aperto",
                details_json={"ticket_id": ticket_id, "status": status},
                created_at=opened_at + timedelta(minutes=2),
            )
        )
        event_id += 1
        if status == "IN_PROGRESS":
            maintenance_events.append(
                AssetEventLog(
                    id=event_id,
                    asset_id=asset_id,
                    event_type="MAINTENANCE_STATUS_CHANGE",
                    performed_by_user_id=3,
                    summary="Ticket manutenzione in lavorazione",
                    details_json={"ticket_id": ticket_id, "status": "IN_PROGRESS"},
                    created_at=opened_at + timedelta(days=1),
                )
            )
            event_id += 1
        ticket_id += 1

    db.add_all(maintenance_tickets)
    db.add_all(maintenance_events)
    db.flush()

    storage_root = ensure_document_storage_root()
    if storage_root is None:
        return

    for existing_file in storage_root.glob(f"{SEED_DOC_PREFIX}*"):
        try:
            existing_file.unlink()
        except OSError:
            continue

    seeded_asset_ids = [asset_id for asset_id in range(ASSET_ID_START, ASSET_ID_START + sum(ASSET_MIX.values()))]
    doc_targets = seeded_asset_ids[::40]
    documents: list[AssetDocument] = []
    document_id = ASSET_DOCUMENT_ID_START
    for asset_id in doc_targets:
        if document_id % 5 == 0:
            content_type = "image/png"
            file_name = f"asset-{asset_id}-photo.png"
            stored_name = f"{SEED_DOC_PREFIX}asset-{asset_id}-photo.png"
            content = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9pX6lz8AAAAASUVORK5CYII="
            target = storage_root / stored_name
            target.write_bytes(b64decode(content))
        else:
            content_type = "text/plain"
            file_name = f"asset-{asset_id}-note.txt"
            stored_name = f"{SEED_DOC_PREFIX}asset-{asset_id}-note.txt"
            target = storage_root / stored_name
            target.write_text(f"Documento seed per asset {asset_id}\n", encoding="utf-8")

        documents.append(
            AssetDocument(
                id=document_id,
                asset_id=asset_id,
                uploaded_by_user_id=2,
                file_name=file_name,
                stored_name=stored_name,
                content_type=content_type,
                size_bytes=target.stat().st_size,
            )
        )
        document_id += 1

    db.add_all(documents)
    db.flush()


def clear_seeded_software_data(db: Session) -> None:
    seed_license_ids = db.scalars(
        select(SoftwareLicense.id).where(SoftwareLicense.product_name.like(f"{SEED_SOFTWARE_PREFIX}%"))
    ).all()
    legacy_license_ids = [1, 2, 3]
    all_license_ids = list(seed_license_ids) + legacy_license_ids
    if all_license_ids:
        db.execute(delete(SoftwareLicenseEventLog).where(SoftwareLicenseEventLog.software_license_id.in_(all_license_ids)))
        db.execute(delete(SoftwareLicenseAssignment).where(SoftwareLicenseAssignment.software_license_id.in_(all_license_ids)))
        db.execute(delete(SoftwareLicense).where(SoftwareLicense.id.in_(all_license_ids)))

    db.execute(delete(SoftwareLicenseAssignment).where(SoftwareLicenseAssignment.id >= SOFTWARE_ASSIGNMENT_ID_START))
    db.execute(delete(SoftwareLicenseEventLog).where(SoftwareLicenseEventLog.id >= SOFTWARE_EVENT_ID_START))
    db.execute(delete(SoftwareLicense).where(SoftwareLicense.id >= SOFTWARE_LICENSE_ID_START))
    db.flush()


def seed_software_domain_data(
    db: Session,
    role_by_user: dict[int, str],
    assigned_workstation_asset_ids: list[int],
) -> None:
    clear_seeded_software_data(db)

    license_rows = [
        {"id": SOFTWARE_LICENSE_ID_START + 1, "vendor_id": 1, "name": "Microsoft 365 Business Premium", "type": "Subscription"},
        {"id": SOFTWARE_LICENSE_ID_START + 2, "vendor_id": 2, "name": "Atlassian Jira Software", "type": "User Seat"},
        {"id": SOFTWARE_LICENSE_ID_START + 3, "vendor_id": 2, "name": "Atlassian Confluence", "type": "User Seat"},
        {"id": SOFTWARE_LICENSE_ID_START + 4, "vendor_id": 1, "name": "Endpoint Security Suite", "type": "Device Seat"},
        {"id": SOFTWARE_LICENSE_ID_START + 5, "vendor_id": 1, "name": "Enterprise VPN", "type": "Named User"},
        {"id": SOFTWARE_LICENSE_ID_START + 6, "vendor_id": 3, "name": "Adobe Creative Cloud Teams", "type": "Named User"},
        {"id": SOFTWARE_LICENSE_ID_START + 7, "vendor_id": 3, "name": "JetBrains All Products", "type": "Named User"},
        {"id": SOFTWARE_LICENSE_ID_START + 8, "vendor_id": 1, "name": "SIEM Analyst Console", "type": "Named User"},
    ]

    licenses: dict[str, SoftwareLicense] = {}
    for row in license_rows:
        license_obj = SoftwareLicense(
            id=row["id"],
            vendor_id=row["vendor_id"],
            product_name=f"{SEED_SOFTWARE_PREFIX}{row['name']}",
            license_type=row["type"],
            purchased_quantity=1,
            purchase_date=date(2025, 1, 10),
            expiry_date=date(2026, 12, 31),
            renewal_alert_days=45,
            notes="Generated enterprise seed license",
        )
        licenses[row["name"]] = license_obj
    db.add_all(list(licenses.values()))
    db.flush()

    role_bundle = {
        "ADMIN": ["Microsoft 365 Business Premium", "Atlassian Jira Software", "Atlassian Confluence", "Enterprise VPN", "SIEM Analyst Console", "JetBrains All Products"],
        "ASSET_MANAGER": ["Microsoft 365 Business Premium", "Atlassian Jira Software", "Atlassian Confluence", "Enterprise VPN"],
        "OPERATOR": ["Microsoft 365 Business Premium", "Atlassian Jira Software", "Enterprise VPN"],
        "VIEWER": ["Microsoft 365 Business Premium", "Enterprise VPN"],
    }

    assignment_id = SOFTWARE_ASSIGNMENT_ID_START
    event_id = SOFTWARE_EVENT_ID_START
    license_assignment_counts: dict[int, int] = {license_obj.id: 0 for license_obj in licenses.values()}

    assignments: list[SoftwareLicenseAssignment] = []
    events: list[SoftwareLicenseEventLog] = []

    for license_obj in licenses.values():
        events.append(
            SoftwareLicenseEventLog(
                id=event_id,
                software_license_id=license_obj.id,
                event_type="CREATE",
                performed_by_user_id=2,
                summary=f"Licenza creata: {license_obj.product_name}",
                details_json={"license_type": license_obj.license_type},
                created_at=BASE_NOW - timedelta(days=120),
            )
        )
        event_id += 1

    for user_id in sorted(role_by_user.keys()):
        role_code = role_by_user[user_id]
        bundles = role_bundle.get(role_code, role_bundle["VIEWER"])
        for license_name in bundles:
            license_obj = licenses[license_name]
            revoked_at = BASE_NOW - timedelta(days=7) if (user_id % 25 == 0 and license_name == "Atlassian Jira Software") else None
            assignments.append(
                SoftwareLicenseAssignment(
                    id=assignment_id,
                    software_license_id=license_obj.id,
                    user_id=user_id,
                    asset_id=None,
                    assigned_by_user_id=2,
                    assigned_at=BASE_NOW - timedelta(days=(user_id % 90) + 10),
                    revoked_at=revoked_at,
                    notes=f"Seed bundle {role_code}",
                )
            )
            assignment_id += 1
            if revoked_at is None:
                license_assignment_counts[license_obj.id] += 1
            events.append(
                SoftwareLicenseEventLog(
                    id=event_id,
                    software_license_id=license_obj.id,
                    event_type="REVOKE" if revoked_at else "ASSIGN",
                    performed_by_user_id=2,
                    summary=(
                        f"Assegnazione revocata utente {user_id}"
                        if revoked_at
                        else f"Licenza assegnata utente {user_id}"
                    ),
                    details_json={"user_id": user_id},
                    created_at=BASE_NOW - timedelta(days=(user_id % 60)),
                )
            )
            event_id += 1

    endpoint_license = licenses["Endpoint Security Suite"]
    for offset, asset_id in enumerate(assigned_workstation_asset_ids[:220], start=1):
        assignments.append(
            SoftwareLicenseAssignment(
                id=assignment_id,
                software_license_id=endpoint_license.id,
                user_id=None,
                asset_id=asset_id,
                assigned_by_user_id=2,
                assigned_at=BASE_NOW - timedelta(days=(offset % 100)),
                revoked_at=None,
                notes="Installazione endpoint protection su postazione assegnata",
            )
        )
        assignment_id += 1
        license_assignment_counts[endpoint_license.id] += 1
        if offset % 20 == 0:
            events.append(
                SoftwareLicenseEventLog(
                    id=event_id,
                    software_license_id=endpoint_license.id,
                    event_type="ASSIGN",
                    performed_by_user_id=2,
                    summary=f"Licenza assegnata ad asset {asset_id}",
                    details_json={"asset_id": asset_id},
                    created_at=BASE_NOW - timedelta(days=(offset % 80)),
                )
            )
            event_id += 1

    creative_license = licenses["Adobe Creative Cloud Teams"]
    for user_id in range(20, TOTAL_USERS + 1, 20):
        assignments.append(
            SoftwareLicenseAssignment(
                id=assignment_id,
                software_license_id=creative_license.id,
                user_id=user_id,
                asset_id=None,
                assigned_by_user_id=2,
                assigned_at=BASE_NOW - timedelta(days=(user_id % 40) + 3),
                revoked_at=None,
                notes="Licenza creativita per utenti selezionati",
            )
        )
        assignment_id += 1
        license_assignment_counts[creative_license.id] += 1

    db.add_all(assignments)
    db.add_all(events)

    for license_obj in licenses.values():
        active_assignments = license_assignment_counts[license_obj.id]
        buffer = max(5, int(active_assignments * 0.15))
        license_obj.purchased_quantity = active_assignments + buffer

    db.flush()


def main() -> None:
    db = SessionLocal()
    try:
        run_sql_file(db, Path(__file__).resolve().parents[3] / "database" / "seeds" / "seed_reference_data.sql")
        clear_seeded_software_data(db)
        role_by_user = seed_users(db)
        seed_employees(db)
        seed_vendors_and_models(db)
        seed_app_settings(db)
        asset_context = seed_asset_domain_data(db)
        ticket_asset_ids, assigned_workstation_asset_ids = seed_assignments_and_events(db, asset_context)
        seed_maintenance_and_documents(db, ticket_asset_ids)
        seed_software_domain_data(db, role_by_user, assigned_workstation_asset_ids)
        db.commit()
    finally:
        db.close()


if __name__ == "__main__":
    main()
