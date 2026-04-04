from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.config import settings
from app.services.email_notifications import EmailNotificationService
from app.tests.conftest import seed_asset


def test_unauthorized_access_is_blocked(client: TestClient, seeded_db: Session) -> None:
    response = client.get("/api/v1/assets")
    assert response.status_code == 401


def test_viewer_cannot_create_asset(client: TestClient, seeded_db: Session, auth_headers) -> None:
    headers = auth_headers("viewer", "viewer123")
    response = client.post(
        "/api/v1/assets",
        headers=headers,
        json={
            "asset_tag": "LT-2001",
            "name": "Viewer Attempt",
            "category_id": 1,
            "status_id": 1,
        },
    )
    assert response.status_code == 403


def test_asset_creation_creates_event(client: TestClient, seeded_db: Session, auth_headers) -> None:
    headers = auth_headers("admin", "admin123")
    response = client.post(
        "/api/v1/assets",
        headers=headers,
        json={
            "asset_tag": "LT-3001",
            "name": "Created Asset",
            "category_id": 1,
            "status_id": 1,
            "location_id": 1,
            "current_department_id": 1,
        },
    )
    assert response.status_code == 200, response.text
    payload = response.json()
    assert payload["asset_tag"] == "LT-3001"
    assert any(event["event_type"] == "CREATE" for event in payload["events"])


def test_asset_assignment_updates_asset_and_history(client: TestClient, seeded_db: Session, auth_headers) -> None:
    seed_asset(seeded_db)
    headers = auth_headers("admin", "admin123")

    response = client.post(
        "/api/v1/assets/1/assign",
        headers=headers,
        json={"user_id": 3, "department_id": 2, "location_id": 2, "notes": "Issued to employee"},
    )
    assert response.status_code == 200, response.text

    detail_response = client.get("/api/v1/assets/1", headers=headers)
    assert detail_response.status_code == 200
    payload = detail_response.json()
    assert payload["assigned_user"]["id"] == 3
    assert payload["status"]["code"] == "ASSIGNED"
    assert payload["assignments"][0]["returned_at"] is None
    assert any(event["event_type"] == "ASSIGN" for event in payload["events"])


def test_asset_return_closes_assignment(client: TestClient, seeded_db: Session, auth_headers) -> None:
    seed_asset(seeded_db)
    headers = auth_headers("admin", "admin123")
    assign_response = client.post(
        "/api/v1/assets/1/assign",
        headers=headers,
        json={"user_id": 3, "department_id": 2},
    )
    assert assign_response.status_code == 200, assign_response.text

    response = client.post("/api/v1/assets/1/return", headers=headers, json={})
    assert response.status_code == 200, response.text
    assert response.json()["returned_at"] is not None

    detail_response = client.get("/api/v1/assets/1", headers=headers)
    payload = detail_response.json()
    assert payload["assigned_user"] is None
    assert payload["status"]["code"] == "IN_STOCK"
    assert any(event["event_type"] == "RETURN" for event in payload["events"])


def test_status_change_writes_event_log(client: TestClient, seeded_db: Session, auth_headers) -> None:
    seed_asset(seeded_db)
    headers = auth_headers("admin", "admin123")

    response = client.patch("/api/v1/assets/1/status", headers=headers, json={"status_id": 3, "notes": "Retired"})
    assert response.status_code == 200, response.text
    payload = response.json()
    assert payload["status"]["code"] == "RETIRED"
    assert any(event["event_type"] == "STATUS_CHANGE" for event in payload["events"])


def test_asset_list_filtering_by_status(client: TestClient, seeded_db: Session, auth_headers) -> None:
    seed_asset(seeded_db, asset_id=1, asset_tag="LT-1001", status_id=1)
    seed_asset(seeded_db, asset_id=2, asset_tag="LT-1002", status_id=3)
    headers = auth_headers("admin", "admin123")

    response = client.get("/api/v1/assets?status_id=3", headers=headers)
    assert response.status_code == 200, response.text
    payload = response.json()
    assert payload["total"] == 1
    assert payload["items"][0]["asset_tag"] == "LT-1002"


