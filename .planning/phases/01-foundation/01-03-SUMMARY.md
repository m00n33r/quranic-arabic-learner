# Phase 1 Plan 03: Database & Alembic Summary

**SQLAlchemy engine + Alembic configured, PostgreSQL running in Docker, migrations applied, /health/db returns 200.**

## Accomplishments

- Created `backend/app/core/database.py` with SQLAlchemy engine (`pool_pre_ping=True`, pool_size=10), `SessionLocal`, and `get_db` dependency
- Created `backend/app/models/base.py` with `Base` (DeclarativeBase) and `TimestampMixin` (created_at/updated_at columns)
- Updated `backend/app/models/__init__.py` to export `Base` and `TimestampMixin`
- Added `/health/db` endpoint to `backend/app/main.py` using `get_db` dependency
- Initialized Alembic with `alembic init alembic` inside `backend/`
- Configured `backend/alembic/env.py` to use `settings.database_url` and `Base.metadata` for autogenerate
- Created `backend/.env` for local dev and `backend/.env.example` as template
- Started PostgreSQL via `docker compose up -d db` (healthy)
- Ran `alembic revision --autogenerate -m "initial"` — initial migration created
- Ran `alembic upgrade head` — `alembic_version` table created in DB
- Started full stack via `docker compose up -d --build` — both containers healthy
- Verified: `/health` → `{"status":"ok"}`, `/health/db` → `{"database":"ok"}`

## Files Created/Modified

- `backend/app/core/database.py` — new
- `backend/app/models/base.py` — new
- `backend/app/models/__init__.py` — updated
- `backend/app/main.py` — updated (added /health/db)
- `backend/alembic.ini` — new (alembic init)
- `backend/alembic/env.py` — replaced with custom config
- `backend/alembic/README` — new (alembic init)
- `backend/alembic/script.py.mako` — new (alembic init)
- `backend/alembic/versions/1252150a6355_initial.py` — new (empty initial migration)
- `backend/.env` — new (local dev, gitignored)
- `backend/.env.example` — new
- `docker-compose.yml` — updated (port 5432→5434 for host mapping)

## Decisions Made

- Port remapped: `docker-compose.yml` maps DB port as `5434:5432` on host (instead of `5432:5432`) because macOS had a local PostgreSQL@14 service occupying port 5432. The backend container connects internally via `db:5432` (unchanged).
- `backend/.env` uses `postgresql+psycopg2://quran:quran@localhost:5434/quran_learner` for local alembic runs from host.
- Docker Compose `DATABASE_URL` uses `postgresql://` (no driver prefix) — works fine inside the container with psycopg2 installed.

## Issues Encountered

- Port 5432 conflict: local Homebrew postgresql@14 service occupied port 5432. Resolved by remapping Docker db service external port to 5434.
- `alembic init` timed out on first attempt while pulling postgres:16-alpine image (~103MB download). Pulled image explicitly first, then started containers successfully.

## Next Step

Phase 1 complete — ready for Phase 2: Data Pipeline
