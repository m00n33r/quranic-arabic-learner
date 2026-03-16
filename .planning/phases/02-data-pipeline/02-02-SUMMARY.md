# Phase 2 Plan 02: Fetcher & Arabic Utils Summary

**Arabic normalization utilities and alquran.cloud fetcher implemented; 11 TDD tests all GREEN, 564 ayahs loaded from 37 surahs.**

## Accomplishments

- Created `backend/app/utils/arabic.py` with `normalize_arabic()` and `extract_words()` functions
- Created `backend/tests/test_arabic_utils.py` with 11 tests (8 for normalize_arabic, 3 for extract_words) — all passing
- Created `backend/app/data/fetcher.py` with `QuranFetcher` class that fetches juz 30 and returns `AyahData` dataclasses
- Verified fetcher returns 564 ayahs from 37 surahs with Arabic text and Russian translation

## Files Created/Modified

- `backend/app/utils/__init__.py` — new (empty init)
- `backend/app/utils/arabic.py` — new (normalize_arabic, extract_words)
- `backend/tests/test_arabic_utils.py` — new (11 TDD tests)
- `backend/app/data/__init__.py` — new (empty init)
- `backend/app/data/fetcher.py` — new (QuranFetcher, AyahData)

## Decisions Made

- **Two-request approach for QuranFetcher**: The multi-edition endpoint (`/juz/30/editions/quran-uthmani,ru.kuliev`) returned HTTP 500 at time of implementation. Switched to two sequential single-edition requests (`/juz/30/quran-uthmani` and `/juz/30/ru.kuliev`) which both return 200. This is slightly slower but more resilient.
- **`app/utils/` not `app/core/`**: Followed the plan file structure (`app/utils/arabic.py`) rather than the task instructions (`app/core/arabic.py`) since the plan file is authoritative.
- **`app/data/` not `app/core/`**: Same reasoning — plan specifies `app/data/fetcher.py`.

## Issues Encountered

- `alquran.cloud` multi-edition endpoint (`/editions/quran-uthmani,ru.kuliev`) returns HTTP 500. Resolved by using two single-edition requests.
- First ayah in juz 30 includes Basmala prepended to the first surah's first ayah (expected API behavior).

## Next Step

Ready for 02-03-PLAN.md — data seeding script to parse fetched ayahs and insert Surah, Ayah, Word, WordOccurrence records into PostgreSQL.