def test_asset_manager_can_create_vendor_lookup(client: TestClient, seeded_db: Session, auth_headers) -> None:
    headers = auth_headers("admin", "admin123")
    response = client.post(
        "/api/v1/vendors",
        headers=headers,
        json={"name": "Dell Services", "contact_email": "support@dell.test"},
    )
    assert response.status_code == 200, response.text
    payload = response.json()
    assert payload["name"] == "Dell Services"


def test_viewer_cannot_create_vendor_lookup(client: TestClient, seeded_db: Session, auth_headers) -> None:
    headers = auth_headers("viewer", "viewer123")
    response = client.post(
        "/api/v1/vendors",
        headers=headers,
        json={"name": "Forbidden Vendor"},
    )
    assert response.status_code == 403


def test_lookup_update_changes_vendor_data(client: TestClient, seeded_db: Session, auth_headers) -> None:
    headers = auth_headers("admin", "admin123")
    create_response = client.post("/api/v1/vendors", headers=headers, json={"name": "Vendor One"})
    assert create_response.status_code == 200, create_response.text
    vendor_id = create_response.json()["id"]

    update_response = client.put(
        f"/api/v1/vendors/{vendor_id}",
        headers=headers,
        json={"name": "Vendor Updated", "contact_email": "ops@vendor.test", "contact_phone": "555-0100"},
    )
    assert update_response.status_code == 200, update_response.text
    payload = update_response.json()
    assert payload["name"] == "Vendor Updated"
    assert payload["contact_email"] == "ops@vendor.test"


def test_lookup_delete_blocks_when_vendor_is_in_use(client: TestClient, seeded_db: Session, auth_headers) -> None:
    headers = auth_headers("admin", "admin123")
    create_response = client.post("/api/v1/vendors", headers=headers, json={"name": "Vendor In Use"})
    assert create_response.status_code == 200, create_response.text
    vendor_id = create_response.json()["id"]

    asset_response = client.post(
        "/api/v1/assets",
        headers=headers,
        json={
            "asset_tag": "LT-4001",
            "name": "Vendor Bound Asset",
            "category_id": 1,
            "status_id": 1,
            "vendor_id": vendor_id,
        },
    )
    assert asset_response.status_code == 200, asset_response.text

    delete_response = client.delete(f"/api/v1/vendors/{vendor_id}", headers=headers)
    assert delete_response.status_code == 409
    assert "gia collegato" in delete_response.json()["detail"]


def test_lookup_delete_succeeds_when_category_not_used(client: TestClient, seeded_db: Session, auth_headers) -> None:
    headers = auth_headers("admin", "admin123")
    create_response = client.post(
        "/api/v1/asset-categories",
        headers=headers,
        json={"code": "PHONE", "name": "Smartphone"},
    )
    assert create_response.status_code == 200, create_response.text
    category_id = create_response.json()["id"]

    delete_response = client.delete(f"/api/v1/asset-categories/{category_id}", headers=headers)
    assert delete_response.status_code == 204


def test_admin_can_create_user(client: TestClient, seeded_db: Session, auth_headers) -> None:
    headers = auth_headers("admin", "admin123")
    response = client.post(
        "/api/v1/users",
        headers=headers,
        json={
            "username": "new.user",
            "full_name": "New User",
            "email": "new.user@example.com",
            "password": "temp1234",
            "department_id": 1,
            "is_active": True,
            "role_codes": ["OPERATOR"],
        },
    )
    assert response.status_code == 200, response.text
    payload = response.json()
    assert payload["username"] == "new.user"
    assert payload["role_codes"] == ["OPERATOR"]


def test_viewer_cannot_create_user(client: TestClient, seeded_db: Session, auth_headers) -> None:
    headers = auth_headers("viewer", "viewer123")
    response = client.post(
        "/api/v1/users",
        headers=headers,
        json={
            "username": "blocked.user",
            "full_name": "Blocked User",
            "email": "blocked@example.com",
            "password": "temp1234",
            "department_id": 1,
            "is_active": True,
            "role_codes": ["OPERATOR"],
        },
    )
    assert response.status_code == 403


