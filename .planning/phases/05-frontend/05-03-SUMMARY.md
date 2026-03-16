# Phase 5 Plan 03: FlashCard Components Summary

**Created three flashcard UI components (FlashCard with 3D RTL flip, QualityButtons 1-4, ProgressBar with accuracy) and CSS flip animation — the visual core of the Study page.**

## Accomplishments

- Added CSS 3D flip animation classes to `index.css` (`card-container`, `card-inner`, `card-inner.flipped`, `card-face`, `card-back-face`) using `perspective: 1200px` and `cubic-bezier(0.4, 0, 0.2, 1)` easing
- Created `FlashCard.tsx`: click-to-flip card showing Arabic word (Amiri font, 4rem, dir="rtl", lang="ar") on front, translation + SM-2 stats on back, with "Новое" badge for new cards
- Created `QualityButtons.tsx`: 4 colored buttons (red/orange/blue/green) only visible after card flip via `visible` prop, with emoji labels and sublabels
- Created `ProgressBar.tsx`: shows current/total counter and accuracy percentage (green ≥70%, orange <70%), with animated emerald progress bar
- TypeScript check passed with zero errors (`npx tsc --noEmit`)

## Files Created/Modified

| File | Action |
|------|--------|
| `frontend/src/index.css` | Modified — added flip animation CSS classes |
| `frontend/src/components/FlashCard.tsx` | Created — 3D flip card with Arabic RTL display |
| `frontend/src/components/QualityButtons.tsx` | Created — 4 quality assessment buttons |
| `frontend/src/components/ProgressBar.tsx` | Created — progress and accuracy display |

## Decisions Made

- Used `card-back-face card-face` compound class on back panel to apply both `backface-visibility: hidden` and `rotateY(180deg)` — matches plan spec
- `QualityButtons` returns `null` when `visible=false` (not just hidden) — clean DOM and no layout shift when buttons are off
- `ProgressBar` accuracy shows `null` on the first card (before any answers) to avoid showing 0% misleadingly
- Kept `line-height: 2` inline on Arabic text to ensure diacritics (harakat) render above/below without clipping

## Issues Encountered

None — TypeScript compilation passed cleanly on first attempt.

## Next Step

Ready for 05-04-PLAN.md — Study page that composes FlashCard + QualityButtons + ProgressBar with API calls and session logic.
