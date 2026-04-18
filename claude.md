# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server (localhost:5173)
npm run build     # TypeScript check + Vite build
npm run lint      # ESLint
npm run preview   # Preview production build
npx tsc --noEmit  # Type-check only (run after every change)
npm test          # Vitest
```

## Architecture

**State machine** in `App.tsx` drives all screens via `AppScreen` type:
```
'landing' | 'launching' | 'quiz' | 'ranking' | 'result'
        | 'stats' | 'profile' | 'achievements'
        | 'social' | 'daily' | 'collection'
```

No router — screen transitions are handled with Framer Motion `AnimatePresence`.
All non-critical pages are `lazy()`-loaded.

Provider tree in `main.tsx`:
```
ToastProvider → AuthProvider → App
```
`initAnalytics()` (PostHog) runs before mount.

### Key files

| File | Role |
|---|---|
| `src/App.tsx` | Screen state machine, orchestrates achievement overlay + reward toast, wires `useGameOrchestration` |
| `src/types/quiz.ts` | Shared types: `GameMode` (normal/compétitif/daily), `Difficulty`, `Language`, `Category`, `QuestionResult`, `GameResult`, `XpBreakdown`, `PulsesBreakdown`, `AchievementId`, `AchievementTier`, `OwnedBadge`, `DailyTheme`, `DailyEntry`, `DailyStreak`, `DailyLeaderboardEntry` |
| `src/hooks/useQuiz.ts` | Game logic: fetch, answer, timeout, streak, prefetch compétitif/daily |
| `src/hooks/useTimer.ts` | 10s countdown, 100ms tick, resets on `questionKey` change |
| `src/hooks/useSettings.ts` | Game settings persistence (`update` / `updateTemp` / `reset`). `updateTemp` used for daily so it does not overwrite normal preferences |
| `src/hooks/useGameOrchestration.ts` | Post-game orchestration: XP/Pulses credit, stats, leaderboard, daily entry, achievements, notifications, screen transitions |
| `src/hooks/useAuth.ts` | Re-exports `useAuth` from `AuthContext` |
| `src/services/api.ts` | Supabase RPC fetch (normal + compétitif batch); exports `fetchQuestions`, `fetchCompetitifBatch`, `fetchDailyQuestions`, `ApiError` |
| `src/services/leaderboard.ts` | `submitScore` (via `submit_score` RPC), `getUserBestScore`, `getUserRank`, `getCompLeaderboardPage`, `getCompLeaderboardCount`, `getCompEntryGameData` |
| `src/services/cloudStats.ts` | `incrementCategoryStats`, `incrementGlobalStats` (both RPC-atomic), `addXp`, `getCloudBestScore`, `fetchAllStats` |
| `src/services/achievements.ts` | `getUserAchievements`, `checkAndUnlockAchievements`, `checkAndUnlockDailyAchievements` |
| `src/services/dailyChallenge.ts` | Daily theme fetch, `submitDailyEntry` (RPC), streaks, leaderboard, `getDailyMultiplier`, `computeDailyXp`, `getTodayDate` |
| `src/services/pulses.ts` | `getWallet`, `getRecentTransactions`, `addPulses` (RPC), `getTransactionsSince` |
| `src/services/badges.ts` | `getUserBadges` (unified badge ownership — source `achievement` \| `shop` \| `season` \| `rank`) |
| `src/services/social.ts` | Friendships: `searchUsers`, `sendFriendRequest`, `acceptFriendRequest`, `rejectFriendRequest`, `removeFriendship`, `getFriends`, `getPendingRequests`, `getFriendshipStatus`, `getPendingReceivedCount` |
| `src/services/notifications.ts` | `getNotifications` (last 20), `getUnreadCount`, `markRead`, `markAllRead`, `createNotification`, `getNotificationPrefs`, `updateNotificationPrefs` |
| `src/services/publicProfile.ts` | `getPublicProfile(username)` via RPC `get_public_profile` |
| `src/services/profile.ts` | Account management: `updateUsername`, `updateEmail`, `updatePassword`, `deleteAccount`, `updateDescription`, `updateFeaturedBadges` |
| `src/services/analytics.ts` | PostHog wrapper: `initAnalytics`, `identifyUser`, `trackScreenViewed`, `trackGameStarted/Finished/Abandoned`, `trackUserSignedUp/In` |
| `src/services/errors.ts` | `AppError` class with typed error codes |
| `src/services/supabase.ts` | Supabase client singleton |
| `src/constants/game.ts` | `QUESTION_DURATION`, `NORMAL_MODE_QUESTIONS`, `DAILY_MODE_QUESTIONS`, `COMP_SPEED_TIERS`, `getSpeedTier`, `COMP_PREFETCH_THRESHOLD`, `COMBO_MILESTONES` |
| `src/constants/xp.ts` | `XP_PER_GAME`, `XP_PER_CORRECT`, `XP_PERFECT_BONUS`, `XP_PER_ACHIEVEMENT`, `computeXpGained` |
| `src/constants/pulses.ts` | `PULSES_PER_GAME`, `PULSES_PER_CORRECT_*`, `PULSES_COMP_SCORE_DIVISOR`, `PULSES_PER_ACHIEVEMENT`, `getPulsesStreakBonus`, `computePulsesGained`, source helpers |
| `src/constants/levels.ts` | `getLevelFromXp`, `getXpForLevel`, `getLevelProgress`, `MAX_LEVEL = 50` |
| `src/constants/achievements.ts` | All achievements definitions (id → name/description/icon/tier) |
| `src/constants/achievementColors.ts` | Tier → color/gradient mapping |
| `src/constants/quiz.ts` | `FR_CATEGORIES` list |
| `src/contexts/AuthContext.tsx` | `AuthProvider` — user/profile, `totalXp`, `pulsesBalance`, reward notification bus, pending achievements queue, `bumpXp`/`bumpPulses` optimistic helpers, `triggerAchievementCheck` |
| `src/contexts/ToastContext.tsx` | `ToastProvider` — global toast notifications |
| `src/utils/sounds.ts` | Web Audio API synth sounds; module-level `muted` flag |
| `src/utils/statsStorage.ts` | Local stats (anonymous) + `computeBestStreak(results)` helper |
| `src/utils/shareScore.ts` | Social sharing (copy/Web Share) for compétitif/daily scores |

### Key directories

- `src/components/landing/` — `LandingPage`, `ConnectedLanding`, `GuestLanding`, `ConnectedHeader`, `GuestHeader`, `SettingsModal`, `RulesModal`, `StartButton`, `PlayZoneCard`, `PlayerStatsCard`, `LeaderboardCard`, backgrounds (`FloatingCardsBackground`, `ArenaBackground`, `ConstellationBackground`, `LibraryBackground`, `KnowledgeUniverse`), `podium/` (Podium + scene), `sections/FinalCtaSection`
- `src/components/quiz/` — `QuizContainer`, `QuestionCard`, `AnswerButton`, `TimerBar`, `StreakIndicator`
- `src/components/result/` — `ResultScreen`, `SignupIncentiveBlock`
- `src/components/ranking/` — `RankingRevealScreen` (compétitif leaderboard reveal)
- `src/components/stats/` — `StatsPage` (tabs: stats / leaderboard / daily)
- `src/components/profile/` — `ProfilePage` + `tabs/` (`GeneralTab`, `StatsTab`, `ConfidentialityTab`)
- `src/components/achievements/` — `AchievementsPage`, `AchievementUnlockOverlay`
- `src/components/auth/` — `AuthModal` (login / register)
- `src/components/daily/` — `DailyChallengePage`, `DailyChallengeModal` (nav dropdown)
- `src/components/collection/` — `CollectionPage` (badges & rewards gallery)
- `src/components/social/` — `SocialPage`, `FriendsPanel`
- `src/components/notifications/` — `NotificationBell`
- `src/components/xp/` — `RewardToast`, `XpToast`
- `src/components/share/` — `ShareModal`, `ScoreCard`
- `src/components/shared/` — `MiniBadge`
- `src/components/brand/` — `PulseLogo`
- `src/components/avatar/` — `AvatarDisplay`, `AvatarContainer`, `AvatarPlaceholder`, `AvatarErrorBoundary`
- `src/pages/` — `PublicProfilePage` (slide-in overlay from the right)

## Settings modal (`SettingsModal.tsx`)

Play button → opens `SettingsModal`. Calls `onLaunch()` which triggers the launch animation sequence. Settings persist via `useSettings`.

Settings available:
- **Mode** — `normal` (10 questions) / `compétitif` (speed-based, infinite)
- **Niveau** — `easy` / `medium` / `hard` (ignored in compétitif/daily, which always use `mixed`)
- **Catégorie** — 7 catégories + "Toutes" (ignored in compétitif/daily)
- **Langue** — `'fr'` only
- **Mute** — speaker icon in modal header; calls `setMuted()` from `sounds.ts`

Daily mode is **not** selectable from the modal — it is entered via the dedicated `DailyChallengeModal` (landing nav) which calls `updateTemp({ mode: 'daily', difficulty: 'mixed', category: 'all' })` so it does not clobber persisted normal/compétitif preferences.

## Game modes

- **Normal** : 10 questions, always advances regardless of answer. Score = number correct.
- **Compétitif** : infinite questions (prefetched), ends on first wrong answer or timeout. Score = sum of speed-tier points. Submits to global leaderboard.
- **Daily** : 10 deterministic questions shared by all players for the day. Score = speed-based points (compétitif scoring, infinite-mode shape). One entry per user per day, enforced by `daily_challenge_entries` UNIQUE(user_id, date).

Header shows `X / 10` in normal & daily, just `X` in compétitif.

## Compétitif mode details

- Speed tiers in `COMP_SPEED_TIERS` (`constants/game.ts`). Faster = higher multiplier.
- `getSpeedTier(elapsedSeconds)` used in `useQuiz.ts` for display + scoring.
- Questions fetched in batches via `fetchCompetitifBatch`. Prefetch at `COMP_PREFETCH_THRESHOLD` remaining.
- Post-game: `submitScore` → `getUserRank` → `RankingRevealScreen` with player highlighted.

## Daily challenge

- Shared pool of 10 questions for the date — fetched via RPC deterministically.
- Streaks in `daily_streaks` (current / longest / last_played_date).
- Streak multiplier (for XP) in `getDailyMultiplier` — thresholds 3 → 1.5, 7 → 2, 14 → 2.5, 30 → 3.
- Submission goes through `submit_daily_entry` RPC (SECURITY DEFINER) — computes streak transition server-side, enforces one entry per day.
- Daily-specific achievements live in `checkAndUnlockDailyAchievements`. Rank-based daily achievements (`daily_podium`, `daily_roi_du_jour`) are unlocked by `check_daily_rank_achievements(date)` run server-side (pg_cron suggested, once per day).

## XP & Pulses economy

Two currencies credited at end of game (connected users only):

| Currency | Column / Table | Credit path |
|---|---|---|
| XP | `user_global_stats.total_xp` | `increment_global_stats` (game delta) + `add_xp` (achievement delta, daily bonus) |
| Pulses ◈ | `user_wallet.balance` + ledger in `wallet_transactions` | `add_pulses(amount, source, source_ref)` RPC — atomic insert + upsert |

XP formula — `computeXpGained` in `constants/xp.ts`:
- normal/compétitif : `base(mode) + correct·5 + perfect_bonus(25 if 10/10)`
- compétitif : `correct` is multiplied by the per-answer speed multiplier
- daily : `30 + correct·20`, then × streak multiplier (`computeDailyXp`)

Pulses formula — `computePulsesGained` in `constants/pulses.ts`:
- normal : `10 + correct·3 + streakBonus(maxStreak)`
- compétitif : `15 + floor(score / 33) + streakBonus(maxStreak)`
- daily : `(20 + correct·3 + streakBonus) × streakMultiplier` (rounded, redistributed)

Achievement rewards — `XP_PER_ACHIEVEMENT` / `PULSES_PER_ACHIEVEMENT` (tier-based: common 25/10 · rare 75/30 · epic 200/80 · legendary 500/200).

Balance + XP are optimistic via `bumpXp` / `bumpPulses` on `AuthContext`. `refreshStats` forces a refresh after the unlock animation.

Pulses are **earned only** (games / achievements / daily streak bonuses). They cannot be purchased with real money — ledger-only enforcement in `add_pulses`.

## Levels

`constants/levels.ts` : linear-growth curve, level `N` requires `100·(N−1)·N` XP cumulative. `MAX_LEVEL = 50`. Helpers: `getLevelFromXp`, `getLevelProgress`.

## Notifications

- Table `notifications` stores the last 20 per user (trigger `trim_notifications` prunes on INSERT).
- Types: `achievement_unlocked` · `rank_up` · `rank_down`.
- Prefs in `profiles.notification_prefs` (jsonb). `getNotificationPrefs` / `updateNotificationPrefs`.
- Created client-side in `useGameOrchestration` after the post-game resolves, gated by prefs.

## Social / friends

- Symmetric relation stored once per pair in `friendships` (requester/addressee + `status: pending|accepted|rejected`).
- Reads use `OR(requester_id=me, addressee_id=me)`.
- Only the addressee can UPDATE (accept/reject); either party can DELETE (unfriend / cancel).
- `SocialPage` shows friends + pending requests; search via `searchUsers` on landing header.

## Badges

- `user_badges` unifies badge ownership across sources (`achievement` / `shop` / `season` / `rank`).
- Trigger `sync_achievement_to_badge` copies every insert into `user_achievements` into `user_badges` automatically.
- Featured badges (up to 3) displayed on the leaderboard / public profile via `profiles.featured_badges` (denormalized array of ids).

## Data flow (settings → API)

```
LandingPage → SettingsModal → onLaunch()
  → App.tsx screen: 'launching' → 'quiz'
  → QuizContainer props (gameMode, difficulty, language, category)
  → useQuiz({ gameMode, difficulty, language, category })
  → fetchQuestions / fetchCompetitifBatch / fetchDailyQuestions
  → supabase.rpc('get_random_questions', { p_language, p_difficulty, p_category, p_limit })
