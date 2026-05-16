"""
Адаптивная приоритизация новых карточек (Вариант 1 + Вариант 2).

Вариант 1 — ML-скоринг новых слов:
    Логистическая регрессия (scikit-learn) предсказывает вероятность
    успешного первого ответа (quality >= 3) на основе истории пользователя.
    Признаки: длина слова, частота в джузе, наличие уже изученных однокоренных слов.
    Если истории менее MIN_SAMPLES — используется детерминированный fallback.

Вариант 2 — кластеризация по корню:
    Новые слова с одним корнем группируются и показываются подряд.
    На обороте карточки отображаются уже изученные однокоренные слова.
"""
import math
import logging
from dataclasses import dataclass, field

from sqlalchemy.orm import Session

from app.models.word import Word
from app.models.flashcard import UserCardProgress, CardReview

logger = logging.getLogger(__name__)

# Минимум исторических отзывов для обучения ML-модели
MIN_SAMPLES = 10

# Вес бонуса за знакомый корень в fallback-режиме
ROOT_KNOWN_BONUS = 0.35


@dataclass
class WordFeatures:
    word_id: int
    word_length: float       # len(arabic_clean)
    log_frequency: float     # log(frequency + 1)
    root_known: float        # 1.0 если корень уже изучен пользователем
    avg_root_quality: float  # средняя оценка за однокоренные слова (0 если нет)


def _build_features(word: Word, known_roots: dict[str, float]) -> WordFeatures:
    """Вычислить признаки для одного слова."""
    root = word.root_approx or ''
    root_known = 1.0 if root in known_roots else 0.0
    avg_root_quality = known_roots.get(root, 0.0)
    return WordFeatures(
        word_id=word.id,
        word_length=float(len(word.arabic_clean or '')),
        log_frequency=math.log(word.frequency + 1),
        root_known=root_known,
        avg_root_quality=avg_root_quality,
    )


def _get_known_roots(db: Session, user_id: int) -> dict[str, float]:
    """
    Вернуть {root_approx: avg_quality} для слов, которые пользователь уже изучал
    (repetitions >= 1). Корень без записи → не включаем.
    """
    progresses = (
        db.query(UserCardProgress)
        .filter(
            UserCardProgress.user_id == user_id,
            UserCardProgress.repetitions >= 1,
        )
        .all()
    )

    root_qualities: dict[str, list[float]] = {}
    for prog in progresses:
        word = db.query(Word).filter(Word.id == prog.word_id).first()
        if word and word.root_approx:
            reviews = (
                db.query(CardReview)
                .filter(CardReview.progress_id == prog.id)
                .all()
            )
            if reviews:
                avg_q = sum(r.quality for r in reviews) / len(reviews)
                root_qualities.setdefault(word.root_approx, []).append(avg_q)

    return {
        root: sum(qs) / len(qs)
        for root, qs in root_qualities.items()
    }


def _get_training_data(db: Session, user_id: int):
    """
    Собрать обучающую выборку из истории пользователя.
    X: [word_length, log_frequency, root_known, avg_root_quality]
    y: 1 если первый отзыв quality >= 3, иначе 0
    """
    # Берём первый отзыв каждой карточки (минимальный reviewed_at)
    from sqlalchemy import func

    first_reviews = (
        db.query(
            CardReview.progress_id,
            func.min(CardReview.reviewed_at).label('first_at'),
        )
        .group_by(CardReview.progress_id)
        .subquery()
    )

    rows = (
        db.query(CardReview, UserCardProgress, Word)
        .join(UserCardProgress, CardReview.progress_id == UserCardProgress.id)
        .join(Word, UserCardProgress.word_id == Word.id)
        .join(
            first_reviews,
            (first_reviews.c.progress_id == CardReview.progress_id) &
            (first_reviews.c.first_at == CardReview.reviewed_at),
        )
        .filter(UserCardProgress.user_id == user_id)
        .all()
    )

    if not rows:
        return [], []

    # Для known_roots — берём слова с repetitions >= 2 (зрелые)
    known_roots = _get_known_roots(db, user_id)

    X, y = [], []
    for review, progress, word in rows:
        feats = _build_features(word, known_roots)
        X.append([
            feats.word_length,
            feats.log_frequency,
            feats.root_known,
            feats.avg_root_quality,
        ])
        y.append(1 if review.quality >= 3 else 0)

    return X, y


