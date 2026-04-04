from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.auth import LoginRequest, LoginResponse, UserMeResponse
from app.security.deps import get_current_user
from app.services.auth import AuthService

router = APIRouter()


@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> LoginResponse:
    return AuthService(db).login(payload)


@router.get("/me", response_model=UserMeResponse)
def me(current_user=Depends(get_current_user)) -> UserMeResponse:
    return UserMeResponse.model_validate(current_user)
