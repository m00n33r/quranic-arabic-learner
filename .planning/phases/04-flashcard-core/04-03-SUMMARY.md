# Phase 4 Plan 03: Cards API Summary

**Implemented GET /cards/due and POST /cards/{word_id}/review endpoints with SM-2 integration and JWT auth.**

## Accomplishments

- Created `backend/app/schemas/flashcard.py` with three Pydantic schemas:
  - `CardDue` — word data + SM-2 state fields + `is_new` flag
  - `ReviewRequest` — quality field with `ge=1, le=4` validation
  - `CardReviewResponse` — SM-2 result fields + `is_correct` flag
- Updated `backend/app/schemas/__init__.py` to export all three schemas
- Created `backend/app/api/v1/cards.py` router:
  - `GET /cards/due?limit=20` — returns cards due today (progress-based) + new cards (is_new=True) up to limit, sorted by frequency DESC for new words
  - `POST /cards/{word_id}/review` — applies SM-2, creates/updates UserCardProgress, logs CardReview, returns CardReviewResponse
- Registered cards router in `backend/app/main.py` under `/api/v1`

## Files Created/Modified

- `backend/app/schemas/flashcard.py` — new file
- `backend/app/schemas/__init__.py` — updated imports
- `backend/app/api/v1/cards.py` — new file
- `backend/app/main.py` — added cards_router import and include_router

## Decisions Made

- **quality=0 or quality=5 → 422** validated at Pydantic schema level (ge=1, le=4), auth check fires first in HTTP layer but schema validation confirmed to work correctly
- **is_correct = quality >= 2** (Hard, Good, Easy count as correct; Again does not)
- **New words ordered by frequency DESC** — most frequent Quranic words shown first to new learners
- **POST /review creates progress if not exists** — idempotent first review handling via db.flush() before CardReview creation
- **session_id is optional** — CardReview can exist without a ReviewSession for standalone reviews

## Issues Encountered

- None. All verification tests passed: schemas import cleanly, routes register correctly, 401 returns for unauthenticated requests, validation logic confirmed via direct Pydantic testing.

## Next Step

Ready for 04-04-PLAN.md
