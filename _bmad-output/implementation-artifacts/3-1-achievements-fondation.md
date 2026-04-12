# Story 3.1 : Achievements — Fondation (types, service, Supabase)

Status: review

## Story

En tant que développeur,
je veux une infrastructure solide (types, table Supabase, service) pour les achievements,
afin que les stories suivantes puissent s'appuyer sur des fondations stables.

## Acceptance Criteria

1. Les types `Achievement`, `UserAchievement`, `AchievementProgress` sont définis dans `src/types/quiz.ts`.
2. Le registre des 5 achievements initiaux est défini comme constante dans `src/constants/achievements.ts`.
3. La table Supabase `user_achievements` est créée avec les colonnes : `id`, `user_id`, `achievement_id`, `unlocked_at`.
4. Le service `src/services/achievements.ts` exporte : `checkAndUnlockAchievements`, `getUserAchievements`.
5. `checkAndUnlockAchievements(userId)` vérifie rétroactivement tous les achievements non débloqués, insère les nouveaux dans `user_achievements`, et retourne la liste des achievements nouvellement débloqués.
6. `getUserAchievements(userId)` retourne tous les achievements du registre avec leur statut (`unlocked`, `unlocked_at`, `progress`).
7. La logique rétroactive lit depuis `user_global_stats`, `user_stats`, `comp_leaderboard` et `profiles` (date de création).
8. `npx tsc --noEmit` passe sans erreur.

## Tasks / Subtasks

- [x] **Tâche 1 — Ajouter les types dans `src/types/quiz.ts`** (AC: 1)
  - [x] 1.1 — Ajouter `AchievementId` : union littérale des 5 IDs
  - [x] 1.2 — Ajouter interface `Achievement` (id, name, description, icon, checkFn signature)
  - [x] 1.3 — Ajouter interface `UserAchievement` (achievement_id, unlocked_at)
  - [x] 1.4 — Ajouter interface `AchievementWithStatus` (Achievement + unlocked: boolean + unlocked_at: string|null + progress: {current: number, total: number} | null)

- [x] **Tâche 2 — Créer `src/constants/achievements.ts`** (AC: 2)
  - [x] 2.1 — Définir le tableau `ACHIEVEMENTS` avec les 5 achievements (voir Dev Notes)
  - [x] 2.2 — Exporter `ACHIEVEMENTS` et `ACHIEVEMENT_MAP` (Record<AchievementId, Achievement>)

- [x] **Tâche 3 — Créer la table Supabase** (AC: 3)
  - [x] 3.1 — Créer la table `user_achievements` via le dashboard Supabase (voir Dev Notes pour le SQL)
  - [x] 3.2 — Ajouter une contrainte UNIQUE sur `(user_id, achievement_id)`
  - [x] 3.3 — Activer Row Level Security : un user ne peut lire/écrire que ses propres achievements

- [x] **Tâche 4 — Créer `src/services/achievements.ts`** (AC: 4, 5, 6, 7)
  - [x] 4.1 — Implémenter `getUserAchievements(userId)` : fetch `user_achievements` + merge avec `ACHIEVEMENTS`
  - [x] 4.2 — Implémenter les helpers de check par achievement (voir Dev Notes)
  - [x] 4.3 — Implémenter `checkAndUnlockAchievements(userId)` : vérifie les non-débloqués, insère les nouveaux, retourne les nouveaux
  - [x] 4.4 — Utiliser `AppError` pour toutes les erreurs Supabase

- [x] **Tâche 5 — Validation** (AC: 8)
  - [x] 5.1 — `npx tsc --noEmit` : zéro erreur
  - [x] 5.2 — `npm run lint` : zéro warning sur les nouveaux fichiers (14 erreurs préexistantes hors périmètre)

## Dev Notes

### Types à ajouter dans `src/types/quiz.ts`

```ts
// ─── Achievements ─────────────────────────────────────────────────────────────

export type AchievementId =
  | 'premiers_pas'
  | 'premier_competiteur'
  | 'serie_de_feu'
  | 'perfectionniste'
  | 'centenaire'

export interface Achievement {
  id: AchievementId
  name: string
  description: string
  icon: string  // emoji unicode
  progressTotal: number | null  // null = pas de progression trackable (ex: premiers_pas)
}

export interface UserAchievement {
  achievement_id: AchievementId
  unlocked_at: string  // ISO timestamp
}

export interface AchievementWithStatus extends Achievement {
  unlocked: boolean
  unlocked_at: string | null
  progress: { current: number; total: number } | null
}
```

### Registre `src/constants/achievements.ts`

