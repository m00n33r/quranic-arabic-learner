# Roadmap: Quran Arabic Learner

## Overview

От пустого репозитория до задеплоенного веб-сервиса: настраиваем окружение и БД → загружаем данные 30-го джуза → делаем авторизацию → строим ядро карточек с SM-2 → собираем React-интерфейс с RTL → добавляем статистику → деплоим на Vercel + Railway.

## Domain Expertise

None

## Phases

- [ ] **Phase 1: Foundation** — структура проекта, Docker, схема БД, окружение
- [ ] **Phase 2: Data Pipeline** — импорт 30-го джуза, слова + переводы + аяты в PostgreSQL
- [ ] **Phase 3: Authentication** — регистрация, вход, JWT, защищённые маршруты
- [ ] **Phase 4: Flashcard Core** — SM-2 алгоритм, API карточек, сессия повторений
- [ ] **Phase 5: Frontend** — React-приложение, RTL, интерфейс карточек и сессии
- [ ] **Phase 6: Progress & Stats** — статистика пользователя, серия дней, дашборд
- [ ] **Phase 7: Deploy** — Vercel (фронтенд) + Railway (бэкенд), CI/CD, прод БД

## Phase Details

### Phase 1: Foundation
**Goal**: Рабочее окружение разработки: монорепо, Docker Compose (FastAPI + PostgreSQL), Alembic миграции, базовая структура проекта
**Depends on**: Nothing (first phase)
**Research**: Unlikely (стандартная настройка FastAPI + Docker)
**Plans**: 3 плана

Plans:
- [ ] 01-01: Структура монорепо (frontend/, backend/, docker-compose.yml, .env)
- [ ] 01-02: FastAPI приложение — базовая конфигурация, health check, CORS
- [ ] 01-03: PostgreSQL + Alembic — подключение, первые миграции, схема БД

### Phase 2: Data Pipeline
**Goal**: Все слова 30-го джуза загружены в PostgreSQL: арабский текст, русский/английский перевод, пример аята
**Depends on**: Phase 1
**Research**: Likely (alquran.cloud API структура, формат данных, кодировка Unicode)
**Research topics**: alquran.cloud API endpoints для 30-го джуза, формат слов и аятов, готовые SQLite БД Корана как альтернатива, нормализация арабского текста
**Plans**: 3 плана

Plans:
- [ ] 02-01: Скрипт загрузки данных из alquran.cloud API (30-й джуз, сура + аят + арабский текст)
- [ ] 02-02: Парсинг и нормализация слов: извлечение уникальных слов, переводы, леммы
- [ ] 02-03: Seed скрипт — заполнение БД, таблицы words + ayahs + word_ayah_links

### Phase 3: Authentication
**Goal**: Пользователь может зарегистрироваться, войти и получить JWT токен; защищённые эндпоинты работают
**Depends on**: Phase 1
**Research**: Likely (FastAPI + JWT паттерны, passlib/bcrypt, python-jose)
**Research topics**: FastAPI security best practices, JWT refresh token стратегия, библиотеки passlib + python-jose
**Plans**: 3 плана

Plans:
- [ ] 03-01: Модель User, схема БД, хэширование паролей (bcrypt)
- [ ] 03-02: JWT эндпоинты — /register, /login, /refresh, /me
- [ ] 03-03: Dependency injection для авторизации, защита маршрутов

### Phase 4: Flashcard Core
**Goal**: Рабочий цикл повторений: пользователь начинает сессию, оценивает карточки, SM-2 планирует следующее повторение
**Depends on**: Phase 2, Phase 3
**Research**: Likely (SM-2 алгоритм параметры, реализация на Python)
**Research topics**: SM-2 алгоритм формула (easiness factor, interval, repetitions), open-source реализации для сверки
**Plans**: 4 плана

Plans:
- [ ] 04-01: Таблицы user_cards (прогресс по карточке) и review_sessions
- [ ] 04-02: SM-2 алгоритм — функция расчёта следующего повторения
- [ ] 04-03: API эндпоинты — GET /cards/due, POST /cards/{id}/review
- [ ] 04-04: Логика сессии — начать сессию, завершить, получить результаты

### Phase 5: Frontend
**Goal**: React-приложение с авторизацией и полным UI для изучения карточек (RTL арабский текст)
**Depends on**: Phase 3, Phase 4
**Research**: Likely (RTL в React/CSS, арабские шрифты для веба, Tailwind RTL плагин)
**Research topics**: CSS dir="rtl" + Tailwind RTL, шрифты Amiri/Scheherazade через Google Fonts, React Router v6, Axios interceptors для JWT
**Plans**: 4 плана

Plans:
- [ ] 05-01: Базовое React-приложение — Vite, React Router, Tailwind, API client с JWT
- [ ] 05-02: Экраны авторизации — страницы Login и Register
- [ ] 05-03: Интерфейс карточки — RTL арабский текст, анимация переворота, кнопки оценки
- [ ] 05-04: Экран сессии — очередь карточек, прогресс сессии, экран завершения

### Phase 6: Progress & Stats
**Goal**: Пользователь видит свой прогресс: сколько слов выучено, серия дней, уровень каждой карточки
**Depends on**: Phase 4, Phase 5
**Research**: Unlikely (стандартные SQL агрегации, CRUD-дашборд)
**Plans**: 3 плана

Plans:
- [ ] 06-01: API статистики — /stats/summary (слов выучено, серия, карточек сегодня)
- [ ] 06-02: Логика серии дней (streak) — расчёт и сохранение
- [ ] 06-03: UI дашборда — карточки статистики, прогресс-бар, история активности

### Phase 7: Deploy
**Goal**: Приложение доступно по публичному URL: фронтенд на Vercel, бэкенд на Railway, прод БД PostgreSQL
**Depends on**: Phase 6
**Research**: Likely (Railway конфигурация для FastAPI, переменные окружения, Vercel proxy для API)
**Research topics**: Railway deployment для FastAPI (Dockerfile vs Nixpacks), Vercel rewrites для проксирования API, PostgreSQL на Railway/Render бесплатный тир
**Plans**: 3 плана

Plans:
- [ ] 07-01: Подготовка к деплою — production env vars, CORS настройка, Dockerfile оптимизация
- [ ] 07-02: Деплой бэкенда на Railway + PostgreSQL, миграции в проде
- [ ] 07-03: Деплой фронтенда на Vercel, настройка proxy для API, smoke tests

## Progress

**Execution Order:** 1 → 2 → 3 → 4 → 5 → 6 → 7

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 0/3 | Not started | - |
| 2. Data Pipeline | 0/3 | Not started | - |
| 3. Authentication | 0/3 | Not started | - |
| 4. Flashcard Core | 0/4 | Not started | - |
| 5. Frontend | 0/4 | Not started | - |
| 6. Progress & Stats | 0/3 | Not started | - |
| 7. Deploy | 0/3 | Not started | - |
