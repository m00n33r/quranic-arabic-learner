# Phase 6 Plan 03: Dashboard UI Summary

**Replaced placeholder dashboard with live stats from /stats/summary — 4 stat cards, progress bar, loading skeleton, error+retry.**

## Accomplishments

- Created `frontend/src/api/stats.ts` with `StatsSummary` interface and `statsApi.getSummary()` wrapping the existing `apiClient`
- Rewrote `DashboardPage.tsx` with:
  - `useEffect` fetching `/stats/summary` on mount
  - Loading skeleton: 4 animated pulsing cards (`animate-pulse`)
  - Error state with inline retry button that re-fetches
  - 4 stat cards: words_learned (emerald), current_streak with 🔥 (amber), accuracy_overall with conditional blue/orange color (blue ≥70%, orange <70%), sessions_total (purple)
  - Progress bar inside the "Учиться" hero block: `words_learned / words_total`
  - "Учиться →" button with `cards_due_today` count shown in subtitle
  - Today's session summary line shown only when `cards_today > 0`
- Fixed TypeScript `verbatimModuleSyntax` requirement: separated `import type { StatsSummary }` from runtime import
- `npm run build` — zero errors, 87 modules transformed

## Files Created/Modified

- `frontend/src/api/stats.ts` — new file
- `frontend/src/pages/DashboardPage.tsx` — full rewrite

## Decisions Made

- Used `import type` for `StatsSummary` (required by `verbatimModuleSyntax` in tsconfig)
- Accuracy color threshold set at 70%: blue if good, orange if below average
- Streak sublabel uses singular "день подряд" for 1, plural "дней подряд" otherwise (simplified, covers most cases)
- Progress bar placed inside the emerald hero block for visual cohesion

## Issues Encountered

- TypeScript error TS1484: `StatsSummary` imported as a value when `verbatimModuleSyntax` is enabled. Fixed by splitting into `import type`.

## Next Step

Phase 6 complete — ready for Phase 7: Deploy
