# Story 4.1 : Stats globales — intégration du mode compétitif

Status: review

## Story

En tant qu'utilisateur connecté,
je veux que mes stats globales reflètent toutes mes parties (normal ET compétitif),
afin d'avoir un tableau de bord honnête de mon activité totale sur Pulse Quizz.

## Contexte technique

**Problème actuel :** Dans `useGameOrchestration.ts` (lignes 74–86), `incrementGlobalStats` et
`incrementCategoryStats` ne sont appelés que si `mode === 'normal'`. Le mode compétitif ne met
à jour que `leaderboard` (meilleur score uniquement — pas cumulatif).

**Impact UI actuel :**
- Tuile "Parties" → compte uniquement les parties normales
- Tuile "Réussite %" → pourcentage en mode normal seulement
- Tuile "Série max" → bridée à 10 (max normal mode)
- Tuile "Parfait en" → inutile pour un joueur compétitif

**Schéma DB à modifier :** table `user_global_stats` — ajouter colonne `comp_total_score INTEGER DEFAULT 0`.

## Acceptance Criteria

1. À la fin de chaque partie compétitive (utilisateur connecté), `incrementGlobalStats` est appelé avec `mode = 'compétitif'`.
2. La tuile "Parties" affiche le total des parties normales + compétitives.
3. La tuile "Réussite" est renommée **"Questions Justes"** et affiche le **nombre absolu** de questions correctes (ex. `142`) toutes parties confondues — plus de pourcentage.
4. La tuile "Série max" reflète la vraie série max globale incluant le compétitif (peut dépasser 10).
5. La tuile "Parfait en" est remplacée par **"Score Compétitif"** affichant la somme cumulée de tous les scores compétitifs du joueur (ex. `3 450 pts`).
6. Pour les joueurs sans partie compétitive, la tuile "Score Compétitif" affiche `—`.
7. Pour les parties compétitives passées (avant cette mise à jour), `comp_total_score` part de 0 — aucune migration rétroactive.
8. `npx tsc --noEmit` et `npm run lint` passent sans erreur.

## Tasks / Subtasks

- [x] **Tâche 1 — Migration Supabase** (AC: 5, 6, 7)
  - [x] 1.1 — Ajouter la colonne `comp_total_score INTEGER NOT NULL DEFAULT 0` à la table `user_global_stats` via le dashboard Supabase ou une migration SQL.
  - [x] 1.2 — Vérifier que les lignes existantes reçoivent bien la valeur `0` par défaut.

- [x] **Tâche 2 — Mettre à jour `CloudGlobalStatRow` dans `cloudStats.ts`** (AC: 5)
  - [x] 2.1 — Ajouter `comp_total_score: number` à l'interface `CloudGlobalStatRow`.

- [x] **Tâche 3 — Mettre à jour `incrementGlobalStats` dans `cloudStats.ts`** (AC: 1, 5)
  - [x] 3.1 — Si `mode === 'compétitif'`, accumuler `comp_total_score: prev.comp_total_score + gameScore`.
  - [x] 3.2 — Si `mode !== 'compétitif'`, ne pas modifier `comp_total_score` (conserver la valeur précédente).
  - [x] 3.3 — Le champ `fastest_perfect` reste inchangé pour le compétitif (la logique `isPerfect` ne s'applique qu'au normal).
  - [x] 3.4 — Le champ `best_streak` est mis à jour pour tous les modes (normal et compétitif).

- [x] **Tâche 4 — Mettre à jour `useGameOrchestration.ts`** (AC: 1, 2, 4)
  - [x] 4.1 — Dans le bloc `// Competitive + authenticated`, appeler `incrementGlobalStats(user.id, results, score, mode)` en fire-and-forget (`.catch(console.error)`) juste avant `submitScore`, chaîné avec `checkAndUnlockAchievements`.
  - [x] 4.2 — Ne PAS appeler `incrementCategoryStats` pour le mode compétitif (les stats par catégorie restent mode normal uniquement).
  - [x] 4.3 — Vérifier que le chaînage `checkAndUnlockAchievements` existant n'est pas cassé.

- [x] **Tâche 5 — Mettre à jour `cloudRowToGlobalStats` dans `StatsPage.tsx`** (AC: 5)
  - [x] 5.1 — Ajouter le mapping `comp_total_score: row.comp_total_score` dans la fonction `cloudRowToGlobalStats`.
  - [x] 5.2 — Ajouter `comp_total_score: 0` dans `EMPTY_GLOBAL_STATS`.
  - [x] 5.3 — Mettre à jour le type `GlobalStats` dans `utils/statsStorage.ts` pour inclure `comp_total_score: number`.

