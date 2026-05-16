from sqlalchemy import Column, Integer, String, Text, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.models.base import Base, TimestampMixin


class Word(Base, TimestampMixin):
    __tablename__ = "words"

    id = Column(Integer, primary_key=True)
    # arabic — с огласовками (харакат), для отображения на карточке
    arabic = Column(Text, nullable=False)
    # arabic_clean — без огласовок, для дедупликации
    arabic_clean = Column(String(200), unique=True, nullable=False, index=True)
    translation_ru = Column(Text)
    translation_en = Column(Text)
    # Сколько раз слово встречается в 30-м джузе (для приоритизации)
    frequency = Column(Integer, default=1, nullable=False)
    # Приближённый трёхбуквенный корень (консонантный скелет без слабых букв)
    # Используется для кластеризации однокоренных слов
    root_approx = Column(String(6), nullable=True, index=True)

    occurrences = relationship("WordOccurrence", back_populates="word")


class WordOccurrence(Base):
    """Связь слова с аятом — для показа примера употребления."""
    __tablename__ = "word_occurrences"
    __table_args__ = (
        UniqueConstraint("word_id", "ayah_id", "position", name="uq_word_occurrence"),
    )

    id = Column(Integer, primary_key=True)
    word_id = Column(Integer, ForeignKey("words.id"), nullable=False, index=True)
    ayah_id = Column(Integer, ForeignKey("ayahs.id"), nullable=False, index=True)
    position = Column(Integer, nullable=False)  # позиция слова в аяте (0-based)

    word = relationship("Word", back_populates="occurrences")
    ayah = relationship("Ayah", back_populates="word_occurrences")
