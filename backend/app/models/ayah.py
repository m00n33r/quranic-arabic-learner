from sqlalchemy import Column, Integer, String, Text, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.models.base import Base, TimestampMixin


class Ayah(Base, TimestampMixin):
    __tablename__ = "ayahs"
    __table_args__ = (
        UniqueConstraint("surah_number", "ayah_number", name="uq_ayah"),
    )

    id = Column(Integer, primary_key=True)
    surah_number = Column(Integer, ForeignKey("surahs.number"), nullable=False, index=True)
    ayah_number = Column(Integer, nullable=False)        # номер в суре
    global_number = Column(Integer, unique=True, nullable=False)  # глобальный номер (1-6236)
    juz_number = Column(Integer, nullable=False, default=30)
    arabic_text = Column(Text, nullable=False)
    russian_translation = Column(Text)
    english_translation = Column(Text)

    surah = relationship("Surah", backref="ayahs")
    word_occurrences = relationship("WordOccurrence", back_populates="ayah")
