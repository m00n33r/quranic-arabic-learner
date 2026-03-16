from datetime import date, datetime, timezone
from sqlalchemy import Column, Integer, Float, Date, DateTime, ForeignKey, UniqueConstraint, Boolean
from sqlalchemy.orm import relationship
from app.models.base import Base


class UserCardProgress(Base):
    """
    Прогресс конкретного пользователя по конкретной карточке (слову).
    Хранит SM-2 параметры для алгоритма интервальных повторений.
    """
    __tablename__ = "user_card_progress"
    __table_args__ = (
        UniqueConstraint("user_id", "word_id", name="uq_user_word"),
    )

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    word_id = Column(Integer, ForeignKey("words.id", ondelete="CASCADE"), nullable=False, index=True)

    # SM-2 параметры
    easiness_factor = Column(Float, default=2.5, nullable=False)   # EF, min=1.3
    interval = Column(Integer, default=0, nullable=False)           # дней до следующего
    repetitions = Column(Integer, default=0, nullable=False)        # подряд правильных

    # Расписание
    next_review_date = Column(Date, default=date.today, nullable=False, index=True)
    last_reviewed_at = Column(DateTime(timezone=True))

    # created_at вручную (без TimestampMixin для гибкости)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    user = relationship("User", backref="card_progresses")
    word = relationship("Word", backref="user_progresses")
    reviews = relationship("CardReview", back_populates="progress", cascade="all, delete-orphan")


class ReviewSession(Base):
    """
    Сессия повторения — группа карточек, повторённых за одну сессию.
    """
    __tablename__ = "review_sessions"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    started_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    completed_at = Column(DateTime(timezone=True))
    is_completed = Column(Boolean, default=False, nullable=False)

    # Итоги сессии (заполняются при завершении)
    cards_reviewed = Column(Integer, default=0, nullable=False)
    cards_correct = Column(Integer, default=0, nullable=False)   # quality >= 2 (hard и выше)

    user = relationship("User", backref="review_sessions")
    reviews = relationship("CardReview", back_populates="session", cascade="all, delete-orphan")


class CardReview(Base):
    """
    Лог отдельного отзыва карточки во время сессии.
    Позволяет восстановить историю обучения.
    """
    __tablename__ = "card_reviews"

    id = Column(Integer, primary_key=True)
    session_id = Column(Integer, ForeignKey("review_sessions.id", ondelete="CASCADE"), nullable=True, index=True)
    progress_id = Column(Integer, ForeignKey("user_card_progress.id", ondelete="CASCADE"), nullable=False, index=True)

    # quality 1-4 (пользовательская шкала)
    quality = Column(Integer, nullable=False)
    reviewed_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    session = relationship("ReviewSession", back_populates="reviews")
    progress = relationship("UserCardProgress", back_populates="reviews")
