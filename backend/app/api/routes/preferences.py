from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.preferences import (
    AppSettingsResponse,
    AppSettingsUpdateRequest,
    UserPreferencesResponse,
    UserPreferencesUpdateRequest,
)
from app.security.deps import get_current_user, require_roles
from app.services.preferences import PreferencesService

router = APIRouter()


@router.get("/me/preferences", response_model=UserPreferencesResponse)
def get_my_preferences(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
) -> UserPreferencesResponse:
    return PreferencesService(db).get_user_preferences(user_id=current_user.id)


@router.patch("/me/preferences", response_model=UserPreferencesResponse)
def update_my_preferences(
    payload: UserPreferencesUpdateRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
) -> UserPreferencesResponse:
    return PreferencesService(db).update_user_preferences(user_id=current_user.id, payload=payload)


@router.get("/settings", response_model=AppSettingsResponse)
def get_app_settings(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
) -> AppSettingsResponse:
    return PreferencesService(db).get_app_settings()


@router.patch("/settings", response_model=AppSettingsResponse)
def update_app_settings(
    payload: AppSettingsUpdateRequest,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN")),
) -> AppSettingsResponse:
    return PreferencesService(db).update_app_settings(payload=payload, updated_by_user_id=current_user.id)
