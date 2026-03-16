from datetime import date, datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_

from app.api.deps import get_current_user
from app.core.database import get_db
from app.core.sm2 import apply_sm2
from app.models.user import User
from app.models.word import Word
from app.models.flashcard import UserCardProgress, CardReview, ReviewSession
from app.schemas.flashcard import CardDue, ReviewRequest, CardReviewResponse

router = APIRouter(prefix="/cards", tags=["cards"])

# Начальные SM-2 параметры для новых карточек
DEFAULT_EF = 2.5
DEFAULT_INTERVAL = 0
DEFAULT_REPETITIONS = 0


@router.get("/due", response_model=list[CardDue])
def get_due_cards(
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Получить карточки для повторения сегодня.

    Логика:
    1. Карточки с existing progress где next_review_date <= today
    2. Дополнить новыми словами (без прогресса) до limit
    Сортировка: новые слова по frequency DESC (сначала самые частые)
    """
    today = date.today()

    # Карточки с прогрессом, где пора повторять
    due_progresses = (
        db.query(UserCardProgress)
        .filter(
            UserCardProgress.user_id == current_user.id,
            UserCardProgress.next_review_date <= today,
        )
        .order_by(UserCardProgress.next_review_date)
        .limit(limit)
        .all()
    )

    result = []

    # Добавить карточки с прогрессом
    for progress in due_progresses:
        word = db.query(Word).filter(Word.id == progress.word_id).first()
        if word:
            result.append(CardDue(
                word_id=word.id,
                arabic=word.arabic,
                arabic_clean=word.arabic_clean,
                translation_ru=word.translation_ru,
                frequency=word.frequency,
                easiness_factor=progress.easiness_factor,
                interval=progress.interval,
                repetitions=progress.repetitions,
                next_review_date=progress.next_review_date,
                is_new=False,
            ))

    # Если нужно больше — добавить новые слова (без прогресса)
    remaining = limit - len(result)
    if remaining > 0:
        # Слова у которых НЕТ прогресса для этого пользователя
        studied_word_ids = (
            db.query(UserCardProgress.word_id)
            .filter(UserCardProgress.user_id == current_user.id)
            .subquery()
        )
        new_words = (
            db.query(Word)
            .filter(Word.id.not_in(studied_word_ids))
            .order_by(Word.frequency.desc())  # Начинаем с самых частых слов
            .limit(remaining)
            .all()
        )
        for word in new_words:
            result.append(CardDue(
                word_id=word.id,
                arabic=word.arabic,
                arabic_clean=word.arabic_clean,
                translation_ru=word.translation_ru,
                frequency=word.frequency,
                easiness_factor=DEFAULT_EF,
                interval=DEFAULT_INTERVAL,
                repetitions=DEFAULT_REPETITIONS,
                next_review_date=today,
                is_new=True,
            ))

    return result


@router.post("/{word_id}/review", response_model=CardReviewResponse)
def review_card(
    word_id: int,
    review: ReviewRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Отправить оценку для карточки. Применяет SM-2 и обновляет прогресс.

    quality: 1=Again, 2=Hard, 3=Good, 4=Easy
    """
    # Проверить что слово существует
    word = db.query(Word).filter(Word.id == word_id).first()
    if not word:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Word not found")

    # Найти или создать прогресс
    progress = (
        db.query(UserCardProgress)
        .filter(
            UserCardProgress.user_id == current_user.id,
            UserCardProgress.word_id == word_id,
        )
        .first()
    )

    if not progress:
        # Первое взаимодействие с карточкой
        progress = UserCardProgress(
            user_id=current_user.id,
            word_id=word_id,
            easiness_factor=DEFAULT_EF,
            interval=DEFAULT_INTERVAL,
            repetitions=DEFAULT_REPETITIONS,
            next_review_date=date.today(),
        )
        db.add(progress)
        db.flush()

    # Применить SM-2 алгоритм
    sm2_result = apply_sm2(
        user_quality=review.quality,
        ef=progress.easiness_factor,
        interval=progress.interval,
        repetitions=progress.repetitions,
    )

    # Обновить прогресс
    progress.easiness_factor = sm2_result.new_ef
    progress.interval = sm2_result.new_interval
    progress.repetitions = sm2_result.new_repetitions
    progress.next_review_date = sm2_result.next_review_date
    progress.last_reviewed_at = datetime.now(timezone.utc)

    # Создать запись в истории
    card_review = CardReview(
        session_id=review.session_id,
        progress_id=progress.id,
        quality=review.quality,
    )
    db.add(card_review)
    db.commit()

    return CardReviewResponse(
        word_id=word_id,
        quality=review.quality,
        new_ef=sm2_result.new_ef,
        new_interval=sm2_result.new_interval,
        new_repetitions=sm2_result.new_repetitions,
        next_review_date=sm2_result.next_review_date,
        is_correct=review.quality >= 2,  # Hard и выше = правильно
    )
