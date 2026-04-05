from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.preferences import AppSetting, UserPreference
from app.repositories.preferences import PreferencesRepository
from app.schemas.preferences import (
    AppSettingsResponse,
    AppSettingsUpdateRequest,
    UserPreferencesResponse,
    UserPreferencesUpdateRequest,
)

_DISALLOWED_DEFAULT_STATUS_CODES = {"RETIRED", "DISPOSED"}
_DEFAULT_ALLOWED_MIME_TYPES = "application/pdf,image/png,image/jpeg,text/plain"


class PreferencesService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repository = PreferencesRepository(db)

    def get_user_preferences(self, *, user_id: int) -> UserPreferencesResponse:
        preferences = self._ensure_user_preferences(user_id)
        return UserPreferencesResponse.model_validate(preferences)

    def update_user_preferences(self, *, user_id: int, payload: UserPreferencesUpdateRequest) -> UserPreferencesResponse:
        preferences = self._ensure_user_preferences(user_id)

        updates = payload.model_dump(exclude_unset=True)
        for field_name, value in updates.items():
            if value is not None:
                setattr(preferences, field_name, value)

        self.repository.save_user_preferences(preferences)
        self.db.commit()
        return UserPreferencesResponse.model_validate(preferences)

    def get_app_settings(self) -> AppSettingsResponse:
        app_settings = self._ensure_app_settings()
        return self._build_app_settings_response(app_settings)

    def update_app_settings(self, *, payload: AppSettingsUpdateRequest, updated_by_user_id: int) -> AppSettingsResponse:
        app_settings = self._ensure_app_settings()
        updates = payload.model_dump(exclude_unset=True)

        if "default_asset_status_on_create_id" in updates:
            status_id = updates["default_asset_status_on_create_id"]
            if status_id is not None:
                status_record = self.repository.get_asset_status_by_id(status_id)
                if status_record is None:
                    raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail="Asset status not found")
                if status_record.code in _DISALLOWED_DEFAULT_STATUS_CODES:
                    raise HTTPException(
                        status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                        detail="Default status cannot be RETIRED or DISPOSED",
                    )
                app_settings.default_asset_status_on_create_id = status_id

        if "org_name" in updates and updates["org_name"] is not None:
            app_settings.org_name = updates["org_name"]

        if "max_document_size_mb" in updates and updates["max_document_size_mb"] is not None:
            app_settings.max_document_size_mb = updates["max_document_size_mb"]

        if "allowed_document_mime_types" in updates and updates["allowed_document_mime_types"] is not None:
            app_settings.allowed_document_mime_types = ",".join(updates["allowed_document_mime_types"])

        app_settings.updated_by_user_id = updated_by_user_id
        self.repository.save_app_settings(app_settings)
        self.db.commit()
        return self._build_app_settings_response(app_settings)

    def _ensure_user_preferences(self, user_id: int) -> UserPreference:
        preferences = self.repository.get_user_preferences(user_id)
        if preferences is not None:
            return preferences

        preferences = UserPreference(user_id=user_id)
        self.repository.add_user_preferences(preferences)
        self.db.commit()
        return preferences

    def _ensure_app_settings(self) -> AppSetting:
        app_settings = self.repository.get_app_settings()
        if app_settings is not None:
            return app_settings

        status_record = self.repository.get_asset_status_by_code("IN_STOCK")
        if status_record is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="IN_STOCK status is missing. Run seed/reference data setup.",
            )

        app_settings = AppSetting(
            id=1,
            default_asset_status_on_create_id=status_record.id,
            allowed_document_mime_types=_DEFAULT_ALLOWED_MIME_TYPES,
        )
        self.repository.add_app_settings(app_settings)
        self.db.commit()
        return app_settings

    def _build_app_settings_response(self, app_settings: AppSetting) -> AppSettingsResponse:
        allowed_document_mime_types = [
            item.strip()
            for item in app_settings.allowed_document_mime_types.split(",")
            if item and item.strip()
        ]
        return AppSettingsResponse(
            org_name=app_settings.org_name,
            default_asset_status_on_create_id=app_settings.default_asset_status_on_create_id,
            max_document_size_mb=app_settings.max_document_size_mb,
            allowed_document_mime_types=allowed_document_mime_types,
            updated_by_user_id=app_settings.updated_by_user_id,
            updated_at=app_settings.updated_at,
        )
