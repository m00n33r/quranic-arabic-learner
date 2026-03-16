from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class SessionStart(BaseModel):
    """Ответ при создании сессии."""
    id: int
    user_id: int
    started_at: datetime
    is_completed: bool = False

    model_config = {"from_attributes": True}


class SessionComplete(BaseModel):
    """Ответ при завершении сессии."""
    id: int
    cards_reviewed: int
    cards_correct: int
    accuracy: float          # cards_correct / cards_reviewed * 100
    duration_seconds: int    # длительность сессии
    completed_at: datetime

    model_config = {"from_attributes": True}


class SessionStatus(BaseModel):
    """Полный статус сессии."""
    id: int
    user_id: int
    started_at: datetime
    completed_at: Optional[datetime]
    is_completed: bool
    cards_reviewed: int
    cards_correct: int
    accuracy: Optional[float]

    model_config = {"from_attributes": True}