def test_dashboard_summary_includes_operational_lists(client: TestClient, seeded_db: Session, auth_headers) -> None:
    seed_asset(seeded_db)
    headers = auth_headers("admin", "admin123")

    client.post(
        "/api/v1/assets/1/assign",
        headers=headers,
        json={"user_id": 3, "department_id": 2, "expected_return_at": "2026-04-10T10:00:00", "notes": "Prestito breve"},
    )
    client.post(
        "/api/v1/maintenance-tickets",
        headers=headers,
        json={"asset_id": 1, "title": "Controllo ventola", "description": "Rumore anomalo"},
    )

    response = client.get("/api/v1/dashboard/summary", headers=headers)
    assert response.status_code == 200, response.text
    payload = response.json()
    assert "recent_assets" in payload
    assert "recent_open_tickets" in payload
    assert payload["assets_by_status"][0]["status_name"]
    assert "lifecycle_alerts" in payload
    assert "assignment_alerts" in payload
    assert "notifications" in payload
    assert "assets_ready_for_assignment" in payload
    assert "retired_assets_pending_disposal" in payload
    assert "maintenance_queue" in payload


def test_document_download_returns_uploaded_file(
    client: TestClient,
    seeded_db: Session,
    auth_headers,
    tmp_path,
    monkeypatch,
) -> None:
    from app.core.config import settings

    seed_asset(seeded_db)
    monkeypatch.setattr(settings, "document_storage_path", str(tmp_path))
    headers = auth_headers("admin", "admin123")

    upload_response = client.post(
        "/api/v1/assets/1/documents",
        headers=headers,
        files={"file": ("manuale.txt", b"contenuto documento", "text/plain")},
    )
    assert upload_response.status_code == 200, upload_response.text
    document_id = upload_response.json()["id"]

    download_response = client.get(f"/api/v1/documents/{document_id}/download", headers=headers)
    assert download_response.status_code == 200, download_response.text
    assert download_response.content == b"contenuto documento"
    assert "manuale.txt" in download_response.headers.get("content-disposition", "")


def test_asset_lifecycle_fields_are_persisted(client: TestClient, seeded_db: Session, auth_headers) -> None:
    headers = auth_headers("admin", "admin123")
    response = client.post(
        "/api/v1/assets",
        headers=headers,
        json={
            "asset_tag": "LT-5001",
            "name": "Lifecycle Asset",
            "category_id": 1,
            "status_id": 1,
            "purchase_date": "2026-01-10",
            "warranty_expiry_date": "2028-01-10",
            "expected_end_of_life_date": "2030-01-10",
            "cost_center": "CC-IT-900",
        },
    )
    assert response.status_code == 200, response.text
    payload = response.json()
    assert payload["warranty_expiry_date"] == "2028-01-10"
    assert payload["expected_end_of_life_date"] == "2030-01-10"
    assert payload["cost_center"] == "CC-IT-900"


def test_disposal_date_requires_disposed_status(client: TestClient, seeded_db: Session, auth_headers) -> None:
    headers = auth_headers("admin", "admin123")
    response = client.post(
        "/api/v1/assets",
        headers=headers,
        json={
            "asset_tag": "LT-5002",
            "name": "Invalid Disposal Asset",
            "category_id": 1,
            "status_id": 1,
            "disposal_date": "2026-04-04",
        },
    )
    assert response.status_code == 422
    assert "Disposal date requires DISPOSED status" == response.json()["detail"]


def test_setting_disposal_date_creates_lifecycle_event(client: TestClient, seeded_db: Session, auth_headers) -> None:
    seed_asset(seeded_db)
    headers = auth_headers("admin", "admin123")

    response = client.put(
        "/api/v1/assets/1",
        headers=headers,
        json={
            "name": "ThinkPad T14",
            "category_id": 1,
            "status_id": 4,
            "serial_number": "SER-001",
            "model_id": None,
            "location_id": 1,
            "vendor_id": None,
            "current_department_id": 1,
            "description": None,
            "purchase_date": None,
            "warranty_expiry_date": "2027-01-01",
            "expected_end_of_life_date": "2028-01-01",
            "disposal_date": "2026-04-04",
            "cost_center": "CC-DIS-001",
        },
    )
    assert response.status_code == 200, response.text
    payload = response.json()
    assert payload["disposal_date"] == "2026-04-04"
    assert any(event["event_type"] == "DISPOSAL_RECORDED" for event in payload["events"])


