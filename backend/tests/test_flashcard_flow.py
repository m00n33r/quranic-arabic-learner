"""
Интеграционные тесты полного цикла флэш-карточек.
register → login → start session → get due cards → review → complete session
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

SQLALCHEMY_TEST_URL = "sqlite:///./test_flashcard.db"
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
def auth_headers(client, db_session):
    """Зарегистрировать пользователя и вернуть auth headers."""
    client.post("/api/v1/auth/register", json={
        "email": "learner@test.com",
        "username": "learner",
        "password": "password123",
    })
    resp = client.post("/api/v1/auth/login", data={
        "username": "learner@test.com",
        "password": "password123",
    })
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def seed_words(db_session):
    """Создать тестовые слова в БД."""
    from app.models.word import Word

    words = [
        Word(arabic="عَمَّ", arabic_clean="عم", translation_ru="о чём", frequency=5),
        Word(arabic="الله", arabic_clean="الله", translation_ru="Аллах", frequency=100),
        Word(arabic="كِتَابٌ", arabic_clean="كتاب", translation_ru="книга", frequency=10),
    ]
    for w in words:
        db_session.add(w)
    db_session.commit()
    for w in words:
        db_session.refresh(w)
    return words


class TestDueCards:
    def test_new_user_gets_new_cards(self, client, auth_headers, seed_words):
        response = client.get("/api/v1/cards/due", headers=auth_headers)
        assert response.status_code == 200
        cards = response.json()
        assert len(cards) > 0
        # Все карточки должны быть новыми
        assert all(c["is_new"] for c in cards)

    def test_due_cards_without_auth(self, client):
        response = client.get("/api/v1/cards/due")
        assert response.status_code == 401

    def test_limit_parameter(self, client, auth_headers, seed_words):
        response = client.get("/api/v1/cards/due?limit=1", headers=auth_headers)
        assert response.status_code == 200
        assert len(response.json()) == 1


class TestReviewCard:
    def test_review_card_success(self, client, auth_headers, seed_words):
        word_id = seed_words[0].id
        response = client.post(
            f"/api/v1/cards/{word_id}/review",
            json={"quality": 3},
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["word_id"] == word_id
        assert data["is_correct"] is True  # quality=3 (good) → correct
        assert data["new_repetitions"] == 1
        assert data["new_interval"] == 1  # первый ответ → 1 день

    def test_review_again_resets_progress(self, client, auth_headers, seed_words):
        word_id = seed_words[0].id
        # Сначала правильный ответ
        client.post(f"/api/v1/cards/{word_id}/review", json={"quality": 4}, headers=auth_headers)
        # Потом "again"
        response = client.post(
            f"/api/v1/cards/{word_id}/review",
            json={"quality": 1},
            headers=auth_headers,
        )
        data = response.json()
        assert data["new_repetitions"] == 0
        assert data["is_correct"] is False  # quality=1 → incorrect

    def test_review_invalid_quality(self, client, auth_headers, seed_words):
        response = client.post(
            f"/api/v1/cards/{seed_words[0].id}/review",
            json={"quality": 5},  # невалидное значение
            headers=auth_headers,
        )
        assert response.status_code == 422


class TestSessions:
    def test_full_session_flow(self, client, auth_headers, seed_words):
        # 1. Начать сессию
        resp = client.post("/api/v1/sessions/start", headers=auth_headers)
        assert resp.status_code == 201
        session_id = resp.json()["id"]

        # 2. Повторить карточки в рамках сессии
        for word in seed_words:
            client.post(
                f"/api/v1/cards/{word.id}/review",
                json={"quality": 3, "session_id": session_id},
                headers=auth_headers,
            )

        # 3. Завершить сессию
        resp = client.post(f"/api/v1/sessions/{session_id}/complete", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["cards_reviewed"] == len(seed_words)
        assert data["cards_correct"] == len(seed_words)  # все quality=3 → correct
        assert data["accuracy"] == 100.0

    def test_get_session_status(self, client, auth_headers):
        resp = client.post("/api/v1/sessions/start", headers=auth_headers)
        session_id = resp.json()["id"]

        status_resp = client.get(f"/api/v1/sessions/{session_id}", headers=auth_headers)
        assert status_resp.status_code == 200
        assert status_resp.json()["is_completed"] is False

    def test_complete_session_twice_fails(self, client, auth_headers):
        resp = client.post("/api/v1/sessions/start", headers=auth_headers)
        session_id = resp.json()["id"]
        client.post(f"/api/v1/sessions/{session_id}/complete", headers=auth_headers)
        # Вторая попытка завершить
        resp = client.post(f"/api/v1/sessions/{session_id}/complete", headers=auth_headers)
        assert resp.status_code == 400
