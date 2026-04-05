from fastapi.testclient import TestClient
from sqlalchemy.orm import Session


def test_get_my_preferences_creates_default_row(client: TestClient, seeded_db: Session, auth_headers) -> None:
    headers = auth_headers("admin", "admin123")

    response = client.get("/api/v1/me/preferences", headers=headers)

    assert response.status_code == 200, response.text
    payload = response.json()
    assert payload["language"] == "it-IT"
    assert payload["timezone"] == "Europe/Rome"
    assert payload["default_page_size"] == 25


def test_patch_my_preferences_updates_values(client: TestClient, seeded_db: Session, auth_headers) -> None:
    headers = auth_headers("admin", "admin123")

    response = client.patch(
        "/api/v1/me/preferences",
        headers=headers,
        json={
            "language": "en-US",
            "timezone": "Europe/London",
            "table_density": "compact",
            "default_page_size": 50,
        },
    )

    assert response.status_code == 200, response.text
    payload = response.json()
    assert payload["language"] == "en-US"
    assert payload["timezone"] == "Europe/London"
    assert payload["table_density"] == "compact"
    assert payload["default_page_size"] == 50


def test_non_admin_cannot_patch_app_settings(client: TestClient, seeded_db: Session, auth_headers) -> None:
    headers = auth_headers("viewer", "viewer123")

    response = client.patch(
        "/api/v1/settings",
        headers=headers,
        json={"org_name": "Blocked Update"},
    )

    assert response.status_code == 403


def test_admin_can_patch_app_settings(client: TestClient, seeded_db: Session, auth_headers) -> None:
    headers = auth_headers("admin", "admin123")

    response = client.patch(
        "/api/v1/settings",
        headers=headers,
        json={
            "org_name": "Acme Asset Hub",
            "default_asset_status_on_create_id": 1,
            "max_document_size_mb": 20,
            "allowed_document_mime_types": ["application/pdf", "image/png"],
        },
    )

    assert response.status_code == 200, response.text
    payload = response.json()
    assert payload["org_name"] == "Acme Asset Hub"
    assert payload["default_asset_status_on_create_id"] == 1
    assert payload["max_document_size_mb"] == 20
    assert payload["allowed_document_mime_types"] == ["application/pdf", "image/png"]


def test_admin_cannot_set_disposed_as_default_status(client: TestClient, seeded_db: Session, auth_headers) -> None:
    headers = auth_headers("admin", "admin123")

    response = client.patch(
        "/api/v1/settings",
        headers=headers,
        json={"default_asset_status_on_create_id": 4},
    )

    assert response.status_code == 422
    assert response.json()["detail"] == "Default status cannot be RETIRED or DISPOSED"
