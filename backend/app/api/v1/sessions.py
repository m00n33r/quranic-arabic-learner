from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session as DBSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.models.flashcard import ReviewSession, CardReview
from app.schemas.session import SessionStart, SessionComplete, SessionStatus

router = APIRouter(prefix="/sessions", tags=["sessions"])


@router.post("/start", response_model=SessionStart, status_code=status.HTTP_201_CREATED)
def start_session(
    db: DBSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Начать новую сессию повторения."""
    session = ReviewSession(user_id=current_user.id)
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


@router.post("/{session_id}/complete", response_model=SessionComplete)
def complete_session(
    session_id: int,
    db: DBSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Завершить сессию и посчитать итоги."""
    session = db.query(ReviewSession).filter(
        ReviewSession.id == session_id,
        ReviewSession.user_id == current_user.id,
    ).first()

    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    if session.is_completed:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Session already completed")

    # Подсчитать итоги из CardReview записей
    reviews = db.query(CardReview).filter(CardReview.session_id == session_id).all()
    total = len(reviews)
    correct = sum(1 for r in reviews if r.quality >= 2)  # Hard и выше = правильно

    now = datetime.now(timezone.utc)
    duration = int((now - session.started_at.replace(tzinfo=timezone.utc)).total_seconds())

    session.completed_at = now
    session.is_completed = True
    session.cards_reviewed = total
    session.cards_correct = correct
    db.commit()

    accuracy = (correct / total * 100) if total > 0 else 0.0
    return SessionComplete(
        id=session.id,
        cards_reviewed=total,
        cards_correct=correct,
        accuracy=round(accuracy, 1),
        duration_seconds=duration,
        completed_at=now,
    )


@router.get("/{session_id}", response_model=SessionStatus)
def get_session(
    session_id: int,
    db: DBSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Получить статус сессии."""
    session = db.query(ReviewSession).filter(
        ReviewSession.id == session_id,
        ReviewSession.user_id == current_user.id,
    ).first()

    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    accuracy = None
    if session.is_completed and session.cards_reviewed > 0:
        accuracy = round(session.cards_correct / session.cards_reviewed * 100, 1)

    return SessionStatus(
        id=session.id,
        user_id=session.user_id,
        started_at=session.started_at,
        completed_at=session.completed_at,
        is_completed=session.is_completed,
        cards_reviewed=session.cards_reviewed,
        cards_correct=session.cards_correct,
        accuracy=accuracy,
    )
