---
phase: 08-reader
plan: 02
subsystem: backend-api
provides: [reader-api-endpoints]
requires: [models-word-occurrence, models-user-card-progress]
affects: [frontend-reader]
key-files:
  - backend/app/schemas/reader.py
  - backend/app/api/v1/reader.py
  - backend/app/main.py
key-decisions:
  - Used batch word loading (words_map) instead of N+1 queries for /ayahs endpoint
  - WordInAyah.word_id=None for tokens without WordOccurrence (particles, conjunctions)
tech-stack:
  added: []
  patterns: [reader-router, batch-query-optimization]
tags: [api, reader, flashcards]
---

# Phase 08 Plan 02: Reader API Endpoints Summary

**4 reader endpoints created and registered under /api/v1/reader/*, with optimized batch word loading.**

## Accomplishments

- Created Pydantic schemas: SurahInfo, WordInAyah, AyahWithWords, EnqueueRequest, EnqueueResponse
- Implemented GET /reader/surahs — returns all surahs ordered by number asc
- Implemented GET /reader/ayahs/{surah_number} — returns ayahs with per-word breakdown (word_id, position, arabic, is_in_study)
- Implemented POST /reader/enqueue — creates UserCardProgress records for new words
- Implemented DELETE /reader/words/{word_id} — removes UserCardProgress for user/word pair
- Registered reader router in main.py alongside auth, cards, sessions, stats routers
- Applied batch optimization: all Words for an ayah set loaded in one query via words_map dict

## Files Created/Modified

- `backend/app/schemas/reader.py` — 5 Pydantic models for reader API
- `backend/app/api/v1/reader.py` — FastAPI router with 4 endpoints
- `backend/app/main.py` — added reader_router import and include_router call

## Decisions Made

- Batch word loading: instead of querying Word per occurrence in a loop, collect all word_ids then load all Words in one query (`words_map = {w.id: w for w in db.query(Word).filter(Word.id.in_(...)).all()}`)
- Tokens without WordOccurrence get word_id=None and arabic from extract_words() token (covers particles/conjunctions not in vocabulary)
- enqueue skips nonexistent word_ids silently (continues loop), returns counts of added vs already_studying
- dequeue is idempotent — if no progress record found, returns 204 with no error

## Issues Encountered

None.

## Next Step

Phase 08 backend complete. Ready for frontend reader implementation (08-03 or next phase).