def test_asset_csv_export_respects_filters(client: TestClient, seeded_db: Session, auth_headers) -> None:
    seed_asset(seeded_db, asset_id=1, asset_tag="LT-1001", status_id=1)
    seed_asset(seeded_db, asset_id=2, asset_tag="LT-1002", status_id=3)
    headers = auth_headers("admin", "admin123")

    response = client.get("/api/v1/assets/export/csv?status_id=3", headers=headers)
    assert response.status_code == 200, response.text
    body = response.content.decode("utf-8-sig")
    assert "Tag asset,Nome,Categoria,Stato" in body
    assert "LT-1002" in body
    assert "LT-1001" not in body


def test_asset_xlsx_export_returns_workbook(client: TestClient, seeded_db: Session, auth_headers) -> None:
    import zipfile
    from io import BytesIO

    seed_asset(seeded_db, asset_id=1, asset_tag="LT-2005", status_id=1)
    headers = auth_headers("admin", "admin123")

    response = client.get("/api/v1/assets/export/xlsx", headers=headers)
    assert response.status_code == 200, response.text
    assert response.headers["content-type"].startswith(
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )
    with zipfile.ZipFile(BytesIO(response.content)) as workbook:
        assert "xl/workbook.xml" in workbook.namelist()
        sheet = workbook.read("xl/worksheets/sheet1.xml").decode("utf-8")
        assert "LT-2005" in sheet


def test_assignment_sends_email_notification(
    client: TestClient,
    seeded_db: Session,
    auth_headers,
    monkeypatch,
) -> None:
    seed_asset(seeded_db)
    headers = auth_headers("admin", "admin123")
    calls: list[dict[str, object]] = []

    monkeypatch.setattr(settings, "notification_email_enabled", True)
    monkeypatch.setattr(settings, "notification_default_recipients", ["ops@example.com"])
    monkeypatch.setattr(settings, "smtp_host", "smtp.example.com")

    def fake_send_email(self, *, recipients: list[str], subject: str, body: str) -> bool:
        calls.append({"recipients": recipients, "subject": subject, "body": body})
        return True

    monkeypatch.setattr(EmailNotificationService, "send_email", fake_send_email)

    response = client.post(
        "/api/v1/assets/1/assign",
        headers=headers,
        json={"user_id": 3, "department_id": 2},
    )
    assert response.status_code == 200, response.text
    assert calls
    assert "employee@example.com" in calls[0]["recipients"]
    assert "ops@example.com" in calls[0]["recipients"]
    assert "Asset assegnato" in calls[0]["subject"]


def test_maintenance_status_change_sends_email_notification(
    client: TestClient,
    seeded_db: Session,
    auth_headers,
    monkeypatch,
) -> None:
    seed_asset(seeded_db)
    headers = auth_headers("admin", "admin123")
    calls: list[dict[str, object]] = []

    monkeypatch.setattr(settings, "notification_email_enabled", True)
    monkeypatch.setattr(settings, "notification_default_recipients", ["ops@example.com"])
    monkeypatch.setattr(settings, "smtp_host", "smtp.example.com")

    def fake_send_email(self, *, recipients: list[str], subject: str, body: str) -> bool:
        calls.append({"recipients": recipients, "subject": subject, "body": body})
        return True

    monkeypatch.setattr(EmailNotificationService, "send_email", fake_send_email)

    create_response = client.post(
        "/api/v1/maintenance-tickets",
        headers=headers,
        json={"asset_id": 1, "title": "Controllo ventola", "description": "Rumore anomalo"},
    )
    assert create_response.status_code == 200, create_response.text
    calls.clear()

    status_response = client.patch(
        "/api/v1/maintenance-tickets/1/status",
        headers=headers,
        json={"status": "IN_PROGRESS"},
    )
    assert status_response.status_code == 200, status_response.text
    assert calls
    assert "admin@example.com" in calls[0]["recipients"]
    assert "Aggiornamento ticket manutenzione" in calls[0]["subject"]
