from datetime import date
from typing import Optional
from pydantic import BaseModel, Field


class AyahExample(BaseModel):
    """Пример аята для слова на обороте карточки."""
    arabic_text: str
    russian_translation: Optional[str]
    surah_number: int
    ayah_number: int
    word_position: int             # позиция слова в arabic_text.split() (0-based)


class KnownRootWord(BaseModel):
    """Однокоренное слово, уже изученное пользователем."""
    arabic: str
    translation_ru: str
    repetitions: int


class CardDue(BaseModel):
    """Карточка для повторения сегодня."""
    word_id: int
    arabic: str                    # с огласовками
    arabic_clean: str              # без огласовок
    translations: list[str]        # несколько значений слова
    frequency: int                 # частота в 30-м джузе

    # SM-2 состояние (для отображения прогресса в UI)
    easiness_factor: float
    interval: int
    repetitions: int
    next_review_date: date
    is_new: bool = False           # True если карточка ещё не изучалась

    # Примеры употребления из аятов (до 2 штук)
    examples: list[AyahExample] = []

    # Корневая кластеризация (Вариант 2)
    root_approx: Optional[str] = None          # приближённый корень
    known_root_words: list[KnownRootWord] = [] # уже изученные слова того же корня

    model_config = {"from_attributes": True}


class ReviewRequest(BaseModel):
    """Запрос на оценку карточки."""
    quality: int = Field(..., ge=1, le=4, description="1=Again, 2=Hard, 3=Good, 4=Easy")
    session_id: Optional[int] = None


class CardReviewResponse(BaseModel):
    """Ответ после оценки карточки."""
    word_id: int
    quality: int
    new_ef: float
    new_interval: int
    new_repetitions: int
    next_review_date: date
    is_correct: bool               # True если quality >= 2

    model_config = {"from_attributes": True}
