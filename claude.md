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
'landing' | 'launching' | 'quiz' | 'ranking' | 'result' | 'stats' | 'profile' | 'achievements'
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
| `src/hooks/useSettings.ts` | Game settings persistence in localStorage; exposes `settings` and `update` |
| `src/hooks/useGameOrchestration.ts` | Post-game orchestration: stats, leaderboard, achievements, screen transitions |
| `src/services/api.ts` | Supabase RPC fetch (normal + compétitif batch); exports `fetchQuestions`, `fetchCompetitifBatch`, `ApiError` |
| `src/services/leaderboard.ts` | Supabase leaderboard: `submitScore`, `getUserBestScore`, `getUserRank`, `getCompLeaderboardPage`, `getCompLeaderboardCount` |
| `src/services/cloudStats.ts` | Supabase per-user stats: `incrementCategoryStats`, `incrementGlobalStats`, `getCloudBestScore`, `fetchAllStats` |
| `src/services/achievements.ts` | Supabase achievements: `getUserAchievements`, `checkAndUnlockAchievements` |
| `src/services/profile.ts` | Account management: `updateUsername`, `updateEmail`, `updatePassword`, `deleteAccount` |
| `src/services/errors.ts` | `AppError` class with typed error codes |
| `src/services/supabase.ts` | Supabase client singleton |
| `src/contexts/AuthContext.tsx` | AuthProvider — listens to `onAuthStateChange`, fetches profile, exposes `useAuth()` hook |
| `src/contexts/ToastContext.tsx` | ToastProvider — global toast notifications |
| `src/utils/sounds.ts` | Web Audio API synth sounds; module-level `muted` flag, `setMuted()`/`getMuted()` |
| `src/utils/statsStorage.ts` | Local stats storage (anonymous users) + `computeBestStreak(results)` helper |

### Key directories

- `src/components/landing/` — `LandingPage.tsx`, `SettingsModal.tsx`, `RulesModal.tsx`, `FloatingCardsBackground.tsx`, `StartButton.tsx`
- `src/components/quiz/` — `QuizContainer.tsx`, `QuestionCard.tsx`, `AnswerButton.tsx`, `TimerBar.tsx`, `StreakIndicator.tsx`
- `src/components/result/` — `ResultScreen.tsx`
- `src/components/ranking/` — `RankingRevealScreen.tsx` (leaderboard reveal after compétitif game)
- `src/components/stats/` — `StatsPage.tsx` (tabbed: personal stats + leaderboard)
- `src/components/profile/` — `ProfilePage.tsx` + tabs (`GeneralTab`, `StatsTab`, `ConfidentialityTab`)
- `src/components/achievements/` — `AchievementsPage.tsx`, `AchievementUnlockOverlay.tsx`
- `src/components/auth/` — `AuthModal.tsx` (login / register)

## Settings modal (`SettingsModal.tsx`)

Play button → opens `SettingsModal`. Calls `onLaunch()` which triggers the launch animation sequence. Settings are persisted via `useSettings`.

Settings available:
- **Mode** — `normal` (10 questions) / `compétitif` (speed-based points, infinite questions, global leaderboard)
- **Niveau** — `easy` / `medium` / `hard` (ignored in compétitif, which always uses `mixed`)
- **Catégorie** — 7 catégories Supabase + "Toutes" (ignored in compétitif)
- **Langue** — French only (`'fr'`)
- **Mute** — speaker icon in modal header; calls `setMuted()` from `sounds.ts`

## Game modes

- **Normal** : 10 questions, always advances regardless of answer. Score = number of correct answers.
- **Compétitif** : infinite questions (prefetched in background), game ends on first wrong answer or timeout. Score = sum of speed-based points per correct answer. Submits to global leaderboard.

Header shows `X / 10` in normal mode, just `X` in compétitif mode.

## Compétitif mode details

- Score uses speed tiers defined in `COMP_SPEED_TIERS` (`constants/game.ts`). Faster answer = higher multiplier.
- `getSpeedTier(elapsedSeconds)` exported from `constants/game.ts` — used in `useQuiz.ts` for both display and scoring.
- Questions are fetched in batches via `fetchCompetitifBatch`. Prefetch triggers when `COMP_PREFETCH_THRESHOLD` questions remain.
- After a compétitif game, `useGameOrchestration` calls `submitScore` → `getUserRank` → shows `RankingRevealScreen` (paginated leaderboard with the player highlighted).

## Data flow (settings → API)

```
LandingPage → SettingsModal → onLaunch()
  → App.tsx screen: 'launching' → 'quiz'
  → QuizContainer props (gameMode, difficulty, language, category)
  → useQuiz({ gameMode, difficulty, language, category })
  → fetchQuestions / fetchCompetitifBatch
  → supabase.rpc('get_random_questions', { p_language, p_difficulty, p_category, p_limit })
```

## Post-game flow

```
useQuiz → onFinished(score, results)
  → useGameOrchestration.handleFinished()
    ├── getCloudBestScore (normal mode + logged in)
    ├── getUserBestScore + getUserRank (compétitif + logged in)
    ├── submitScore + incrementCategoryStats + incrementGlobalStats (logged in)
    ├── checkAndUnlockAchievements (logged in, chained after incrementGlobalStats)
    └── setScreen('ranking') if compétitif, else setScreen('result')
```

## Best score persistence

| Context | Storage |
|---|---|
| Not logged in | `localStorage` via `statsStorage.ts` — key: `pulse_stats_{mode}_{difficulty}_{category}` |
| Logged in, normal mode | Supabase `user_stats` table via `cloudStats.ts` |
| Logged in, compétitif | Supabase `leaderboard` table via `leaderboard.ts` |

## Supabase

Schema complet : `scripts/supabase_schema.sql`

Tables:
- `profiles` — linked to auth users, stores `username` (denormalized in `leaderboard`)
- `questions` — quiz question bank, queried via `get_random_questions` RPC
- `leaderboard` — best scores per user/mode/difficulty/language (normal + compétitif)
- `user_stats` — per-user per-mode/difficulty/category stats (games played, correct, best streak, etc.)
- `user_global_stats` — aggregated totals across all modes
- `user_achievements` — unlocked achievements per user

RPC functions:
- `get_random_questions(p_language, p_difficulty, p_category, p_limit)` — random question selection
- `delete_user()` — full account deletion (SECURITY DEFINER)

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
- `neon-violet`, `neon-blue`, `neon-cyan`, `neon-pink` — accent colors
- `shadow-neon-*` — glow box-shadows (`neon-violet`, `neon-blue`, `neon-green`, `neon-red`, `neon-gold`)
- Custom animations: `animate-pulse-ring`, `animate-glow-pulse`
