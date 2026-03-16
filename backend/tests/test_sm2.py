"""
TDD тесты для SM-2 алгоритма.
Написаны ДО реализации — должны падать сначала.
"""
import pytest
from datetime import date, timedelta
from app.core.sm2 import calculate_sm2, map_quality, get_next_review_date


class TestCalculateSM2:
    """Тесты основного SM-2 алгоритма."""

    # --- Неверные ответы (quality < 3) ---

    def test_wrong_answer_resets_repetitions(self):
        """quality=1 (again) сбрасывает repetitions в 0."""
        _, _, new_rep = calculate_sm2(quality=1, ef=2.5, interval=6, repetitions=3)
        assert new_rep == 0

    def test_wrong_answer_sets_interval_to_1(self):
        """quality=1 сбрасывает interval в 1 день."""
        _, new_interval, _ = calculate_sm2(quality=1, ef=2.5, interval=15, repetitions=3)
        assert new_interval == 1

    def test_wrong_answer_preserves_ef(self):
        """EF не меняется при неверном ответе."""
        new_ef, _, _ = calculate_sm2(quality=1, ef=2.5, interval=6, repetitions=3)
        assert new_ef == pytest.approx(2.5)

    # --- Верные ответы: первый раз ---

    def test_first_correct_sets_interval_to_1(self):
        """Первый верный ответ (rep=0) → interval=1."""
        _, new_interval, _ = calculate_sm2(quality=4, ef=2.5, interval=0, repetitions=0)
        assert new_interval == 1

    def test_first_correct_increments_repetitions(self):
        """Первый верный ответ → repetitions=1."""
        _, _, new_rep = calculate_sm2(quality=4, ef=2.5, interval=0, repetitions=0)
        assert new_rep == 1

    # --- Верные ответы: второй раз ---

    def test_second_correct_sets_interval_to_6(self):
        """Второй верный ответ (rep=1) → interval=6."""
        _, new_interval, _ = calculate_sm2(quality=4, ef=2.5, interval=1, repetitions=1)
        assert new_interval == 6

    # --- Верные ответы: третий+ раз ---

    def test_third_correct_multiplies_interval_by_ef(self):
        """rep=2, interval=6, EF=2.5 → interval=round(6*2.5)=15."""
        _, new_interval, _ = calculate_sm2(quality=4, ef=2.5, interval=6, repetitions=2)
        assert new_interval == 15

    # --- EF расчёт ---

    def test_perfect_answer_increases_ef(self):
        """quality=5 (easy) увеличивает EF."""
        new_ef, _, _ = calculate_sm2(quality=5, ef=2.5, interval=6, repetitions=2)
        assert new_ef > 2.5

    def test_good_answer_preserves_ef(self):
        """quality=4 (good) не меняет EF значительно (≈2.5)."""
        new_ef, _, _ = calculate_sm2(quality=4, ef=2.5, interval=6, repetitions=2)
        assert new_ef == pytest.approx(2.5, abs=0.01)

    def test_hard_answer_decreases_ef(self):
        """quality=3 (hard) уменьшает EF."""
        new_ef, _, _ = calculate_sm2(quality=3, ef=2.5, interval=6, repetitions=2)
        assert new_ef < 2.5

    def test_ef_never_below_1_3(self):
        """EF всегда >= 1.3 (минимум SM-2)."""
        # Много неверных ответов подряд
        ef = 1.3
        for _ in range(10):
            new_ef, _, _ = calculate_sm2(quality=3, ef=ef, interval=1, repetitions=2)
            ef = new_ef
        assert ef >= 1.3

    def test_ef_floor_at_1_3(self):
        """При EF близком к 1.3, quality=3 не опускает ниже 1.3."""
        new_ef, _, _ = calculate_sm2(quality=3, ef=1.3, interval=1, repetitions=2)
        assert new_ef >= 1.3


class TestMapQuality:
    """Тесты маппинга пользовательских оценок (1-4) в SM-2 quality (0-5)."""

    def test_again_maps_to_1(self):
        assert map_quality(1) == 1

    def test_hard_maps_to_3(self):
        assert map_quality(2) == 3

    def test_good_maps_to_4(self):
        assert map_quality(3) == 4

    def test_easy_maps_to_5(self):
        assert map_quality(4) == 5

    def test_invalid_quality_raises(self):
        with pytest.raises(ValueError):
            map_quality(0)
        with pytest.raises(ValueError):
            map_quality(5)


class TestGetNextReviewDate:
    """Тесты вычисления даты следующего повторения."""

    def test_interval_0_means_today(self):
        result = get_next_review_date(0)
        assert result == date.today()

    def test_interval_1_means_tomorrow(self):
        result = get_next_review_date(1)
        assert result == date.today() + timedelta(days=1)

    def test_interval_15_means_15_days(self):
        result = get_next_review_date(15)
        assert result == date.today() + timedelta(days=15)
