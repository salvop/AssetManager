from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.lookup import AssetStatus
from app.models.preferences import AppSetting, UserPreference


class PreferencesRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_user_preferences(self, user_id: int) -> UserPreference | None:
        return self.db.get(UserPreference, user_id)

    def add_user_preferences(self, preferences: UserPreference) -> UserPreference:
        self.db.add(preferences)
        self.db.flush()
        self.db.refresh(preferences)
        return preferences

    def save_user_preferences(self, preferences: UserPreference) -> UserPreference:
        self.db.add(preferences)
        self.db.flush()
        self.db.refresh(preferences)
        return preferences

    def get_app_settings(self) -> AppSetting | None:
        return self.db.get(AppSetting, 1)

    def add_app_settings(self, settings: AppSetting) -> AppSetting:
        self.db.add(settings)
        self.db.flush()
        self.db.refresh(settings)
        return settings

    def save_app_settings(self, settings: AppSetting) -> AppSetting:
        self.db.add(settings)
        self.db.flush()
        self.db.refresh(settings)
        return settings

    def get_asset_status_by_id(self, status_id: int) -> AssetStatus | None:
        return self.db.get(AssetStatus, status_id)

    def get_asset_status_by_code(self, status_code: str) -> AssetStatus | None:
        statement = select(AssetStatus).where(AssetStatus.code == status_code)
        return self.db.scalar(statement)
