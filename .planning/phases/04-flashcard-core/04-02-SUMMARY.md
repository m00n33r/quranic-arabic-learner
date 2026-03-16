# Phase 4 Plan 02: SM-2 Algorithm (TDD) Summary

**SM-2 spaced repetition algorithm implemented via TDD: 20 tests GREEN, full spec compliance with EF clamping and apply_sm2 convenience API.**

## Accomplishments

- RED phase: wrote 18 test cases (20 assertions across test functions) covering all SM-2 branches before any implementation existed — confirmed ImportError failure
- GREEN phase: implemented `calculate_sm2`, `map_quality`, `get_next_review_date` in `backend/app/core/sm2.py` — all tests pass
- REFACTOR phase: added `SM2Result` dataclass and `apply_sm2` high-level helper that accepts user 1-4 rating and returns a ready-to-persist result object (included in GREEN commit as per instruction to combine)

## Files Created/Modified

- `backend/tests/test_sm2.py` — 20 test items across 3 test classes
- `backend/app/core/sm2.py` — SM-2 implementation: `calculate_sm2`, `map_quality`, `get_next_review_date`, `SM2Result`, `apply_sm2`

## Decisions Made

- EF is NOT updated on wrong answer (quality < 3) — per SM-2 spec; only repetitions and interval reset
- EF floor enforced at 1.3 via `max(MIN_EF, new_ef)` after formula application
- `apply_sm2` and `SM2Result` dataclass included in the implementation file rather than a separate refactor commit, since the plan instruction required both commits (test + feat) and the dataclass was part of the GREEN implementation spec provided
- 20 tests collected by pytest (18 logical test cases; `test_invalid_quality_raises` tests two ValueError paths in one function)

## Issues Encountered

- None. All 20 tests passed on first GREEN run.

## Next Step

Ready for 04-03-PLAN.md
