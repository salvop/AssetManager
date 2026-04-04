import os
from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.engine import URL, make_url
from sqlalchemy.orm import Session, sessionmaker

from app.db.base import Base
from app.db.session import get_db
from app.main import app
from app.core.config import settings
from app.models import asset as asset_models  # noqa: F401
from app.models import assignment as assignment_models  # noqa: F401
from app.models import employee as employee_models  # noqa: F401
from app.models import lookup as lookup_models  # noqa: F401
from app.models import maintenance as maintenance_models  # noqa: F401
from app.models import software as software_models  # noqa: F401
from app.models import user as user_models  # noqa: F401
from app.models.asset import Asset
from app.models.employee import Employee
from app.models.lookup import AssetCategory, AssetStatus, Department, Location, Role
from app.models.user import User, UserRole
from app.security.passwords import hash_password


def _build_test_url() -> URL:
    base_url = make_url(settings.database_url)
    root_password = os.getenv("MARIADB_ROOT_PASSWORD", "root_password")
    return URL.create(
        drivername=base_url.drivername,
        username="root",
        password=root_password,
        host=base_url.host,
        port=base_url.port,
        database="asset_manager_test",
    )


TEST_DATABASE_URL = _build_test_url()
ADMIN_DATABASE_URL = TEST_DATABASE_URL.set(database=make_url(settings.database_url).database)

admin_engine = create_engine(ADMIN_DATABASE_URL, future=True, pool_pre_ping=True)
test_engine = create_engine(TEST_DATABASE_URL, future=True, pool_pre_ping=True)
TestingSessionLocal = sessionmaker(bind=test_engine, autoflush=False, autocommit=False, future=True)


@pytest.fixture(scope="session", autouse=True)
def create_test_database() -> Generator[None, None, None]:
    with admin_engine.connect() as connection:
        connection.execute(text("CREATE DATABASE IF NOT EXISTS asset_manager_test"))
        connection.commit()
    Base.metadata.drop_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)
    with admin_engine.connect() as connection:
        connection.execute(text("DROP DATABASE IF EXISTS asset_manager_test"))
        connection.commit()


@pytest.fixture(autouse=True)
def reset_database() -> Generator[None, None, None]:
    Base.metadata.drop_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)
    yield


@pytest.fixture
def db_session() -> Generator[Session, None, None]:
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client(db_session: Session) -> Generator[TestClient, None, None]:
    def override_get_db() -> Generator[Session, None, None]:
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def seed_reference_data(session: Session) -> None:
    departments = [
        Department(id=1, code="IT", name="Information Technology", is_active=True),
        Department(id=2, code="OPS", name="Operations", is_active=True),
    ]
    locations = [
        Location(id=1, code="HQ", name="Headquarters"),
        Location(id=2, code="STO", name="Storage"),
    ]
    roles = [
        Role(id=1, code="ADMIN", name="Administrator"),
        Role(id=2, code="ASSET_MANAGER", name="Asset Manager"),
        Role(id=3, code="OPERATOR", name="Operator"),
        Role(id=4, code="VIEWER", name="Viewer"),
    ]
    categories = [AssetCategory(id=1, code="LAPTOP", name="Laptop")]
    statuses = [
        AssetStatus(id=1, code="IN_STOCK", name="In Stock", is_assignable=True),
        AssetStatus(id=2, code="ASSIGNED", name="Assigned", is_assignable=True),
        AssetStatus(id=3, code="RETIRED", name="Retired", is_assignable=False),
        AssetStatus(id=4, code="DISPOSED", name="Disposed", is_assignable=False),
    ]
    session.add_all([*departments, *locations, *roles, *categories, *statuses])
    session.commit()


def seed_users(session: Session) -> None:
    admin = User(
        id=1,
        department_id=1,
        username="admin",
        full_name="Admin User",
        email="admin@example.com",
        password_hash=hash_password("admin123"),
        is_active=True,
    )
    viewer = User(
        id=2,
        department_id=1,
        username="viewer",
        full_name="Viewer User",
        email="viewer@example.com",
        password_hash=hash_password("viewer123"),
        is_active=True,
    )
    employee = User(
        id=3,
        department_id=2,
        username="employee",
        full_name="Employee User",
        email="employee@example.com",
        password_hash=hash_password("employee123"),
        is_active=True,
    )
    session.add_all([admin, viewer, employee])
    session.flush()
    session.add_all(
        [
            UserRole(id=1, user_id=1, role_id=1),
            UserRole(id=2, user_id=2, role_id=4),
            UserRole(id=3, user_id=3, role_id=3),
        ]
    )
    session.commit()


def seed_employees(session: Session) -> None:
    session.add_all(
        [
            Employee(id=1, department_id=1, employee_code="EMP-00001", full_name="Admin User", email="admin@example.com", is_active=True),
            Employee(id=2, department_id=1, employee_code="EMP-00002", full_name="Viewer User", email="viewer@example.com", is_active=True),
            Employee(id=3, department_id=2, employee_code="EMP-00003", full_name="Employee User", email="employee@example.com", is_active=True),
        ]
    )
    session.commit()


def seed_asset(session: Session, *, asset_id: int = 1, asset_tag: str = "LT-1001", status_id: int = 1) -> Asset:
    asset = Asset(
        id=asset_id,
        asset_tag=asset_tag,
        name="ThinkPad T14",
        category_id=1,
        status_id=status_id,
        location_id=1,
        current_department_id=1,
        serial_number="SER-001",
    )
    session.add(asset)
    session.commit()
    session.refresh(asset)
    return asset


@pytest.fixture
def seeded_db(db_session: Session) -> Session:
    seed_reference_data(db_session)
    seed_users(db_session)
    seed_employees(db_session)
    return db_session


@pytest.fixture
def auth_headers(client: TestClient, seeded_db: Session):
    def factory(username: str, password: str) -> dict[str, str]:
        response = client.post("/api/v1/auth/login", json={"username": username, "password": password})
        assert response.status_code == 200, response.text
        token = response.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}

    return factory