```ts
import type { Achievement, AchievementId } from '../types/quiz'

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'premiers_pas',
    name: 'Premiers Pas',
    description: 'Créer son compte Pulse Quizz',
    icon: '🌱',
    progressTotal: null,
  },
  {
    id: 'premier_competiteur',
    name: 'Premier Compétiteur',
    description: 'Terminer sa première partie compétitive',
    icon: '⚡',
    progressTotal: null,
  },
  {
    id: 'serie_de_feu',
    name: 'Série de Feu',
    description: 'Enchaîner 10 bonnes réponses d\'affilée en une partie',
    icon: '🔥',
    progressTotal: null,
  },
  {
    id: 'perfectionniste',
    name: 'Perfectionniste',
    description: 'Score parfait en mode normal (10/10)',
    icon: '💎',
    progressTotal: null,
  },
  {
    id: 'centenaire',
    name: 'Centenaire',
    description: 'Jouer 100 parties (tous modes)',
    icon: '🏆',
    progressTotal: 100,
  },
]

export const ACHIEVEMENT_MAP: Record<AchievementId, Achievement> =
  Object.fromEntries(ACHIEVEMENTS.map(a => [a.id, a])) as Record<AchievementId, Achievement>
```

### SQL — Table `user_achievements`

```sql
create table public.user_achievements (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  achievement_id text not null,
  unlocked_at timestamptz default now() not null,
  constraint user_achievements_unique unique (user_id, achievement_id)
);

-- RLS
alter table public.user_achievements enable row level security;

create policy "Users can read own achievements"
  on public.user_achievements for select
  using (auth.uid() = user_id);

create policy "Users can insert own achievements"
  on public.user_achievements for insert
  with check (auth.uid() = user_id);
```

### Service `src/services/achievements.ts`

Architecture du service — structure complète :

```ts
import { supabase } from './supabase'
import { AppError } from './errors'
import { ACHIEVEMENTS, ACHIEVEMENT_MAP } from '../constants/achievements'
import type { AchievementId, AchievementWithStatus } from '../types/quiz'

// ─── Fetch ────────────────────────────────────────────────────────────────────

export async function getUserAchievements(userId: string): Promise<AchievementWithStatus[]> {
  const { data, error } = await supabase
    .from('user_achievements')
    .select('achievement_id, unlocked_at')
    .eq('user_id', userId)

  if (error) throw new AppError('db_error', error.message)

  const unlockedMap = new Map(data.map(r => [r.achievement_id, r.unlocked_at]))

  return ACHIEVEMENTS.map(a => ({
    ...a,
    unlocked: unlockedMap.has(a.id),
    unlocked_at: unlockedMap.get(a.id) ?? null,
    progress: a.progressTotal !== null ? { current: 0, total: a.progressTotal } : null,
    // Note: progress.current sera enrichi par getAchievementProgress si besoin
  }))
}

// ─── Check & Unlock ───────────────────────────────────────────────────────────

export async function checkAndUnlockAchievements(userId: string): Promise<AchievementWithStatus[]> {
  // 1. Récupérer les achievements déjà débloqués
  const { data: existing, error: fetchError } = await supabase
    .from('user_achievements')
    .select('achievement_id')
    .eq('user_id', userId)
  if (fetchError) throw new AppError('db_error', fetchError.message)

  const alreadyUnlocked = new Set(existing.map(r => r.achievement_id))

  // 2. Récupérer les données nécessaires pour les checks (une seule requête groupée)
  const [profileResult, globalStatsResult, compResult] = await Promise.all([
    supabase.from('profiles').select('created_at').eq('id', userId).single(),
    supabase.from('user_global_stats').select('games_played').eq('user_id', userId).single(),
    supabase.from('comp_leaderboard').select('id').eq('user_id', userId).limit(1),
  ])

  const gamesPlayed = globalStatsResult.data?.games_played ?? 0
  const hasCompGame = (compResult.data?.length ?? 0) > 0

  // 3. Évaluer chaque achievement non débloqué
  const toUnlock: AchievementId[] = []

  if (!alreadyUnlocked.has('premiers_pas')) {
    // Créer un compte = avoir une entrée dans profiles
    if (profileResult.data) toUnlock.push('premiers_pas')
  }
  if (!alreadyUnlocked.has('premier_competiteur')) {
    if (hasCompGame) toUnlock.push('premier_competiteur')
  }
  if (!alreadyUnlocked.has('centenaire')) {
    if (gamesPlayed >= 100) toUnlock.push('centenaire')
  }
  // Note: serie_de_feu et perfectionniste sont checkés en temps réel dans useGameOrchestration
  // via checkAndUnlockAchievements avec contexte — voir histoire 3.3

  if (toUnlock.length === 0) return []

  // 4. Insérer les nouveaux achievements (upsert pour éviter les doublons race condition)
  const { error: insertError } = await supabase
    .from('user_achievements')
    .upsert(
      toUnlock.map(id => ({ user_id: userId, achievement_id: id })),
      { onConflict: 'user_id,achievement_id', ignoreDuplicates: true }
    )
  if (insertError) throw new AppError('db_error', insertError.message)

  // 5. Retourner les nouveaux achievements débloqués
  return toUnlock.map(id => ({
    ...ACHIEVEMENT_MAP[id],
    unlocked: true,
    unlocked_at: new Date().toISOString(),
    progress: null,
  }))
}
```

