# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server (localhost:5173)
npm run build     # TypeScript check + Vite build
npm run lint      # ESLint
npm run preview   # Preview production build
```

## Architecture

**State machine** in `App.tsx` drives all screens via `AppScreen` type:
`'landing' → 'launching' → 'quiz' → 'result'`

No router — screen transitions are handled with Framer Motion `AnimatePresence`.

### Key directories

- `src/components/landing/` — Landing page, floating cards background, start button
- `src/components/quiz/` — Quiz container, question card, answer buttons, timer bar, streak indicator
- `src/components/result/` — End-of-game result screen
- `src/hooks/` — `useQuiz.ts` (game state), `useTimer.ts` (countdown)
- `src/utils/trivia.ts` — Open Trivia DB fetch, HTML entity decode, answer shuffle
- `src/types/quiz.ts` — Shared TypeScript types

### Animation conventions

- All animated components use Framer Motion `motion.*` elements
- Question card swaps use `AnimatePresence mode="sync"` with `key={currentIndex}`
- Entry/exit directions are randomized (`Math.random()` picks left/right/top/bottom)
- Launch sequence: cards converge → global shake → explosion → screen transition

### Data source

Questions fetched from Open Trivia DB on game start:
```
https://opentdb.com/api.php?amount=10&type=multiple
```
Answers are HTML-decoded (via `DOMParser`) and shuffled before display.

### Tailwind theme

Custom colors defined in `tailwind.config.js`:
- `game-bg`, `game-card`, `game-border` — dark background palette
- `game-success`, `game-danger`, `game-warning` — feedback colors
- `neon-violet`, `neon-blue` — accent colors
- `shadow-neon-*` — glow box-shadows
- Custom utilities: `text-glow-violet`, `text-glow-green`, `vignette-red`
