from datetime import date, datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_

from app.api.deps import get_current_user
from app.core.database import get_db
from app.core.sm2 import apply_sm2
from app.core.smart_priority import score_new_words, cluster_by_root, get_known_root_words
from app.models.user import User
from app.models.word import Word, WordOccurrence
from app.models.ayah import Ayah
from app.models.flashcard import UserCardProgress, CardReview, ReviewSession
from app.schemas.flashcard import CardDue, ReviewRequest, CardReviewResponse, AyahExample, KnownRootWord

router = APIRouter(prefix="/cards", tags=["cards"])


def get_word_data(db: Session, word: Word) -> tuple[list[str], list[AyahExample]]:
    """
    Вернуть (translations, examples) для слова.
    translations: список значений из Word.translation_ru (разделены "; ")
    examples: до 2 аятов с позицией слова
    """
    # Значения слова
    if word.translation_ru:
        translations = [t.strip() for t in word.translation_ru.split(";") if t.strip()]
    else:
        translations = []

    # Примеры аятов (до 2)
    occs = (
        db.query(WordOccurrence)
        .filter(WordOccurrence.word_id == word.id)
        .limit(2)
        .all()
    )
    examples = []
    for occ in occs:
        ayah = db.query(Ayah).filter(Ayah.id == occ.ayah_id).first()
        if ayah:
            examples.append(AyahExample(
                arabic_text=ayah.arabic_text,
                russian_translation=ayah.russian_translation,
                surah_number=ayah.surah_number,
                ayah_number=ayah.ayah_number,
                word_position=occ.position,
            ))

    return translations, examples


def build_card_due(
    db: Session,
    user_id: int,
    word: Word,
    *,
    easiness_factor: float,
    interval: int,
    repetitions: int,
    next_review_date,
    is_new: bool,
) -> CardDue:
    """Собрать CardDue с переводами, примерами и данными кластера."""
    translations, examples = get_word_data(db, word)
    known_root_data = get_known_root_words(db, user_id, word.root_approx, word.id)
    known_root_words = [KnownRootWord(**d) for d in known_root_data]

    return CardDue(
        word_id=word.id,
        arabic=word.arabic,
        arabic_clean=word.arabic_clean,
        translations=translations,
        frequency=word.frequency,
        easiness_factor=easiness_factor,
        interval=interval,
        repetitions=repetitions,
        next_review_date=next_review_date,
        is_new=is_new,
        examples=examples,
        root_approx=word.root_approx,
        known_root_words=known_root_words,
    )


# Начальные SM-2 параметры для новых карточек
DEFAULT_EF = 2.5
DEFAULT_INTERVAL = 0
DEFAULT_REPETITIONS = 0


@router.get("/due", response_model=list[CardDue])
def get_due_cards(
    limit: int = Query(default=20, ge=1, le=100),
    surah_number: Optional[int] = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Получить карточки для повторения сегодня.
    Если surah_number задан — только слова из этой суры.

    Логика:
    1. Карточки с existing progress где next_review_date <= today
    2. Дополнить новыми словами (без прогресса) до limit
    Сортировка: новые слова по frequency DESC (сначала самые частые)
    """
    today = date.today()

    # Если фильтр по суре — собрать word_ids из этой суры
    surah_word_ids: Optional[set[int]] = None
    if surah_number is not None:
        rows = (
            db.query(WordOccurrence.word_id)
            .join(Ayah, WordOccurrence.ayah_id == Ayah.id)
            .filter(Ayah.surah_number == surah_number)
            .distinct()
            .all()
        )
        surah_word_ids = {r[0] for r in rows}

    # Карточки с прогрессом, где пора повторять
    due_query = db.query(UserCardProgress).filter(
        UserCardProgress.user_id == current_user.id,
        UserCardProgress.next_review_date <= today,
    )
    if surah_word_ids is not None:
        due_query = due_query.filter(UserCardProgress.word_id.in_(surah_word_ids))

    due_progresses = (
        due_query.order_by(UserCardProgress.next_review_date)
        .limit(limit)
        .all()
    )

    result = []

    # Добавить карточки с прогрессом (просроченные) — порядок не меняем
    for progress in due_progresses:
        word = db.query(Word).filter(Word.id == progress.word_id).first()
        if word:
            result.append(build_card_due(
                db, current_user.id, word,
                easiness_factor=progress.easiness_factor,
                interval=progress.interval,
                repetitions=progress.repetitions,
                next_review_date=progress.next_review_date,
                is_new=False,
            ))

    # Если нужно больше — добавить новые слова (без прогресса)
    remaining = limit - len(result)
    if remaining > 0:
        studied_word_ids = (
            db.query(UserCardProgress.word_id)
            .filter(UserCardProgress.user_id == current_user.id)
            .subquery()
        )
        new_words_query = db.query(Word).filter(Word.id.not_in(studied_word_ids))
        if surah_word_ids is not None:
            new_words_query = new_words_query.filter(Word.id.in_(surah_word_ids))

        # Берём кандидатов с запасом для scoring (×3), чтобы после сортировки
        # выбрать лучшие remaining слов
        candidates = new_words_query.limit(remaining * 3).all()

        # Вариант 1: ML / fallback скоринг
        scored = score_new_words(db, current_user.id, candidates)
        scored.sort(key=lambda x: x[1], reverse=True)
        top_words = [w for w, _ in scored[:remaining]]

        # Вариант 2: кластеризация по корню
        clustered_words = cluster_by_root(top_words)

        for word in clustered_words:
            result.append(build_card_due(
                db, current_user.id, word,
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
