# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server (localhost:5173)
npm run build     # TypeScript check + Vite build
npm run lint      # ESLint
npm run preview   # Preview production build
npx tsc --noEmit  # Type-check only (run after every change)
```

## Architecture

**State machine** in `App.tsx` drives all screens via `AppScreen` type:
`'landing' → 'launching' → 'quiz' → 'result'`

No router — screen transitions are handled with Framer Motion `AnimatePresence`.

### Key files

| File | Role |
|---|---|
| `src/App.tsx` | Screen state machine, passes props down, handles best score logic |
| `src/types/quiz.ts` | All shared types: `GameMode`, `Difficulty`, `Language`, `Category`, `AnswerState`, `QuizPhase`, `QuestionResult`, `TriviaQuestion` |
| `src/hooks/useQuiz.ts` | All game logic: fetch, answer, timeout, streak, survie mode |
| `src/hooks/useTimer.ts` | 10s countdown, 100ms tick, resets on `currentIndex` change |
| `src/utils/trivia.ts` | OpenTDB fetch with difficulty/category params, HTML decode, shuffle |
| `src/utils/sounds.ts` | Web Audio API synth sounds; module-level `muted` flag, `setMuted()`/`getMuted()` |
| `src/utils/storage.ts` | `getBestScore(mode, difficulty)` / `saveBestScore(mode, difficulty, score)` via localStorage |

### Key directories

- `src/components/landing/` — `LandingPage.tsx` (settings popup), `FloatingCardsBackground.tsx`, `StartButton.tsx`
- `src/components/quiz/` — `QuizContainer.tsx`, `QuestionCard.tsx`, `AnswerButton.tsx`, `TimerBar.tsx`, `StreakIndicator.tsx`
- `src/components/result/` — `ResultScreen.tsx`

## Settings popup (`LandingPage.tsx`)

Play button → opens a modal with all settings. Calls `onStart(mode, difficulty, language, category)` on launch.

Settings available:
- **Mode** — `normal` (10 questions) or `survie` (game over on first wrong/timeout)
- **Niveau** — `easy` / `medium` / `hard` (mapped to OpenTDB `difficulty` param)
- **Catégorie** — 13 OpenTDB categories + "Toutes" (mapped to OpenTDB `category` param)
- **Langue** — English only for now; French button is disabled with "bientôt" badge (OpenTDB is English-only)
- **Mute** — speaker icon in modal header; calls `setMuted()` from `sounds.ts`

## Game modes

- **Normal** : 10 questions, always advances regardless of answer
- **Survie** : ends immediately after 1 wrong answer or timeout (feedback shown for 1.5s before finishing)

Header shows `X / 10` in normal mode, just `X` in survie mode.

## Data flow (settings → API)

```
LandingPage → onStart(mode, difficulty, language, category)
  → App.tsx state
  → QuizContainer props
  → useQuiz({ gameMode, difficulty, language, category })
  → fetchQuestions(difficulty, language, category)
  → https://opentdb.com/api.php?amount=10&type=multiple[&difficulty=X][&category=N]
```

**Known limitation**: The `lang` parameter is not supported by OpenTDB. French language option is disabled in the UI.

## Best score persistence

`App.tsx` reads/writes `localStorage` via `src/utils/storage.ts`.
Key format: `pulse_best_{mode}_{difficulty}` (e.g. `pulse_best_normal_easy`).
`ResultScreen` receives `bestScore` and `isNewBest` props and displays a "Nouveau record !" badge when beaten.

## Sound system (`sounds.ts`)

Web Audio API, no external lib. Functions: `playCorrect()`, `playWrong()`, `playTimeout()`, `playTick()`.
All respect the module-level `muted` flag. Call `setMuted(true/false)` to toggle.

## Animation conventions

- All animated components use Framer Motion `motion.*` elements
- Question card swaps use `AnimatePresence mode="sync"` with `key={currentIndex}`
- Entry/exit directions are randomized (`Math.random()` picks left/right/top/bottom)
- Launch sequence: cards converge → global shake → explosion → screen transition
- Ambient floating balls in `QuizContainer` change color with timer state and answer feedback

## Tailwind theme

Custom colors defined in `tailwind.config.js`:
- `game-bg`, `game-card`, `game-border` — dark background palette
- `game-success`, `game-danger`, `game-warning` — feedback colors
- `neon-violet`, `neon-blue` — accent colors
- `shadow-neon-*` — glow box-shadows
- Custom utilities: `text-glow-violet`, `text-glow-green`, `vignette-red`
