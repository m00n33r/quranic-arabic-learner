---
phase: 02-data-pipeline
plan: 03
subsystem: database
tags: [postgresql, sqlalchemy, alquran-cloud, arabic, seeder]

# Dependency graph
requires:
  - phase: 02-01
    provides: SQLAlchemy models (Surah, Ayah, Word, WordOccurrence) and DB migrations
  - phase: 02-02
    provides: QuranFetcher (alquran.cloud API client) and arabic utils (normalize_arabic, extract_words)
provides:
  - DatabaseSeeder class with seed(), _seed_surahs(), _seed_ayahs(), _seed_words()
  - seed_db.py CLI script with --force and --juz flags
  - PostgreSQL populated with 37 surahs, 564 ayahs, 1262 unique words, 2459 word occurrences
affects: [03-authentication, 04-flashcard-core, 05-frontend]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Upsert-safe seeder: check existing before insert, skip if already seeded"
    - "Word deduplication by arabic_clean (normalized form without diacritics)"
    - "Frequency counting: count all occurrences across all ayahs per unique word"

key-files:
  created:
    - backend/app/data/seeder.py
    - backend/scripts/seed_db.py
    - backend/scripts/__init__.py
  modified: []

key-decisions:
  - "Words deduplicated by arabic_clean (without diacritics), arabic field stores most frequent display form"
  - "seed() method checks for existing data and skips unless force=True — safe for repeated runs"
  - "WordOccurrence stores position index (0-based) for future 'show word in context' feature"

patterns-established:
  - "Seeder pattern: orchestrate -> flush after each entity type -> commit once at end"
  - "CLI scripts go in backend/scripts/ with sys.path.insert for module resolution"

issues-created: []

# Metrics
duration: 8min
completed: 2026-03-17
---

# Phase 2 Plan 03: Seed Script Summary

**DatabaseSeeder populating PostgreSQL with 37 surahs, 564 ayahs, 1262 unique Arabic words and 2459 occurrences from Juz 30 via alquran.cloud**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-03-17T00:46:00Z
- **Completed:** 2026-03-17T00:54:00Z
- **Tasks:** 2 (+ 1 checkpoint skipped in YOLO mode)
- **Files modified:** 3

## Accomplishments

- DatabaseSeeder class with full seeding orchestration: surahs → ayahs → words → occurrences
- seed_db.py CLI script with `--force` (re-seed) and `--juz` flags
- PostgreSQL populated: 37 surahs, 564 ayahs, 1262 unique words, 2459 word occurrences
- Words correctly deduplicated by arabic_clean; top words: الله/من (53x), ان (44x), ما (40x)
- Phase 2 data pipeline fully complete — DB ready for flashcard system

## Task Commits

Each task was committed atomically:

1. **Task 1: DatabaseSeeder and seed_db.py CLI** - `ee349c4` (feat)
2. **Task 2: Seed PostgreSQL with Juz 30 data** - `1e36ce9` (feat)

## Files Created/Modified

- `backend/app/data/seeder.py` — DatabaseSeeder class with seed(), _seed_surahs(), _seed_ayahs(), _seed_words()
- `backend/scripts/seed_db.py` — CLI entry point with argparse (--force, --juz)
- `backend/scripts/__init__.py` — package marker for scripts directory

## Decisions Made

- Words deduplicated by `arabic_clean` (normalize_arabic output); `arabic` field stores the most frequent diacritized display form across all occurrences
- `seed()` checks for existing ayahs and skips if populated (idempotent by default); `force=True` clears and re-seeds
- `WordOccurrence.position` stored as 0-based index within ayah for future "show in context" feature
- Used `self.db.flush()` after each entity batch to get IDs before creating relations, single `commit()` at the end

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

- Checkpoint 3 (human-verify) was skipped in YOLO mode (`skip_checkpoints: true` in config.json)
- DB verification via psql confirmed all counts: surahs=37, ayahs=564, words=1262, occurrences=2459
- Note: global_number=5673 returned "О чем они расспрашивают друг друга?" (ru.kuliev translation); plan expected "О чём они вопрошают" — this is a valid translation variant, not an error

## Next Step

Phase 2 complete — ready for Phase 3: Authentication

---
*Phase: 02-data-pipeline*
*Completed: 2026-03-17*
