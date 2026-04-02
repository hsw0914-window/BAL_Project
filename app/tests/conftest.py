import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from main import app
from app.core.database import Base, get_db

# 테스트용 인메모리 SQLite DB
TEST_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    TEST_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function", autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db():
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client(db):
    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def registered_user(client):
    """회원가입 + 토큰 반환 픽스처"""
    res = client.post("/api/v1/auth/register", json={
        "email": "test@example.com",
        "password": "password123",
        "nickname": "테스터",
    })
    assert res.status_code == 201
    return res.json()


@pytest.fixture
def auth_headers(registered_user):
    """인증 헤더 픽스처"""
    token = registered_user["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def baby(client, auth_headers):
    """아이 등록 픽스처"""
    res = client.post("/api/v1/babies", json={
        "name": "민준",
        "birth_date": "2024-03-15",
        "gender": "male",
    }, headers=auth_headers)
    assert res.status_code == 201
    return res.json()
