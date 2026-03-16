# Phase 4 Plan 01: Flashcard DB Schema Summary

**Created 3 SQLAlchemy models for SM-2 spaced repetition and applied Alembic migration to PostgreSQL.**

## Accomplishments

- Created `backend/app/models/flashcard.py` with three models:
  - `UserCardProgress` — tracks SM-2 state (easiness_factor, interval, repetitions, next_review_date, last_reviewed_at) per user/word pair with UniqueConstraint
  - `ReviewSession` — groups a study session with start/completion timestamps and summary counters
  - `CardReview` — individual review log entries (quality 1-4 scale, timestamp, FK to session and progress)
- Updated `backend/app/models/__init__.py` to export all three flashcard models
- Generated and applied Alembic migration `8bf7dca26d2a_create_flashcard_tables` creating tables: `user_card_progress`, `review_sessions`, `card_reviews`
- Verified migration reversibility (downgrade -1 + upgrade head both succeed)

## Files Created/Modified

- `backend/app/models/flashcard.py` — new, 3 models
- `backend/app/models/__init__.py` — updated imports/`__all__`
- `backend/alembic/versions/8bf7dca26d2a_create_flashcard_tables.py` — new migration

## Decisions Made

- `CardReview.session_id` is `nullable=True` (plan description says "nullable") rather than `nullable=False` as in the plan code snippet — allows standalone card reviews outside a session if needed
- Used `default=lambda: datetime.now(timezone.utc)` for all datetime defaults to ensure Python-side timezone-aware timestamps
- `created_at` on `UserCardProgress` uses manual column (not `TimestampMixin`) for flexibility — no `updated_at` column needed on this model

## Issues Encountered

- None. All tasks completed cleanly.

## Next Step

Ready for 04-02-PLAN.md (SM-2 algorithm TDD implementation)
