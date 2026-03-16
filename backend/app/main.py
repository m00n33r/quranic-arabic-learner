from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings

app = FastAPI(
    title="Quran Arabic Learner API",
    description="API для изучения слов 30-го джуза Корана",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    return {"status": "ok", "environment": settings.environment}


@app.get("/")
async def root():
    return {"message": "Quran Arabic Learner API"}