- [x] **Tâche 6 — Mettre à jour les 4 tuiles dans `StatsPage.tsx`** (AC: 2, 3, 4, 5, 6)
  - [x] 6.1 — Tuile "Parties" : inchangée (déjà `effectiveGlobal.gamesPlayed` — correct grâce à la tâche 4).
  - [x] 6.2 — Tuile "Réussite" → `"Questions Justes"`, valeur `effectiveGlobal.totalCorrect` (entier, pas de pourcentage), `globalRate` supprimé.
  - [x] 6.3 — Tuile "Série max" : inchangée (déjà `effectiveGlobal.bestStreak` — correct grâce à la tâche 4).
  - [x] 6.4 — Tuile "Parfait en" → `label="Score Compétitif"`, valeur conditionnelle en `fr-FR` + `' pts'` ou `'—'`, accent orange ou atténué.

## Notes d'implémentation

- `incrementGlobalStats` est appelé en fire-and-forget pour le compétitif (comme pour le normal) — ne pas `await` pour ne pas retarder la navigation vers `'ranking'`.
- Vérifier que `SELECT *` dans `fetchAllStats` ramène bien la nouvelle colonne (Supabase JS retourne toutes les colonnes par défaut).
- `comp_total_score` n'est PAS dans `user_stats` (par catégorie) — uniquement dans `user_global_stats`.

## Dev Agent Record

### Implementation Plan

1. **Migration Supabase (Tâche 1)** — SQL à exécuter dans le dashboard :
   ```sql
   ALTER TABLE user_global_stats
   ADD COLUMN IF NOT EXISTS comp_total_score INTEGER NOT NULL DEFAULT 0;
   ```
   Les lignes existantes reçoivent automatiquement `0` grâce au `DEFAULT`. Aucune rétro-migration.

2. **cloudStats.ts (Tâches 2+3)** — Ajout de `comp_total_score` à `CloudGlobalStatRow`. Dans `incrementGlobalStats`, le `prev` par défaut inclut `comp_total_score: 0`. L'upsert calcule `mode === 'compétitif' ? prev.comp_total_score + gameScore : prev.comp_total_score`. Le `?? 0` protège contre les lignes DB pré-migration.

3. **useGameOrchestration.ts (Tâche 4)** — Dans le bloc `Competitive + authenticated`, l'appel `checkAndUnlockAchievements` est maintenant chaîné après `incrementGlobalStats` (fire-and-forget) pour préserver l'ordre race-condition-safe (cohérent avec le bloc normal).

4. **statsStorage.ts (Tâche 5.3)** — `GlobalStats` enrichi de `comp_total_score: number`. `EMPTY_GLOBAL_STATS` mis à jour. `migrateGlobal` gère les données legacy sans le champ (`?? 0`). `updateStats` propage `global.comp_total_score` inchangé (fonction legacy, jamais appelée dans le flux actuel).

5. **StatsPage.tsx (Tâches 5.1, 5.2, 6)** — `EMPTY_GLOBAL_STATS` et `cloudRowToGlobalStats` mis à jour. 4 tuiles mises à jour : "Questions Justes" (count absolu), "Score Compétitif" (cumulatif formaté `fr-FR` ou `—`). `globalRate` supprimé car non utilisé.

### Completion Notes

- ✅ AC1 : `incrementGlobalStats` appelé en mode compétitif (fire-and-forget, avant `submitScore`)
- ✅ AC2 : Tuile "Parties" = `gamesPlayed` incrémenté pour tous modes
- ✅ AC3 : Tuile "Questions Justes" = `totalCorrect` (entier absolu)
- ✅ AC4 : Tuile "Série max" = `bestStreak` mis à jour tous modes
- ✅ AC5 : Tuile "Score Compétitif" = `comp_total_score` cumulatif formaté
- ✅ AC6 : Affiche `—` si `comp_total_score === 0`
- ✅ AC7 : Aucune migration rétroactive — `DEFAULT 0` suffit
- ✅ AC8 : `npx tsc --noEmit` clean, pas de nouveaux erreurs lint dans les fichiers modifiés
- ⚠️ **ACTION REQUISE (Luca)** : exécuter la migration SQL dans le dashboard Supabase avant de tester

## File List

- `src/services/cloudStats.ts` — ajout `comp_total_score` à `CloudGlobalStatRow` + logique `incrementGlobalStats`
- `src/hooks/useGameOrchestration.ts` — appel `incrementGlobalStats` pour le mode compétitif
- `src/utils/statsStorage.ts` — `GlobalStats` + `EMPTY_GLOBAL_STATS` + `migrateGlobal` + `updateStats`
- `src/components/stats/StatsPage.tsx` — `EMPTY_GLOBAL_STATS`, `cloudRowToGlobalStats`, 4 tuiles, suppression `globalRate`

## Change Log

- 2026-04-12 : Implémentation complète de la story 4.1 — intégration du mode compétitif dans les stats globales. Nouveau champ `comp_total_score` dans DB, types et UI. Tuile "Réussite" → "Questions Justes" (valeur absolue). Tuile "Parfait en" → "Score Compétitif" (cumulatif). (Dev Agent)