```

## Post-game flow

```
useQuiz → onFinished(score, results)
  → useGameOrchestration.handleFinished()
    ├── setGameResult (immediate, optimistic)
    ├── trackGameFinished (PostHog)
    │
    ├── mode === 'daily' → submitDailyEntry + checkAndUnlockDailyAchievements
    │                      + addXp (daily XP) + addPulses + optional toast
    │                      → onDailyComplete() (back to landing + modal)
    │
    ├── mode === 'normal' → getCloudBestScore + incrementCategoryStats
    │                       + incrementGlobalStats (chained) → checkAndUnlockAchievements
    │                       + addXp (achievements) + addPulses + createNotification
    │                       → setScreen('result')
    │
    └── mode === 'compétitif' (+ connected) → submitScore + getUserBestScore + getUserRank
                                              + addPulses (game) + bumpXp
                                              → setScreen('ranking') (RankingRevealScreen)
                                              (achievements, rank_up/down notifs → fire-and-forget)
```

The AchievementUnlockOverlay (`App.tsx`) plays AFTER ranking/result screens — pending XP+Pulses credits are stashed in `pendingRewardsRef` and replayed as a `RewardToast` when the overlay closes.

## Best score persistence

| Context | Storage |
|---|---|
| Not logged in | `localStorage` via `statsStorage.ts` — key: `pulse_stats_{mode}_{difficulty}_{category}` |
| Logged in, normal | Supabase `user_stats` table (`best_score` per mode/difficulty/category) |
| Logged in, compétitif | Supabase `leaderboard` table (best per user/mode/difficulty/language) |
| Logged in, daily | Supabase `daily_challenge_entries` (immutable, 1 per user per date) |

## Supabase

Schéma complet : `scripts/supabase_schema.sql` (source de vérité unique — inclut daily, pulses, badges, social, notifications). Les anciens fichiers par feature (`daily_challenge_schema.sql`, `pulses_schema.sql`, `user_badges.sql`) sont conservés pour référence historique mais redondants.

Tables :
- `profiles` — auth-linked, stores `username` (case-insensitive unique), `featured_badges[]`, `description`, `username_changed`/`avatar_changed`/`description_changed` flags, `notification_prefs` jsonb
- `questions` — quiz bank, fetched via `get_random_questions`
- `leaderboard` — best score per user/mode/difficulty/language (writes gated by `submit_score` RPC)
- `user_stats` — per-user category/mode/difficulty stats
- `user_global_stats` — totals (games, comp_games, streaks, fastest_perfect, `comp_total_score`, `total_xp`)
- `user_achievements` — unlocked achievements
- `user_badges` — unified badge ownership (any source); auto-populated from `user_achievements` via trigger
- `friendships` — symmetric friend relations
- `notifications` — 20 most recent per user (auto-pruned by trigger)
- `daily_themes` — curated theme per date
- `daily_challenge_entries` — one submission per user per date
- `daily_streaks` — current + longest streak per user
- `user_wallet` — Pulses balance + lifetime earned
- `wallet_transactions` — immutable Pulses ledger

RPCs :
- `get_random_questions` — UUID-pivot random selection
- `submit_score` — seul point d'écriture dans `leaderboard` (GREATEST server-side)
- `increment_category_stats` / `increment_global_stats` — atomic upserts, pas de race condition
- `add_xp(amount)` — credit ponctuel d'XP (achievement, daily bonus)
- `add_pulses(amount, source, source_ref)` — ledger + wallet upsert atomique
- `submit_daily_entry` — insert + streak transition + UNIQUE(user_id, date)
- `get_daily_leaderboard(date, offset, limit)` — paginé, jointure profiles
- `check_daily_rank_achievements(date)` — unlock `daily_podium` + `daily_roi_du_jour` en fin de journée
- `get_public_profile(username)` — profil public + stats + rang + achievements (SECURITY DEFINER, accessible anon)
- `delete_user()` — suppression compte complète
- `sync_achievement_to_badge` (trigger) — propage `user_achievements` → `user_badges`
- `trim_notifications` (trigger) — limite à 20 notifications par user
- `update_friendships_updated_at` (trigger) — maintient `updated_at`

Auth : email/password via Supabase Auth. `AuthContext` écoute `onAuthStateChange` et fetch en parallèle (profile, total_xp, wallet).

Realtime : non utilisé — tout est fetch à la demande ou push optimiste via `bumpXp`/`bumpPulses`.

## Sound system (`sounds.ts`)

Web Audio API, no external lib. Functions: `playCorrect()`, `playWrong()`, `playTimeout()`, `playTick()`, plus UI/XP effects. Module-level `muted` flag via `setMuted()` / `getMuted()`.

## Animation conventions

- All animated components use Framer Motion `motion.*` elements
- Question card swaps use `AnimatePresence mode="sync"` with `key={currentIndex}`
- Entry/exit directions are randomized per swap
- Launch sequence: cards converge → global shake → explosion → screen transition
- Reward toast chains: XP counter → Pulses counter → close
- Public profile slides in from the right (spring)

## Tailwind theme

Custom colors in `tailwind.config.js`:
- `game-bg`, `game-card`, `game-border` — dark palette
- `game-success`, `game-danger`, `game-warning` — feedback
- `neon-violet`, `neon-blue`, `neon-cyan`, `neon-pink`, `neon-gold` — accents
- `shadow-neon-*` — glow box-shadows
- Tier-based colors used for achievements/badges in `constants/achievementColors.ts`
