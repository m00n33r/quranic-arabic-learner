"""
TDD тесты для алгоритма streak (серия дней).
"""
import pytest
from datetime import date, timedelta
from app.core.streak import calculate_streak


class TestCalculateStreak:
    def test_no_sessions_returns_zero(self):
        """Нет сессий → streak = 0."""
        assert calculate_streak(session_dates=[], today=date(2026, 3, 16)) == 0

    def test_only_today_returns_one(self):
        """Только сегодня → streak = 1."""
        today = date(2026, 3, 16)
        assert calculate_streak([today], today=today) == 1

    def test_today_and_yesterday_returns_two(self):
        """Сегодня + вчера → streak = 2."""
        today = date(2026, 3, 16)
        yesterday = today - timedelta(days=1)
        assert calculate_streak([today, yesterday], today=today) == 2

    def test_consecutive_five_days(self):
        """5 последовательных дней включая сегодня → streak = 5."""
        today = date(2026, 3, 16)
        dates = [today - timedelta(days=i) for i in range(5)]
        assert calculate_streak(dates, today=today) == 5

    def test_gap_breaks_streak(self):
        """Пропуск дня прерывает серию."""
        today = date(2026, 3, 16)
        dates = [today, today - timedelta(days=2)]  # пропущено вчера
        assert calculate_streak(dates, today=today) == 1

    def test_only_yesterday_returns_one(self):
        """Только вчера (сегодня не занимался) → streak = 1."""
        today = date(2026, 3, 16)
        yesterday = today - timedelta(days=1)
        assert calculate_streak([yesterday], today=today) == 1

    def test_two_days_ago_only_returns_zero(self):
        """Последняя сессия позавчера → streak = 0."""
        today = date(2026, 3, 16)
        two_days_ago = today - timedelta(days=2)
        assert calculate_streak([two_days_ago], today=today) == 0

    def test_duplicate_dates_counted_once(self):
        """Несколько сессий в один день → считается как 1 день."""
        today = date(2026, 3, 16)
        yesterday = today - timedelta(days=1)
        # Три сессии сегодня + две вчера
        dates = [today, today, today, yesterday, yesterday]
        assert calculate_streak(dates, today=today) == 2

    def test_long_streak_with_gap_in_middle(self):
        """Длинная серия + пропуск: считается только хвост от сегодня."""
        today = date(2026, 3, 16)
        # 3 дня назад, пропуск, 2 дня подряд до сегодня
        dates = [today, today - timedelta(days=1), today - timedelta(days=3)]
        assert calculate_streak(dates, today=today) == 2
