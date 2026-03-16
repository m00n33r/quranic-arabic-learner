import pytest
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    decode_access_token,
)


class TestPasswordHashing:
    def test_hash_and_verify(self):
        password = "MySecret123!"
        hashed = get_password_hash(password)
        assert verify_password(password, hashed) is True

    def test_wrong_password_fails(self):
        hashed = get_password_hash("correct_password")
        assert verify_password("wrong_password", hashed) is False

    def test_hash_is_not_plaintext(self):
        password = "MySecret123!"
        hashed = get_password_hash(password)
        assert hashed != password
        assert hashed.startswith("$2b$")  # bcrypt prefix

    def test_two_hashes_differ(self):
        # bcrypt генерирует разный salt каждый раз
        h1 = get_password_hash("password")
        h2 = get_password_hash("password")
        assert h1 != h2


class TestJWT:
    def test_create_and_decode(self):
        payload = {"sub": "42", "email": "test@example.com"}
        token = create_access_token(payload)
        decoded = decode_access_token(token)
        assert decoded is not None
        assert decoded["sub"] == "42"
        assert decoded["email"] == "test@example.com"

    def test_invalid_token_returns_none(self):
        assert decode_access_token("invalid.token.here") is None

    def test_tampered_token_returns_none(self):
        token = create_access_token({"sub": "1"})
        tampered = token[:-5] + "XXXXX"
        assert decode_access_token(tampered) is None

    def test_token_contains_exp(self):
        token = create_access_token({"sub": "1"})
        decoded = decode_access_token(token)
        assert "exp" in decoded
