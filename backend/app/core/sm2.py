"""
SM-2 (SuperMemo 2) алгоритм интервальных повторений.

Оригинальная спецификация: https://www.supermemo.com/en/blog/application-of-a-computer-to-improve-the-results-obtained-in-working-with-the-supermemo-method

Маппинг пользовательских оценок (1-4) в SM-2 quality (0-5):
  1 (again) → 1  (blackout/wrong)
  2 (hard)  → 3  (correct with serious difficulty)
  3 (good)  → 4  (correct after hesitation)
  4 (easy)  → 5  (perfect response)
"""
from dataclasses import dataclass
from datetime import date, timedelta
from typing import Tuple

# Минимальный easiness factor по спецификации SM-2
MIN_EF = 1.3

# Маппинг пользовательских оценок в SM-2 quality
QUALITY_MAP = {1: 1, 2: 3, 3: 4, 4: 5}


def calculate_sm2(
    quality: int,
    ef: float,
    interval: int,
    repetitions: int,
) -> Tuple[float, int, int]:
    """
    Вычислить новые SM-2 параметры после ответа пользователя.

    Args:
        quality: SM-2 quality 0-5 (НЕ пользовательская 1-4, используй map_quality)
        ef: текущий easiness factor
        interval: текущий интервал в днях
        repetitions: текущее число подряд правильных ответов

    Returns:
        (new_ef, new_interval, new_repetitions)
    """
    if quality < 3:
        # Неверный ответ: сбросить прогресс
        new_repetitions = 0
        new_interval = 1
        new_ef = ef  # EF не меняется при неверном ответе
    else:
        # Верный ответ: обновить interval
        if repetitions == 0:
            new_interval = 1
        elif repetitions == 1:
            new_interval = 6
        else:
            new_interval = round(interval * ef)

        # Обновить EF по формуле SM-2
        new_ef = ef + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
        new_ef = max(MIN_EF, new_ef)
        new_repetitions = repetitions + 1

    return (new_ef, new_interval, new_repetitions)


def map_quality(user_quality: int) -> int:
    """
    Перевести пользовательскую оценку (1-4) в SM-2 quality (0-5).

    Args:
        user_quality: 1=Again, 2=Hard, 3=Good, 4=Easy

    Raises:
        ValueError: если user_quality не в диапазоне 1-4
    """
    if user_quality not in QUALITY_MAP:
        raise ValueError(f"user_quality must be 1-4, got {user_quality}")
    return QUALITY_MAP[user_quality]


def get_next_review_date(interval: int) -> date:
    """
    Вычислить дату следующего повторения.

    Args:
        interval: дней до следующего повторения (0 = сегодня)

    Returns:
        date объект (сегодня + interval дней)
    """
    return date.today() + timedelta(days=interval)


@dataclass
class SM2Result:
    """Результат применения SM-2 для обновления UserCardProgress."""
    new_ef: float
    new_interval: int
    new_repetitions: int
    next_review_date: date


def apply_sm2(user_quality: int, ef: float, interval: int, repetitions: int) -> SM2Result:
    """
    Высокоуровневая функция: принимает пользовательскую оценку (1-4),
    возвращает SM2Result с готовыми значениями для сохранения в БД.

    Использование в API:
        result = apply_sm2(user_quality=3, ef=progress.easiness_factor,
                          interval=progress.interval, repetitions=progress.repetitions)
        progress.easiness_factor = result.new_ef
        progress.interval = result.new_interval
        progress.repetitions = result.new_repetitions
        progress.next_review_date = result.next_review_date
    """
    sm2_quality = map_quality(user_quality)
    new_ef, new_interval, new_repetitions = calculate_sm2(sm2_quality, ef, interval, repetitions)
    return SM2Result(
        new_ef=new_ef,
        new_interval=new_interval,
        new_repetitions=new_repetitions,
        next_review_date=get_next_review_date(new_interval),
    )
