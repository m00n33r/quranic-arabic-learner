# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-16)

**Core value:** Флэш-карточки со словами 30-го джуза с алгоритмом spaced repetition
**Current focus:** Phase 1 — Foundation

## Current Position

Phase: 2 of 7 (Data Pipeline) — Phase 2 complete
Plan: 3 of 3 in current phase
Status: Phase complete — ready for Phase 3 (Authentication)
Last activity: 2026-03-17 — Completed 02-03-PLAN.md (Seed Script)

Progress: ████░░░░░░ 27% (6/22 plans complete)

## Plans Created

| Phase | Plans | Status |
|-------|-------|--------|
| 1. Foundation | 01-01, 01-02, 01-03 | Complete ✓ |
| 2. Data Pipeline | 02-01, 02-02, 02-03 | Complete ✓ |
| 3. Authentication | 03-01, 03-02, 03-03 | Planned ✓ |
| 4. Flashcard Core | 04-01, 04-02, 04-03, 04-04 | Planned ✓ |
| 5. Frontend | 05-01, 05-02, 05-03, 05-04 | Planned ✓ |
| 6. Progress & Stats | 06-01, 06-02, 06-03 | Planned ✓ |
| 7. Deploy | 07-01, 07-02, 07-03 | Planned ✓ |

## Accumulated Context

### Key Decisions

- **API**: alquran.cloud (GET /v1/juz/30/editions/quran-uthmani,ru.kuliev)
- **SM-2 quality mapping**: user rates 1-4, mapped internally to SM-2 scale {1→1, 2→3, 3→4, 4→5}
- **Arabic font**: Amiri via Google Fonts (supports harakat/diacritics)
- **Test DB**: SQLite in-memory (not PostgreSQL) for test speed
- **Auth**: JWT stored in localStorage, interceptor adds Bearer header
- **Streak logic**: counts from today or yesterday, gap breaks streak
- **Deploy**: Vercel (frontend) + Railway (backend + PostgreSQL)
- **Proxy**: Vercel rewrites /api/* → Railway URL (no CORS issues)

### Deferred Issues

None.

### Blockers/Concerns

None.

## Session Continuity

Last session: 2026-03-17
Stopped at: Completed 02-03-PLAN.md — Phase 2 Data Pipeline complete
Resume: Run /gsd:execute-plan on 03-01-PLAN.md to start Phase 3 (Authentication)