def _fallback_score(word: Word, known_roots: dict[str, float]) -> float:
    """
    Детерминированный скор без ML:
    freq_score + root_bonus - length_penalty
    """
    freq_score = min(math.log(word.frequency + 1) / math.log(51), 1.0)
    root = word.root_approx or ''
    root_bonus = ROOT_KNOWN_BONUS if root in known_roots else 0.0
    length_penalty = max(0.0, (len(word.arabic_clean or '') - 3) * 0.04)
    return freq_score + root_bonus - length_penalty


def score_new_words(
    db: Session,
    user_id: int,
    words: list[Word],
) -> list[tuple[Word, float]]:
    """
    Вернуть слова с приоритетным скором (выше = показать раньше).
    Использует ML если достаточно данных, иначе — fallback.

    Returns:
        [(word, score), ...] несортированный — сортирует вызывающий код.
    """
    known_roots = _get_known_roots(db, user_id)

    # Попытка обучить LogisticRegression на истории пользователя
    ml_model = None
    try:
        X, y = _get_training_data(db, user_id)
        if len(X) >= MIN_SAMPLES and len(set(y)) > 1:
            from sklearn.linear_model import LogisticRegression
            from sklearn.preprocessing import StandardScaler
            import numpy as np

            scaler = StandardScaler()
            X_scaled = scaler.fit_transform(np.array(X))
            clf = LogisticRegression(max_iter=200, random_state=42)
            clf.fit(X_scaled, y)
            ml_model = (clf, scaler)
            logger.debug(
                "SmartPriority: ML model trained on %d samples for user %d",
                len(X), user_id,
            )
    except Exception as exc:
        logger.warning("SmartPriority: ML training failed (%s), using fallback", exc)

    scored = []
    for word in words:
        feats = _build_features(word, known_roots)
        if ml_model is not None:
            try:
                import numpy as np
                clf, scaler = ml_model
                x = np.array([[
                    feats.word_length,
                    feats.log_frequency,
                    feats.root_known,
                    feats.avg_root_quality,
                ]])
                # predict_proba → вероятность класса 1 (успешный ответ)
                score = float(clf.predict_proba(scaler.transform(x))[0][1])
            except Exception:
                score = _fallback_score(word, known_roots)
        else:
            score = _fallback_score(word, known_roots)
        scored.append((word, score))

    return scored


def cluster_by_root(words: list[Word]) -> list[Word]:
    """
    Переупорядочить список слов так, чтобы однокоренные шли подряд.

    Алгоритм:
    1. Разбить на группы по root_approx.
    2. Внутри группы сортировать по частоте (сначала самое частое).
    3. Группы выстраивать: сначала одиночки (нет пары), затем кластеры >= 2
       (чтобы не начинать сессию сразу с похожих слов).
    """
    from collections import defaultdict

    groups: dict[str, list[Word]] = defaultdict(list)
    for w in words:
        key = w.root_approx or f'__solo_{w.id}'
        groups[key].append(w)

    # Сортировать внутри группы: по убыванию частоты
    for key in groups:
        groups[key].sort(key=lambda w: w.frequency, reverse=True)

    singles = [g[0] for g in groups.values() if len(g) == 1]
    clusters = [g for g in groups.values() if len(g) >= 2]

    # Одиночки сначала (меньше риска перегрузки похожими словами)
    result: list[Word] = []
    for w in singles:
        result.append(w)
    for cluster in clusters:
        result.extend(cluster)

    return result


def get_known_root_words(
    db: Session,
    user_id: int,
    root: str | None,
    exclude_word_id: int,
) -> list[dict]:
    """
    Вернуть список уже изученных слов с тем же корнем (для блока "Семья слов").

    Returns:
        [{"arabic": ..., "translation_ru": ..., "repetitions": ...}, ...]
    """
    if not root:
        return []

    progresses = (
        db.query(UserCardProgress)
        .filter(
            UserCardProgress.user_id == user_id,
            UserCardProgress.repetitions >= 1,
        )
        .all()
    )

    result = []
    for prog in progresses:
        if prog.word_id == exclude_word_id:
            continue
        word = db.query(Word).filter(Word.id == prog.word_id).first()
        if word and word.root_approx == root:
            result.append({
                "arabic": word.arabic,
                "translation_ru": word.translation_ru or '',
                "repetitions": prog.repetitions,
            })

    return result
