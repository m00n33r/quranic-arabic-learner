# Quranic Arabic Learner

A full-stack web application for building Arabic vocabulary through direct engagement with Quranic text. Users read surahs with tajweed highlighting, tap words to add them to a personal study deck, and review with spaced-repetition flashcards.

## Features

- **Quran Reader** — browse surahs and ayahs with tajweed coloring (qalqalah, ghunnah, shadda, tanwin); click any word to enqueue it for study
- **Flashcards** — word-level translations with multiple meanings and in-context ayah examples on the back
- **Smart scheduling** — priority algorithm adapts card order based on review history
- **Progress tracking** — dashboard with study stats and streak counter
- **Dark / light theme**

## Tech stack

| Layer | Technology |
|---|---|
| Backend | FastAPI, SQLAlchemy, Alembic, PostgreSQL |
| Frontend | React, TypeScript, Tailwind CSS |
| Auth | JWT (python-jose + passlib) |
| ML | scikit-learn, numpy (priority model) |
| DevOps | Docker Compose |

## Getting started

**Prerequisites:** Docker and Docker Compose

```bash
git clone https://github.com/m00n33r/quranic-arabic-learner.git
cd quranic-arabic-learner
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000/docs

To seed the database with Quranic corpus data:

```bash
docker compose exec backend python -m app.data.seeder
```

## Project structure

```
backend/
  app/
    api/v1/       # FastAPI routers (auth, cards, reader, stats)
    models/       # SQLAlchemy models
    schemas/      # Pydantic schemas
    core/         # Smart priority algorithm
    utils/        # Arabic / tajweed utilities
frontend/
  src/
    pages/        # Reader, Study, Dashboard, Auth
    components/   # FlashCard, OnboardingModal, ThemeToggle
    api/          # API client functions
```
