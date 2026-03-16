"""
Утилиты безопасности: хэширование паролей (bcrypt) и JWT токены (python-jose).

Используем bcrypt напрямую (passlib 1.7.4 несовместим с bcrypt 4+/5+).
python-jose[cryptography] как указано в pyproject.toml.
"""
from datetime import datetime, timedelta, timezone
from typing import Optional

import bcrypt
from jose import JWTError, jwt

from app.core.config import settings


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Проверить пароль против bcrypt хэша."""
    return bcrypt.checkpw(
        plain_password.encode("utf-8"),
        hashed_password.encode("utf-8"),
    )


def get_password_hash(password: str) -> str:
    """Создать bcrypt хэш пароля."""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Создать JWT access token.

    Args:
        data: payload (обычно {"sub": str(user_id)})
        expires_delta: время жизни токена (по умолчанию из settings)

    Returns: JWT строка
    """
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.access_token_expire_minutes)
    )
    to_encode["exp"] = expire
    return jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)


def decode_access_token(token: str) -> Optional[dict]:
    """
    Декодировать JWT токен.

    Returns: payload dict или None если токен невалиден/истёк
    """
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        return payload
    except JWTError:
        return None
