# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-16)

**Core value:** Флэш-карточки со словами 30-го джуза с алгоритмом spaced repetition
**Current focus:** Phase 1 — Foundation

## Current Position

Phase: 8 of 8 (Quran Reader)
Plan: 1 of 3 in current phase
Status: In progress
Last activity: 2026-03-17 — Phases 1-6 executed (full backend + frontend working). Adding Reader feature.

Progress: ████████████░░ 85% (phases 1-6 complete, 08 in progress)

## Plans Created

| Phase | Plans | Status |
|-------|-------|--------|
| 1. Foundation | 01-01, 01-02, 01-03 | Complete ✓ |
| 2. Data Pipeline | 02-01, 02-02, 02-03 | Complete ✓ |
| 3. Authentication | 03-01, 03-02, 03-03 | Complete ✓ |
| 4. Flashcard Core | 04-01, 04-02, 04-03, 04-04 | Complete ✓ |
| 5. Frontend | 05-01, 05-02, 05-03, 05-04 | Complete ✓ |
| 6. Progress & Stats | 06-01, 06-02, 06-03 | Complete ✓ |
| 7. Deploy | 07-01, 07-02, 07-03 | Planned ✓ |
| 8. Quran Reader | 08-01, 08-02, 08-03 | In progress |

## Accumulated Context

### Key Decisions

- **API**: alquran.cloud (GET /v1/juz/30/editions/quran-uthmani,ru.kuliev)
- **SM-2 quality mapping**: user rates 1-4, mapped internally to SM-2 scale {1→1, 2→3, 3→4, 4→5}
- **Arabic font**: Amiri via Google Fonts (supports harakat/diacritics)
- **Test DB**: SQLite in-memory (not PostgreSQL) for test speed
- **Auth**: JWT stored in localStorage, interceptor adds Bearer header
- **bcrypt**: Use bcrypt directly (not passlib) — passlib 1.7.4 incompatible with bcrypt 5.x on Python 3.13
- **Streak logic**: counts from today or yesterday, gap breaks streak
- **Deploy**: Vercel (frontend) + Railway (backend + PostgreSQL)
- **Proxy**: Vercel rewrites /api/* → Railway URL (no CORS issues)
- **Tailwind**: Use v3 (not v4) — v4 has no CLI binary, different config format
- **verbatimModuleSyntax**: tsconfig.app.json enables it — always use `import type` for type-only imports in frontend
- **Dev proxy**: vite.config.ts proxies /api/* → localhost:8000 (relative URLs in Axios, no CORS in dev)

### Deferred Issues

None.

### Blockers/Concerns

None.

## Session Continuity

Last session: 2026-03-17
Stopped at: Created 08-01, 08-02, 08-03 PLAN.md files. Executing phase 08 (swipe + reader).
Resume: Run /gsd:execute-phase 8
