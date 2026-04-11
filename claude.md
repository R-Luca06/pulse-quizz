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
```
'landing' | 'launching' | 'quiz' | 'ranking' | 'result' | 'stats'
```

No router — screen transitions are handled with Framer Motion `AnimatePresence`.

Provider tree in `main.tsx`:
```
ToastProvider → AuthProvider → App
```

### Key files

| File | Role |
|---|---|
| `src/App.tsx` | Screen state machine, orchestrates game flow and Supabase calls post-game |
| `src/types/quiz.ts` | All shared types: `GameMode`, `Difficulty`, `Language`, `Category`, `AnswerState`, `QuizPhase`, `QuestionResult`, `TriviaQuestion` |
| `src/hooks/useQuiz.ts` | All game logic: fetch, answer, timeout, streak, prefetch compétitif |
| `src/hooks/useTimer.ts` | 10s countdown, 100ms tick, resets on `questionKey` change |
| `src/hooks/useAuth.ts` | Supabase Auth wrapper — exposes `user` (Supabase user) and `profile` (username etc.) |
| `src/hooks/useSettings.ts` | Game settings persistence in localStorage; exposes `settings` and `update` |
| `src/services/api.ts` | OpenTDB fetch (normal/survie) + compétitif batch fetch; exports `fetchQuestions`, `fetchCompetitifBatch`, `ApiError` |
| `src/services/leaderboard.ts` | Supabase leaderboard: `submitScore`, `getUserBestScore`, `getUserRank`, `getCompLeaderboardPage`, `getCompLeaderboardCount` |
| `src/services/cloudStats.ts` | Supabase per-user stats: `incrementCategoryStats`, `incrementGlobalStats`, `getCloudBestScore`, `fetchAllStats` |
| `src/services/supabase.ts` | Supabase client singleton |
| `src/contexts/AuthContext.tsx` | AuthProvider — listens to `onAuthStateChange`, fetches profile |
| `src/contexts/ToastContext.tsx` | ToastProvider — global toast notifications |
| `src/utils/sounds.ts` | Web Audio API synth sounds; module-level `muted` flag, `setMuted()`/`getMuted()` |
| `src/utils/statsStorage.ts` | `computeBestStreak(results)` helper |
| `src/utils/storage.ts` | `getBestScore(mode, difficulty)` / `saveBestScore(mode, difficulty, score)` via localStorage (anonymous users) |
| `src/utils/trivia.ts` | Legacy — superseded by `src/services/api.ts`. Keep until fully removed. |

### Key directories

- `src/components/landing/` — `LandingPage.tsx`, `SettingsModal.tsx`, `RulesModal.tsx`, `FloatingCardsBackground.tsx`, `StartButton.tsx`
- `src/components/quiz/` — `QuizContainer.tsx`, `QuestionCard.tsx`, `AnswerButton.tsx`, `TimerBar.tsx`, `StreakIndicator.tsx`
- `src/components/result/` — `ResultScreen.tsx`
- `src/components/ranking/` — `RankingRevealScreen.tsx` (leaderboard reveal after compétitif game)
- `src/components/stats/` — `StatsPage.tsx` (tabbed: personal stats + leaderboard)
- `src/components/auth/` — `AuthModal.tsx` (login / register)

## Settings modal (`SettingsModal.tsx`)

Play button → opens `SettingsModal`. Calls `onLaunch()` which triggers the launch animation sequence. Settings are persisted via `useSettings`.

Settings available:
- **Mode** — `normal` (10 questions) / `survie` (game over on first wrong/timeout) / `compétitif` (speed-based points, infinite questions, global leaderboard)
- **Niveau** — `easy` / `medium` / `hard` / `mixed` (mapped to OpenTDB `difficulty` param; ignored in compétitif)
- **Catégorie** — 13 OpenTDB categories + "Toutes" (ignored in compétitif)
- **Langue** — English only for now; French button is disabled with "bientôt" badge
- **Mute** — speaker icon in modal header; calls `setMuted()` from `sounds.ts`

## Game modes

- **Normal** : 10 questions, always advances regardless of answer. Score = number of correct answers.
- **Survie** : ends immediately after 1 wrong answer or timeout (feedback shown for 1.5s before finishing).
- **Compétitif** : infinite questions (prefetched in background), game ends on first wrong answer or timeout. Score = sum of speed-based points per correct answer. Submits to global leaderboard.

Header shows `X / 10` in normal mode, just `X` in survie/compétitif mode.

## Compétitif mode details

- Score uses speed tiers defined in `COMP_SPEED_TIERS` (`constants/game.ts`). Faster answer = higher multiplier.
- `getSpeedTier(elapsedSeconds)` exported from `constants/game.ts` — used in `useQuiz.ts` for both display and scoring.
- Questions are fetched in batches via `fetchCompetitifBatch`. Prefetch triggers when `COMP_PREFETCH_THRESHOLD` questions remain.
- After a compétitif game, `App.tsx` calls `submitScore` → `getUserRank` → shows `RankingRevealScreen` (paginated leaderboard with the player highlighted).

## Data flow (settings → API)

```
LandingPage → SettingsModal → onLaunch()
  → App.tsx screen: 'launching' → 'quiz'
  → QuizContainer props (gameMode, difficulty, language, category)
  → useQuiz({ gameMode, difficulty, language, category })
  → fetchQuestions / fetchCompetitifBatch
  → https://opentdb.com/api.php?amount=10&type=multiple[&difficulty=X][&category=N]
```

**Known limitation**: The `lang` parameter is not supported by OpenTDB. French language option is disabled in the UI.

## Post-game flow

```
useQuiz → onFinished(score, results)
  → App.handleFinished()
    ├── getCloudBestScore (normal mode + logged in)
    ├── getUserBestScore + getUserRank (compétitif + logged in)
    ├── submitScore + incrementCategoryStats + incrementGlobalStats (logged in)
    └── setScreen('ranking') if compétitif, else setScreen('result')
```

## Best score persistence

| Context | Storage |
|---|---|
| Not logged in | `localStorage` via `storage.ts` — key: `pulse_best_{mode}_{difficulty}` |
| Logged in, normal mode | Supabase `user_stats` table via `cloudStats.ts` |
| Logged in, compétitif | Supabase `comp_leaderboard` table via `leaderboard.ts` |

## Supabase

Tables:
- `profiles` — linked to auth users, stores `username`
- `user_stats` — per-user per-mode/difficulty/category stats (games played, correct, best streak, etc.)
- `user_global_stats` — aggregated totals across all modes
- `comp_leaderboard` — competitive scores with rank, language, game data

Auth: email/password via Supabase Auth. `AuthContext` listens to `onAuthStateChange` and fetches the profile row.

Realtime: not currently used (leaderboard is fetched on-demand).

## Sound system (`sounds.ts`)

Web Audio API, no external lib. Functions: `playCorrect()`, `playWrong()`, `playTimeout()`, `playTick()`.
All respect the module-level `muted` flag. Constants `FREQ`, `VOL`, `DUR` defined at top of file.

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
- Custom utilities: `text-glow-violet`, `text-glow-green`, `vignette-red`, `animate-glow-pulse`
