"""
Тесты для API статистики.
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.core.database import get_db
from app.models.base import Base
# Импортируем все модели чтобы Base знал о всех таблицах
from app import models as _app_models  # noqa: F401
from app.models.word import Word

SQLALCHEMY_TEST_URL = "sqlite:///./test_stats.db"
engine_test = create_engine(SQLALCHEMY_TEST_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine_test)


@pytest.fixture(scope="function")
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
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def auth_headers(client):
    client.post("/api/v1/auth/register", json={
        "email": "stats@test.com",
        "username": "statsuser",
        "password": "password123",
    })
    resp = client.post("/api/v1/auth/login", data={
        "username": "stats@test.com",
        "password": "password123",
    })
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


class TestStatsSummary:
    def test_empty_stats_for_new_user(self, client, auth_headers):
        """Новый пользователь — все нули."""
        resp = client.get("/api/v1/stats/summary", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["words_learned"] == 0
        assert data["sessions_total"] == 0
        assert data["current_streak"] == 0
        assert data["accuracy_overall"] == 0.0

    def test_stats_requires_auth(self, client):
        resp = client.get("/api/v1/stats/summary")
        assert resp.status_code == 401

    def test_words_total_counts_all_words(self, client, auth_headers, db_session):
        """words_total отражает все слова в БД."""
        # Создать тестовое слово
        word = Word(arabic="الله", arabic_clean="الله", translation_ru="Аллах", frequency=100)
        db_session.add(word)
        db_session.commit()

        resp = client.get("/api/v1/stats/summary", headers=auth_headers)
        assert resp.json()["words_total"] == 1
