"""
Логика расчёта серии дней (streak).
"""
from datetime import date, timedelta
from typing import Sequence


def calculate_streak(session_dates: Sequence[date], today: date | None = None) -> int:
    """
    Рассчитать текущую серию дней.

    Args:
        session_dates: Даты сессий (могут быть дубли).
        today: Текущая дата (для тестирования). По умолчанию — date.today().

    Returns:
        Количество последовательных дней с активностью.
    """
    if today is None:
        today = date.today()

    if not session_dates:
        return 0

    # Уникальные даты, отсортированные по убыванию
    unique_dates = sorted(set(session_dates), reverse=True)
    latest = unique_dates[0]

    # Последняя сессия должна быть сегодня или вчера
    if latest < today - timedelta(days=1):
        return 0

    # Начинаем отсчёт с сегодня (или вчера если сегодня не занимался)
    start = today if latest == today else today - timedelta(days=1)

    streak = 0
    current = start
    date_set = set(unique_dates)

    while current in date_set:
        streak += 1
        current -= timedelta(days=1)

    return streak
