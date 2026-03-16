from sqlalchemy import Column, Integer, String
from app.models.base import Base, TimestampMixin


class Surah(Base, TimestampMixin):
    __tablename__ = "surahs"

    id = Column(Integer, primary_key=True)
    number = Column(Integer, unique=True, nullable=False, index=True)
    name_arabic = Column(String(100), nullable=False)
    name_english = Column(String(100), nullable=False)
    name_transliteration = Column(String(100))
    revelation_type = Column(String(20))  # "Meccan" or "Medinan"
    total_ayahs = Column(Integer, nullable=False)
