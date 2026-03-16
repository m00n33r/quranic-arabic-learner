from datetime import date
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.models.word import Word
from app.models.flashcard import UserCardProgress, CardReview, ReviewSession
from app.schemas.stats import StatsSummary
from app.core.streak import calculate_streak

router = APIRouter(prefix="/stats", tags=["stats"])


@router.get("/summary", response_model=StatsSummary)
def get_stats_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Получить сводную статистику пользователя."""
    today = date.today()

    # Слов выучено (хотя бы один правильный ответ)
    words_learned = db.query(func.count(UserCardProgress.id)).filter(
        UserCardProgress.user_id == current_user.id,
        UserCardProgress.repetitions >= 1,
    ).scalar() or 0

    # Всего слов в БД
    words_total = db.query(func.count(Word.id)).scalar() or 0

    # Карточек для повторения сегодня
    cards_due_today = db.query(func.count(UserCardProgress.id)).filter(
        UserCardProgress.user_id == current_user.id,
        UserCardProgress.next_review_date <= today,
    ).scalar() or 0

    # Карточек повторено сегодня (через CardReview)
    cards_today = (
        db.query(func.count(CardReview.id))
        .join(UserCardProgress, CardReview.progress_id == UserCardProgress.id)
        .filter(
            UserCardProgress.user_id == current_user.id,
            func.date(CardReview.reviewed_at) == today,
        )
        .scalar() or 0
    )

    # Завершённые сессии
    completed_sessions = db.query(ReviewSession).filter(
        ReviewSession.user_id == current_user.id,
        ReviewSession.is_completed == True,
    ).all()

    sessions_total = len(completed_sessions)

    # Серия дней — дни когда были завершённые сессии
    session_dates = [
        s.completed_at.date()
        for s in completed_sessions
        if s.completed_at is not None
    ]
    current_streak = calculate_streak(session_dates)

    # Средняя точность по сессиям
    accuracy_overall = 0.0
    if sessions_total > 0:
        total_reviewed = sum(s.cards_reviewed for s in completed_sessions if s.cards_reviewed > 0)
        total_correct = sum(s.cards_correct for s in completed_sessions)
        if total_reviewed > 0:
            accuracy_overall = round(total_correct / total_reviewed * 100, 1)

    return StatsSummary(
        words_learned=words_learned,
        words_total=words_total,
        cards_due_today=cards_due_today,
        cards_today=cards_today,
        sessions_total=sessions_total,
        current_streak=current_streak,
        accuracy_overall=accuracy_overall,
    )
