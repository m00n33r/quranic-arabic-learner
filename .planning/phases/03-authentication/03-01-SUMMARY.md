---
phase: 03-authentication
plan: 01
subsystem: auth
tags: [jwt, bcrypt, python-jose, sqlalchemy, alembic, postgresql]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: SQLAlchemy Base with TimestampMixin, Alembic setup, PostgreSQL connection
provides:
  - User SQLAlchemy model with id/email/username/hashed_password/is_active/timestamps
  - users table in PostgreSQL with unique indexes on email and username
  - verify_password() and get_password_hash() using bcrypt directly
  - create_access_token() and decode_access_token() using python-jose HS256
  - 8 passing unit tests for all security utilities
affects: [03-authentication, 04-flashcard-core, 05-frontend]

# Tech tracking
tech-stack:
  added: [bcrypt 5.x direct usage, python-jose[cryptography]]
  patterns: ["bcrypt direct API (not passlib) for Python 3.13 compatibility", "JWT payload with exp claim and settings-driven config"]

key-files:
  created:
    - backend/app/models/user.py
    - backend/app/core/security.py
    - backend/tests/test_security.py
    - backend/alembic/versions/8ffcfa14a4a9_create_users_table.py
  modified:
    - backend/app/models/__init__.py

key-decisions:
  - "Used bcrypt directly instead of passlib — passlib 1.7.4 incompatible with bcrypt 4+/5+ due to missing __about__ attribute"
  - "decode_access_token returns None on error (not raises) for clean caller handling"

patterns-established:
  - "Security functions are pure functions with no side effects, easy to test"
  - "JWT sub claim stores str(user_id), exp always present"

issues-created: []

# Metrics
duration: 2min
completed: 2026-03-16
---

# Phase 3 Plan 01: User Model & Security Utils Summary

**User model + users table in PostgreSQL + bcrypt/JWT security utilities with 8 passing tests (passlib replaced with direct bcrypt for Python 3.13 compatibility)**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-16T21:53:42Z
- **Completed:** 2026-03-16T21:55:28Z
- **Tasks:** 2 completed
- **Files modified:** 5 (4 created, 1 modified)

## Accomplishments

- SQLAlchemy User model with 7 columns (id, email, username, hashed_password, is_active, created_at, updated_at) + unique indexes
- Alembic migration `8ffcfa14a4a9` generated and applied — users table verified in PostgreSQL
- `security.py` with `verify_password`, `get_password_hash` (bcrypt), `create_access_token`, `decode_access_token` (python-jose HS256)
- 8 unit tests: 4 password hashing + 4 JWT — all GREEN

## Task Commits

Each task was committed atomically:

1. **Task 1: User model + Alembic migration** - `4863cb4` (feat)
2. **Task 2: security.py + tests** - `9152a60` (feat)

**Plan metadata:** (docs commit — see below)

## Files Created/Modified

- `backend/app/models/user.py` — SQLAlchemy User model with TimestampMixin
- `backend/app/models/__init__.py` — added User to exports
- `backend/app/core/security.py` — bcrypt + JWT utilities
- `backend/tests/test_security.py` — 8 unit tests for all security functions
- `backend/alembic/versions/8ffcfa14a4a9_create_users_table.py` — migration for users table

## Decisions Made

- **bcrypt direct over passlib**: passlib 1.7.4 is incompatible with bcrypt 4+/5+ (missing `__about__` attribute causes ValueError during wrap-bug detection). Used `bcrypt` library directly — simpler API, no compatibility issues.
- **decode_access_token returns None on JWTError**: cleaner than raising — callers check `if payload is None` rather than try/except.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Replaced passlib with direct bcrypt usage**

- **Found during:** Task 2 (security.py implementation + test run)
- **Issue:** passlib 1.7.4 incompatible with bcrypt 5.0.0 — `bcrypt.__about__` was removed in bcrypt 4.0+, causing passlib's wrap-bug detection to raise `ValueError: password cannot be longer than 72 bytes` on all hashing operations
- **Fix:** Replaced `CryptContext(schemes=["bcrypt"])` with direct `bcrypt.hashpw()` / `bcrypt.checkpw()` calls
- **Files modified:** `backend/app/core/security.py`
- **Verification:** All 4 password hashing tests GREEN after fix
- **Committed in:** `9152a60` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (blocking), 0 deferred
**Impact on plan:** Fix necessary to unblock bcrypt functionality on Python 3.13. No scope creep — same API surface, same behavior.

## Issues Encountered

None beyond the passlib/bcrypt incompatibility handled as deviation above.

## Next Phase Readiness

- User model and migration ready for auth endpoints (03-02)
- Security utilities (`verify_password`, `create_access_token`, `decode_access_token`) ready for use in `/register` and `/login` handlers
- Next: 03-02-PLAN.md — JWT endpoints (/register, /login, /me)

---
*Phase: 03-authentication*
*Completed: 2026-03-16*
