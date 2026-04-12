# Story 4.2 : Stats par catégorie — filtre Mixed, bloc "Toutes", labels clarifiants

Status: review

## Story

En tant qu'utilisateur connecté,
je veux pouvoir voir mes stats par catégorie sans avoir à choisir une difficulté spécifique,
et avoir une vue "Toutes catégories" agrégée,
afin de comprendre rapidement où je suis le plus fort, toutes difficultés confondues.

## Contexte technique

**Problème actuel :**
1. Le filtre difficulté dans "Par catégorie" ne propose que `easy / medium / hard` — pas de vue agrégée.
2. `FR_CATEGORIES` inclut `{ value: 'all', label: 'Toutes catégories' }` mais la liste `sorted` filtre explicitement `c.value !== 'all'` (ligne 189 de `StatsPage.tsx`).
3. Rien n'indique visuellement que "Par catégorie" = mode Normal uniquement.

**Périmètre des stats par catégorie :** Mode Normal uniquement (inchangé).
**Pas de modification DB** : agrégation faite côté client.

**État actuel du filtre difficulté :**
- `StatsPage.tsx` ligne 76 : `validInitialDiff = initialDiff && initialDiff !== 'mixed' ? initialDiff : 'easy'` → 'mixed' est activement exclu.
- `DIFFICULTIES` dans `constants/quiz.ts` ne contient pas 'mixed'.
- Le type `Difficulty` dans `types/quiz.ts` — vérifier s'il inclut déjà 'mixed'.

## Acceptance Criteria

1. Un bouton **"Mixte"** (ou "Toutes") est ajouté comme **première option** dans le filtre difficulté de la section "Par catégorie". Il est sélectionné par défaut à l'ouverture de la page stats.
2. En mode "Mixte", les stats d'une catégorie sont la somme des lignes `easy + medium + hard` pour cette catégorie (agrégation côté client).
3. Les métriques agrégées en mode "Mixte" sont : `gamesPlayed`, `totalCorrect`, `totalQuestions`, `bestStreak` (max), `bestScore` (max), `fastestPerfect` (min non-null).
4. Un bloc **"Toutes catégories"** apparaît en tête de liste (avant les catégories individuelles) et affiche les stats agrégées de TOUTES les catégories pour la difficulté sélectionnée.
5. Le bloc "Toutes catégories" suit la même logique d'agrégation client que le filtre Mixte (somme + max + min selon la métrique).
6. Le label de section "Par catégorie" est remplacé par **"Par catégorie · Mode Normal"** pour indiquer clairement que ces stats ne couvrent pas le compétitif.
7. En "Mixte", la métrique "Meilleur score" affiche `X/10` (identique au comportement actuel).
8. `npx tsc --noEmit` et `npm run lint` passent sans erreur.

## Tasks / Subtasks

- [x] **Tâche 1 — Ajouter 'mixed' au type `Difficulty` si absent** (AC: 1)
  - [x] 1.1 — Vérifier dans `src/types/quiz.ts` si `Difficulty` inclut `'mixed'`. Si non, l'ajouter. ✓ Déjà présent.
  - [x] 1.2 — Vérifier dans `constants/quiz.ts` que `DIFFICULTIES` n'est pas utilisé pour des appels API (il ne l'est pas — usage UI uniquement dans `StatsPage`). ✓ Confirmé.

- [x] **Tâche 2 — Ajouter 'Mixte' à la liste de boutons difficulté dans `StatsPage.tsx`** (AC: 1)
  - [x] 2.1 — Créer une constante locale `STATS_DIFFICULTIES` qui prepend `{ value: 'mixed' as Difficulty, label: 'Mixte' }` devant `DIFFICULTIES`. ✓ Ajouté au niveau module.
  - [x] 2.2 — Remplacer `validInitialDiff` (ligne 76) par `initialDiff ?? 'mixed'` pour que le défaut soit 'mixed'. ✓
  - [x] 2.3 — Mettre à jour la valeur initiale de `filterDiff` à `'mixed'`. ✓
  - [x] 2.4 — Rendre le `filterDiff === d.value` actif pour 'mixed' dans le rendu des boutons. ✓ Via `STATS_DIFFICULTIES.map`.

