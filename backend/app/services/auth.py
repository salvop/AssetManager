from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.repositories.user import UserRepository
from app.schemas.auth import LoginRequest, LoginResponse, UserMeResponse
from app.security.auth import create_access_token
from app.security.passwords import verify_password


class AuthService:
    def __init__(self, db: Session) -> None:
        self.user_repository = UserRepository(db)

    def login(self, payload: LoginRequest) -> LoginResponse:
        user = self.user_repository.get_by_username(payload.username)
        if user is None or not verify_password(payload.password, user.password_hash):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

        user.role_codes = [user_role.role.code for user_role in user.roles if user_role.role is not None]
        access_token = create_access_token(user.username)
        return LoginResponse(access_token=access_token, user=UserMeResponse.model_validate(user))
