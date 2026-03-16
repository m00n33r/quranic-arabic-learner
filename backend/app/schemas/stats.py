from pydantic import BaseModel


class StatsSummary(BaseModel):
    """Сводная статистика пользователя для дашборда."""
    words_learned: int        # слов с repetitions >= 1
    words_total: int          # всего слов в БД
    cards_due_today: int      # карточек для повторения сегодня
    cards_today: int          # карточек повторено сегодня
    sessions_total: int       # завершённых сессий всего
    current_streak: int       # серия дней (будет заполняться в 06-02)
    accuracy_overall: float   # средняя точность по всем сессиям (0-100)
