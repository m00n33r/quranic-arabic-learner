---
phase: 08-reader
plan: 01
subsystem: frontend
provides: [swipe-review, keyboard-shortcuts]
affects: []
key-files:
  - frontend/src/pages/StudyPage.tsx
key-decisions:
  - handleQuality wrapped in useCallback to enable handleSwipe dependency chain
  - setTimeout removed from handleQuality (FlashCard already has 280ms delay)
  - isFlipped kept in StudyPage via onFlip callback for keyboard shortcut gating
tech-stack:
  added: []
  patterns: [useCallback-dependency-chain, swipe-to-review]
---

# Phase 08 Plan 01: Swipe-Based Card Review Summary

**Replaced QualityButtons with swipe interaction and keyboard shortcuts in StudyPage.**

## Accomplishments

- Removed `QualityButtons` import and component usage from StudyPage
- Wrapped `handleQuality` in `useCallback` to support stable dependency for `handleSwipe`
- Removed `setTimeout(300ms)` from `handleQuality` — FlashCard already provides 280ms delay before calling `onSwipe`
- Added `handleSwipe` callback: swipe right = quality 4 (know), swipe left = quality 1 (don't know)
- Added keyboard shortcut `useEffect`: ArrowRight/ArrowLeft work after card flip, guarded by `isFlipped` and `isReviewing`
- Updated `FlashCard` JSX with `key={currentCard.word_id}` (resets component on card change), `onFlip={setIsFlipped}`, `onSwipe={handleSwipe}`
- Replaced QualityButtons with hint text: "← Не знаю | или стрелки ← → | Знаю →" (shown only when flipped)
- Deleted `frontend/src/components/QualityButtons.tsx`

## Files Created/Modified

- `frontend/src/pages/StudyPage.tsx` — rewritten with swipe/keyboard review flow
- `frontend/src/components/QualityButtons.tsx` — deleted

## Decisions Made

- `handleQuality` uses `useCallback` with `[sessionId, isReviewing, cards, currentIndex, correctCount]` deps — necessary because `handleSwipe` depends on it and `handleSwipe` is in keyboard `useEffect` deps
- No `setTimeout` in `handleQuality`: FlashCard's exit animation (280ms) already serves as the delay before `onSwipe` fires

## Issues Encountered

None. Build passed on first attempt with 0 TypeScript errors.

## Next Step

Ready for 08-02-PLAN.md (next plan in phase 08-reader).
