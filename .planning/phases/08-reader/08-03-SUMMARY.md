---
phase: 08-reader
plan: 03
type: summary
status: done
completed: 2026-03-17
commits:
  - c0d2461 feat(08-03): tajweed coloring utility (qalqalah, ghunnah, shadda, tanwin)
  - 1b079fd feat(08-03): reader API client (surahs, ayahs, enqueue, dequeue)
  - 4309984 feat(08-03): QuranReaderPage with tajweed, word selection, keyboard nav
  - 488ae3c feat(08-03): add /reader route and dashboard button
files_created:
  - frontend/src/utils/tajweed.ts
  - frontend/src/api/reader.ts
  - frontend/src/pages/QuranReaderPage.tsx
files_modified:
  - frontend/src/App.tsx
  - frontend/src/pages/DashboardPage.tsx
---

## Что сделано

### Task 1 — tajweed.ts
Утилита таджвид-расцветки: `getTajweedRule(word)` определяет правило (qalqalah / ghunnah / shadda / tanwin / none) по арабскому тексту слова. `TAJWEED_COLORS` — соответствующие hex-цвета. `TAJWEED_LEGEND` — данные для отображения легенды.

### Task 2 — reader.ts
API-клиент с типами: `SurahInfo`, `WordInAyah`, `AyahWithWords`, `EnqueueResponse`. Методы: `getSurahs`, `getAyahs(surahNumber)`, `enqueue(wordIds)`, `dequeue(wordId)`.

### Task 3 — QuranReaderPage.tsx
Полная страница `/reader`:
- Sticky navbar с dropdown выбора суры
- Progress bar (текущий аят / всего)
- Карточка аята: RTL арабский текст с таджвид-цветами, кликабельные слова (pending → желтый, studying → зеленый + ✓)
- Перевод (Кулиев)
- Сворачиваемая легенда таджвида
- Fixed bottom nav: ← Предыдущий / Следующий → с счетчиком
- Keyboard shortcuts: ArrowLeft/H/PageUp — назад, ArrowRight/L/Space/PageDown — вперед
- При переходе вперед pending слова автоматически отправляются через POST /reader/enqueue

### Task 4 — App.tsx + DashboardPage.tsx
- Добавлен route `/reader` с ProtectedRoute
- На дашборде добавлена кнопка "Читать Коран" (indigo) выше кнопки "Учиться"

## Верификация
- `npm run build` — 0 ошибок TypeScript, 89 modules transformed
- Все `import type` использованы корректно (verbatimModuleSyntax)
