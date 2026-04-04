from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models.lookup import Role
from app.models.user import User
from app.models.user import UserRole


class UserRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_username(self, username: str) -> User | None:
        statement = select(User).options(joinedload(User.roles).joinedload(UserRole.role)).where(User.username == username)
        return self.db.scalars(statement).unique().first()

    def get_by_id(self, user_id: int) -> User | None:
        statement = select(User).options(joinedload(User.roles).joinedload(UserRole.role)).where(User.id == user_id)
        return self.db.scalars(statement).unique().first()

    def list_users(self) -> list[User]:
        statement = select(User).options(joinedload(User.roles).joinedload(UserRole.role)).order_by(User.full_name)
        return self.db.scalars(statement).unique().all()

    def get_by_email(self, email: str) -> User | None:
        statement = select(User).options(joinedload(User.roles).joinedload(UserRole.role)).where(User.email == email)
        return self.db.scalars(statement).unique().first()

    def add(self, user: User) -> User:
        self.db.add(user)
        self.db.flush()
        self.db.refresh(user)
        return user

    def save(self, user: User) -> User:
        self.db.add(user)
        self.db.flush()
        self.db.refresh(user)
        return user

    def delete_roles_for_user(self, user_id: int) -> None:
        for item in self.db.scalars(select(UserRole).where(UserRole.user_id == user_id)).all():
            self.db.delete(item)
        self.db.flush()

    def add_user_role(self, user_role: UserRole) -> UserRole:
        self.db.add(user_role)
        self.db.flush()
        self.db.refresh(user_role)
        return user_role

    def list_roles(self) -> list[Role]:
        return self.db.scalars(select(Role).order_by(Role.name)).all()

    def get_roles_by_codes(self, role_codes: list[str]) -> list[Role]:
        if not role_codes:
            return []
        return self.db.scalars(select(Role).where(Role.code.in_(role_codes)).order_by(Role.name)).all()