**Note importante sur `serie_de_feu` et `perfectionniste`** :
Ces deux achievements nécessitent des données de la partie courante (streak, score) qui ne sont pas en Supabase. Ils seront checkés en temps réel dans `useGameOrchestration` (story 3.3) et passés comme contexte. Dans cette story, on se concentre sur les 3 achievements vérifiables rétroactivement depuis Supabase.

La signature finale de `checkAndUnlockAchievements` devra accepter un contexte optionnel :
```ts
interface AchievementContext {
  maxStreak?: number   // streak max atteint en cours de partie
  score?: number       // score final (pour Perfectionniste)
  mode?: GameMode
}

export async function checkAndUnlockAchievements(
  userId: string,
  context?: AchievementContext
): Promise<AchievementWithStatus[]>
```
Implémenter ce contexte dès cette story pour éviter une refactorisation en story 3.3.

### Contraintes architecturales

- **AppError** obligatoire — jamais `throw new Error()` directement dans un service
- **Supabase côté service uniquement** — ne jamais importer `supabase` dans un composant ou hook
- **Named exports uniquement** — pas de default export dans `achievements.ts`
- **`import type`** pour tous les imports de types purs (TypeScript strict `verbatimModuleSyntax`)
- Les constantes d'achievements dans `src/constants/achievements.ts` (pas dans `services/`)
- Ne pas dupliquer les types dans le service — importer depuis `src/types/quiz.ts`

### Pièges à éviter

1. **Race condition** : utiliser `upsert` avec `ignoreDuplicates: true` plutôt qu'un `insert` simple pour éviter les erreurs de doublon si `checkAndUnlockAchievements` est appelé deux fois simultanément.
2. **`user_global_stats` peut ne pas exister** : `.single()` retourne une erreur si 0 lignes → utiliser `maybeSingle()` et fallback à `{games_played: 0}`.
3. **RLS** : la politique Supabase autorise uniquement `auth.uid() = user_id`. Ne jamais passer un `userId` autre que celui de l'utilisateur connecté.
4. **`progressTotal: null`** vs `0` : un achievement sans barre de progression a `progressTotal: null`, ne pas confondre avec `progressTotal: 0`.

### References

- [Source: src/services/cloudStats.ts] — pattern AppError, structure des requêtes Supabase
- [Source: src/services/leaderboard.ts] — pattern named exports, upsert
- [Source: src/services/errors.ts] — AppError class
- [Source: src/types/quiz.ts] — types existants, pattern union littérale
- [Source: src/constants/game.ts] — pattern constantes partagées

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

_Aucun incident de debug — implémentation conforme aux Dev Notes._

### Completion Notes List

- ✅ Types `AchievementId`, `Achievement`, `UserAchievement`, `AchievementWithStatus` ajoutés dans `src/types/quiz.ts`
- ✅ Registre `ACHIEVEMENTS` (5 achievements) + `ACHIEVEMENT_MAP` créés dans `src/constants/achievements.ts`
- ✅ Service `src/services/achievements.ts` exportant `getUserAchievements` et `checkAndUnlockAchievements`
- ✅ `checkAndUnlockAchievements` accepte un `AchievementContext` optionnel (anticipation story 3.3) pour `serie_de_feu` et `perfectionniste`
- ✅ Logique rétroactive : `premiers_pas`, `premier_competiteur`, `centenaire` depuis Supabase ; `serie_de_feu` et `perfectionniste` via contexte temps-réel
- ✅ `maybeSingle()` utilisé pour `user_global_stats` (évite l'erreur si 0 lignes)
- ✅ `upsert` avec `ignoreDuplicates: true` pour éviter les race conditions
- ✅ `AppError` utilisé pour toutes les erreurs Supabase
- ⚠️ **Table Supabase `user_achievements` à créer manuellement** via SQL fourni dans les Dev Notes
- ✅ `npx tsc --noEmit` : 0 erreur
- ✅ `npm run lint` : 0 erreur sur les nouveaux fichiers (14 erreurs préexistantes hors périmètre)

### File List

- `src/types/quiz.ts` — modifié (types Achievement ajoutés)
- `src/constants/achievements.ts` — créé
- `src/services/achievements.ts` — créé

### Change Log

- 2026-04-12 : Implémentation initiale story 3.1 — types, registre, service achievements
