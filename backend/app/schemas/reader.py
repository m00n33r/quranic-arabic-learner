from pydantic import BaseModel
from typing import Optional


class SurahInfo(BaseModel):
    number: int
    name_arabic: str
    name_english: str
    name_transliteration: Optional[str] = None
    name_russian: Optional[str] = None          # перевод названия ("Весть")
    name_transliteration_ru: Optional[str] = None  # транслит ("Ан-Наба")
    revelation_type: Optional[str] = None
    total_ayahs: int

    model_config = {"from_attributes": True}


class WordInAyah(BaseModel):
    word_id: Optional[int] = None
    position: int
    arabic: str
    translation_ru: Optional[str] = None  # первое значение слова для подписи
    is_in_study: bool = False


class AyahWithWords(BaseModel):
    id: int
    surah_number: int
    ayah_number: int
    arabic_text: str
    russian_translation: Optional[str] = None
    words: list[WordInAyah]

    model_config = {"from_attributes": True}


class EnqueueRequest(BaseModel):
    word_ids: list[int]


class EnqueueResponse(BaseModel):
    added: int
    already_studying: int
