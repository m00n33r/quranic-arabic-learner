"""
Интеграционные тесты auth flow.

Используем TestClient (httpx) — запросы идут через FastAPI без реального сервера.
БД: SQLite in-memory через фикстуру (не требует PostgreSQL).
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.core.database import get_db
from app.models.base import Base

# Тестовая SQLite БД в памяти (не требует PostgreSQL для тестов)
SQLALCHEMY_TEST_URL = "sqlite:///./test_auth.db"

engine_test = create_engine(
    SQLALCHEMY_TEST_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine_test)


@pytest.fixture(scope="function", autouse=False)
def db_session():
    Base.metadata.create_all(bind=engine_test)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine_test)


@pytest.fixture(scope="function")
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


class TestRegister:
    def test_register_success(self, client):
        response = client.post("/api/v1/auth/register", json={
            "email": "test@example.com",
            "username": "testuser",
            "password": "password123",
        })
        assert response.status_code == 201
        data = response.json()
        assert data["email"] == "test@example.com"
        assert data["username"] == "testuser"
        assert "id" in data
        assert "hashed_password" not in data  # пароль не утекает

    def test_register_duplicate_email(self, client):
        payload = {"email": "dup@example.com", "username": "user1", "password": "password123"}
        client.post("/api/v1/auth/register", json=payload)
        response = client.post("/api/v1/auth/register", json={
            **payload, "username": "user2"
        })
        assert response.status_code == 400

    def test_register_duplicate_username(self, client):
        payload = {"email": "first@example.com", "username": "dupuser", "password": "password123"}
        client.post("/api/v1/auth/register", json=payload)
        response = client.post("/api/v1/auth/register", json={
            "email": "second@example.com",
            "username": "dupuser",
            "password": "password123",
        })
        assert response.status_code == 400

    def test_register_invalid_email(self, client):
        response = client.post("/api/v1/auth/register", json={
            "email": "not-an-email",
            "username": "testuser",
            "password": "password123",
        })
        assert response.status_code == 422  # Pydantic validation error

    def test_register_short_password(self, client):
        response = client.post("/api/v1/auth/register", json={
            "email": "test@example.com",
            "username": "testuser",
            "password": "short",
        })
        assert response.status_code == 422


class TestLogin:
    def test_login_success(self, client):
        # Сначала регистрируем
        client.post("/api/v1/auth/register", json={
            "email": "login@example.com",
            "username": "loginuser",
            "password": "password123",
        })
        # Логинимся (OAuth2 form: username=email)
        response = client.post("/api/v1/auth/login", data={
            "username": "login@example.com",
            "password": "password123",
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    def test_login_wrong_password(self, client):
        client.post("/api/v1/auth/register", json={
            "email": "test2@example.com",
            "username": "testuser2",
            "password": "password123",
        })
        response = client.post("/api/v1/auth/login", data={
            "username": "test2@example.com",
            "password": "wrongpassword",
        })
        assert response.status_code == 401

    def test_login_nonexistent_user(self, client):
        response = client.post("/api/v1/auth/login", data={
            "username": "nobody@example.com",
            "password": "password123",
        })
        assert response.status_code == 401


class TestGetMe:
    def _register_and_login(self, client):
        client.post("/api/v1/auth/register", json={
            "email": "me@example.com",
            "username": "meuser",
            "password": "password123",
        })
        resp = client.post("/api/v1/auth/login", data={
            "username": "me@example.com",
            "password": "password123",
        })
        return resp.json()["access_token"]

    def test_get_me_with_valid_token(self, client):
        token = self._register_and_login(client)
        response = client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "me@example.com"

    def test_get_me_without_token(self, client):
        response = client.get("/api/v1/auth/me")
        assert response.status_code == 401

    def test_get_me_invalid_token(self, client):
        response = client.get(
            "/api/v1/auth/me",
            headers={"Authorization": "Bearer invalid.token.value"},
        )
        assert response.status_code == 401
