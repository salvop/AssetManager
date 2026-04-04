from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

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
