from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.user import User, UserRole
from app.repositories.user import UserRepository
from app.schemas.lookup import LookupItemResponse, LookupListResponse
from app.schemas.user import UserCreateRequest, UserListItemResponse, UserListResponse, UserUpdateRequest
from app.security.passwords import hash_password


class UserService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repository = UserRepository(db)

    def list_users(self, *, page: int, page_size: int) -> UserListResponse:
        users, total = self.repository.list_users_paginated(page=page, page_size=page_size)
        return UserListResponse(
            items=[self._build_user_response(user) for user in users],
            total=total,
            page=page,
            page_size=page_size,
        )

    def get_user(self, user_id: int) -> UserListItemResponse:
        user = self.repository.get_by_id(user_id)
        if user is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        return self._build_user_response(user)

    def list_roles(self) -> LookupListResponse:
        roles = self.repository.list_roles()
        return LookupListResponse(items=[LookupItemResponse.model_validate(role) for role in roles])

    def create_user(self, payload: UserCreateRequest) -> UserListItemResponse:
        self._validate_roles(payload.role_codes)
        user = User(
            department_id=payload.department_id,
            username=payload.username,
            full_name=payload.full_name,
            email=payload.email,
            password_hash=hash_password(payload.password),
            is_active=payload.is_active,
        )
        self.repository.add(user)
        self._replace_roles(user.id, payload.role_codes)
        self._commit_with_conflict("Esiste gia un utente con questo username o email.")
        user = self.repository.get_by_id(user.id)
        if user is None:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="User creation failed")
        return self._build_user_response(user)

    def update_user(self, user_id: int, payload: UserUpdateRequest) -> UserListItemResponse:
        user = self.repository.get_by_id(user_id)
        if user is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        self._validate_roles(payload.role_codes)
        user.department_id = payload.department_id
        user.full_name = payload.full_name
        user.email = payload.email
        user.is_active = payload.is_active
        if payload.password:
            user.password_hash = hash_password(payload.password)

        self.repository.save(user)
        self._replace_roles(user.id, payload.role_codes)
        self._commit_with_conflict("Esiste gia un utente con questa email.")
        user = self.repository.get_by_id(user.id)
        if user is None:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="User update failed")
        return self._build_user_response(user)

    def _replace_roles(self, user_id: int, role_codes: list[str]) -> None:
        roles = self.repository.get_roles_by_codes(role_codes)
        self.repository.delete_roles_for_user(user_id)
        for index, role in enumerate(roles, start=1):
            self.repository.add_user_role(UserRole(user_id=user_id, role_id=role.id))

    def _validate_roles(self, role_codes: list[str]) -> None:
        unique_codes = sorted(set(role_codes))
        if not unique_codes:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="At least one role is required")
        roles = self.repository.get_roles_by_codes(unique_codes)
        found_codes = {role.code for role in roles}
        if found_codes != set(unique_codes):
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="One or more roles are invalid")

    def _build_user_response(self, user: User) -> UserListItemResponse:
        return UserListItemResponse(
            id=user.id,
            username=user.username,
            full_name=user.full_name,
            email=user.email,
            department_id=user.department_id,
            is_active=user.is_active,
            role_codes=[user_role.role.code for user_role in user.roles if user_role.role is not None],
        )

    def _commit_with_conflict(self, detail: str) -> None:
        try:
            self.db.commit()
        except IntegrityError as exc:
            self.db.rollback()
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=detail) from exc
