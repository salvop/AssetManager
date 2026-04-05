from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.security.deps import require_roles
from app.schemas.lookup import LookupListResponse
from app.schemas.user import UserCreateRequest, UserListItemResponse, UserListResponse, UserUpdateRequest
from app.services.users import UserService

router = APIRouter()


@router.get("", response_model=UserListResponse)
def list_users(
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN", "ASSET_MANAGER", "OPERATOR", "VIEWER")),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> UserListResponse:
    return UserService(db).list_users(page=page, page_size=page_size)


@router.get("/roles", response_model=LookupListResponse)
def list_roles(
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN", "ASSET_MANAGER", "OPERATOR", "VIEWER")),
) -> LookupListResponse:
    return UserService(db).list_roles()


@router.get("/{user_id}", response_model=UserListItemResponse)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN", "ASSET_MANAGER", "OPERATOR", "VIEWER")),
) -> UserListItemResponse:
    return UserService(db).get_user(user_id)


@router.post("", response_model=UserListItemResponse)
def create_user(
    payload: UserCreateRequest,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN")),
) -> UserListItemResponse:
    return UserService(db).create_user(payload)


@router.put("/{user_id}", response_model=UserListItemResponse)
def update_user(
    user_id: int,
    payload: UserUpdateRequest,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN")),
) -> UserListItemResponse:
    return UserService(db).update_user(user_id, payload)