- [x] **Tâche 3 — Fonction d'agrégation des stats** (AC: 2, 3, 5)
  - [x] 3.1 — Créer une fonction helper locale `aggregateCatStats(rows: CloudCategoryStatRow[]): CategoryStats`. ✓ Implémentée avec somme, max, min non-null.
  - [x] 3.2 — Pas de changement dans `cloudRowToCatStats`. ✓

- [x] **Tâche 4 — Mettre à jour `getStats` dans le `useMemo` de `sorted`** (AC: 1, 2, 4)
  - [x] 4.1 — Si `filterDiff === 'mixed'` : chercher toutes les lignes `r.mode === 'normal' && r.category === String(catValue)` et les passer à `aggregateCatStats`. ✓
  - [x] 4.2 — Si `filterDiff !== 'mixed'` : comportement inchangé. ✓

- [x] **Tâche 5 — Ajouter le bloc "Toutes catégories" en tête de liste** (AC: 4, 5)
  - [x] 5.1 — Calcul de `allCatItem` avec `aggregateCatStats` sur toutes les lignes mode normal selon filtre. ✓
  - [x] 5.2 — `allCatItem` placé en première position dans `sorted`. ✓
  - [x] 5.3 — Bloc "Toutes catégories" affiche 3 métriques (`grid-cols-3`) : Meilleur score, Meilleure série, Réussite — pas de `fastestPerfect`. ✓

- [x] **Tâche 6 — Mettre à jour le label de section** (AC: 6)
  - [x] 6.1 — Label remplacé par `"Par catégorie"` + `<span className="text-white/25">· Mode Normal</span>`. ✓

- [x] **Tâche 7 — Retrait de la restriction 'mixed' dans `StatsPage.tsx`** (AC: 1)
  - [x] 7.1 — `validInitialDiff` supprimé ; `filterDiff` initialisé avec `initialDiff ?? 'mixed'`. ✓

## Dev Agent Record

### Completion Notes

- **aggregateCatStats** : fonction pure au niveau module (avant le composant), sépare le calcul d'agrégation de la logique de rendu. Cas vide retourne `EMPTY_CAT_STATS` pour éviter `Math.max(...[])` = `-Infinity`.
- **STATS_DIFFICULTIES** : constante module-level (pas dans le composant) pour éviter une recréation à chaque render.
- **validInitialDiff supprimé** : `initialDiff ?? 'mixed'` permet maintenant de passer 'mixed' depuis `App.tsx` quand les settings sont en mode mixte — comportement corrigé.
- **Bloc "Toutes catégories"** : toujours présent en tête de liste, jamais en opacity-40, affiche `grid-cols-3` avec Meilleur score / Meilleure série / Réussite. En cas de 0 parties, affiche `0/10`, `0×`, `0%`.
- **TypeScript** : `npx tsc --noEmit` passe sans erreur (exit 0). `npm run lint` — les 14 problèmes signalés sont tous préexistants dans d'autres fichiers (LandingPage, QuizContainer, RankingRevealScreen, useQuiz, useTimer) ; aucun introduit par cette story.

## File List

- `src/components/stats/StatsPage.tsx` — modifié (toutes les tâches)

## Change Log

- 2026-04-12 : Implémentation complète de la story 4.2 — filtre Mixte par défaut, bloc "Toutes catégories" agrégé, label "· Mode Normal", suppression de validInitialDiff.

## Notes d'implémentation

- `aggregateCatStats([])` retourne `{ ...EMPTY_CAT_STATS }` (zéro partout).
- Le bloc "Toutes catégories" utilise la même `motion.div` que les autres catégories, mais ne s'assombrit jamais (`opacity-40`) même si `gamesPlayed === 0` — il affiche toujours les métriques (toutes à 0 si aucune partie).
- Pour le bloc "Toutes catégories", ne pas afficher `fastestPerfect` : remplacer la 4e métrique par `Réussite` (`rate%`). Les 3 autres restent `Meilleur score`, `Meilleure série`, `Réussite` — ajuster le `grid-cols-2` si besoin.
- Vérifier que supprimer `validInitialDiff` ne casse pas les props `initialDiff` passées depuis d'autres écrans (chercher les usages de `StatsPage` dans `App.tsx` ou `ProfilePage`).
