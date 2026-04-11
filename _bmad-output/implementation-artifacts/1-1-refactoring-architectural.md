# Story 1.1 : Refactoring Architectural — Désactivation EN, useGameOrchestration, refreshProfile, Vitest

Status: review

## Story

En tant que développeur du projet Pulse Quizz,
je veux appliquer les décisions architecturales issues de la revue d'architecture (2026-04-11),
afin d'éliminer les dettes techniques identifiées et poser des fondations solides pour les futures features.

## Acceptance Criteria

1. L'option anglais est retirée de l'UI (SettingsModal) et la langue par défaut est `'fr'`.
2. `utils/trivia.ts` est supprimé ; `api.ts` ne l'importe plus et ne route plus vers OpenTDB.
3. Un hook `useGameOrchestration` encapsule toute la logique post-jeu extraite de `App.tsx::handleFinished`.
4. `AuthContext` expose `refreshProfile(): Promise<void>` et la valeur est propagée via le contexte.
5. Le type `Category` est simplifié : `number` supprimé (était lié à OpenTDB).
6. La constante `CATEGORIES` (OpenTDB numérique) est retirée de `constants/quiz.ts` ; seul `FR_CATEGORIES` subsiste.
7. Vitest est installé et configuré dans `vite.config.ts`.
8. Au moins deux fichiers de tests existent : `useGameOrchestration.test.ts` et `useQuiz.test.ts`.
9. `npx tsc --noEmit`, `npm run lint`, `npm run build` passent tous sans erreur.

## Tasks / Subtasks

- [x] **Tâche 1 — Désactivation anglais + suppression trivia.ts** (AC: 1, 2, 5, 6)
  - [x] 1.1 — Supprimer `{ value: 'en', label: 'English' }` du tableau `LANGUAGES` dans `src/constants/quiz.ts`
  - [x] 1.2 — Supprimer le tableau `CATEGORIES` (valeurs numériques OpenTDB) de `src/constants/quiz.ts` — conserver `FR_CATEGORIES`, `MODES`, `DIFFICULTIES`, `DIFFICULTY_LABELS`, `MODE_LABELS`, `LANGUAGE_LABELS`, `CATEGORY_LABELS` (recalculer depuis `FR_CATEGORIES`)
  - [x] 1.3 — Modifier `src/types/quiz.ts` : `Language = 'fr'` (supprimer `'en'`) ; `Category = string` (supprimer `number`)
  - [x] 1.4 — Modifier `src/hooks/useSettings.ts` : changer `language: 'en'` → `language: 'fr'` dans `DEFAULTS`
  - [x] 1.5 — Modifier `src/services/api.ts` : supprimer l'import `fetchFromOpenTDB` ; supprimer la branche `if (params.language === 'en')` ; la fonction `fetchQuestions` route désormais directement vers `fetchQuestionsFromSupabase` (conserver le routing conditionnel commenté pour réactivation future)
  - [x] 1.6 — Supprimer `src/utils/trivia.ts`
  - [x] 1.7 — Dans `src/services/api.ts`, corriger le cast `category` : `category === 'all' ? 'all' : category` (le `typeof category === 'number'` n'existe plus)
  - [x] 1.8 — Vérifier que `SettingsModal.tsx` ne référence plus `CATEGORIES` ; adapter l'affichage si nécessaire (ex. `CATEGORY_LABELS` basé sur `FR_CATEGORIES`)
  - [x] 1.9 — Vérifier que `ResultScreen`, `StatsPage` et tout autre consommateur de `CATEGORIES` ou `CATEGORY_LABELS` fonctionne avec les nouvelles données

- [x] **Tâche 2 — Extraction useGameOrchestration** (AC: 3)
  - [x] 2.1 — Créer `src/hooks/useGameOrchestration.ts`
  - [x] 2.2 — Déplacer la logique complète de `handleFinished` (App.tsx lignes 52-124) dans le hook
  - [x] 2.3 — Interface du hook :
    ```ts
    interface UseGameOrchestrationParams {
      settings: GameSettings
      user: User | null
      profile: Profile | null
      setScreen: (s: AppScreen) => void
      setGameResult: (r: GameResult) => void
      setRankingData: (d: RankingData | null) => void
    }
    const { handleFinished } = useGameOrchestration(params)
    ```
  - [x] 2.4 — `handleFinished` dans `App.tsx` devient une simple délégation au hook
  - [x] 2.5 — Les types `GameResult` et `RankingData` déplacés dans `src/types/quiz.ts` (partagés entre App.tsx et useGameOrchestration)

- [x] **Tâche 3 — refreshProfile dans AuthContext** (AC: 4)
  - [x] 3.1 — Ajouter `refreshProfile: () => Promise<void>` à l'interface `AuthContextValue` dans `src/contexts/AuthContext.tsx`
  - [x] 3.2 — Implémenter la fonction : re-fetch `profiles` table pour `user.id` courant, mettre à jour `setProfile`
  - [x] 3.3 — Exposer via `AuthContext.Provider value={{ ..., refreshProfile }}`
  - [x] 3.4 — `useAuth()` (re-export dans `src/hooks/useAuth.ts`) expose automatiquement `refreshProfile` via le contexte — aucun changement nécessaire

- [x] **Tâche 4 — Setup Vitest + tests** (AC: 7, 8)
  - [x] 4.1 — Installer les dépendances : vitest, @vitest/ui, jsdom, @testing-library/react, @testing-library/jest-dom
  - [x] 4.2 — Configurer `vite.config.ts` avec `/// <reference types="vitest" />` et section `test`
  - [x] 4.3 — Créer `src/test/setup.ts` avec `import '@testing-library/jest-dom'`
  - [x] 4.4 — Ajouter dans `package.json` : `"test": "vitest"`, `"test:ui": "vitest --ui"`
  - [x] 4.5 — Créer `src/hooks/useGameOrchestration.test.ts` — 4 cas testés (non connecté, normal connecté, compétitif connecté, erreur réseau)
  - [x] 4.6 — Créer `src/hooks/useQuiz.test.ts` — 4 cas testés (état initial, réponse correcte, mauvaise réponse en compétitif, timeout)

- [x] **Tâche 5 — Validation finale** (AC: 9)
  - [x] 5.1 — `npx tsc --noEmit` : zéro erreur
  - [x] 5.2 — `npm run lint` : 14 problèmes pré-existants (inchangés avant/après ce story), 0 nouveau introduit
  - [x] 5.3 — `npm run build` : build production réussie (498ms)
  - [x] 5.4 — `npm run test` : 8 tests passent (2 fichiers)

## Dev Notes

### Contraintes critiques à ne pas violer

- **Règle service** : Supabase n'est JAMAIS importé dans un composant ou hook métier. `useGameOrchestration` appellera les fonctions de service (`submitScore`, `incrementCategoryStats`, etc.), jamais `supabase` directement.
- **Règle toast** : `useGameOrchestration` ne doit PAS utiliser `useToast()` — les erreurs remontent via le hook, `App.tsx` décide d'afficher un toast. Actuellement `handleFinished` utilise `console.error` ; conserver ce comportement ou remonter l'erreur via état.
- **Type Language** : après la tâche 1.3, `Language = 'fr'` seulement. TypeScript détectera toute utilisation restante de `'en'` — traiter toutes les erreurs TC.
- **Pas de routeur** : `useGameOrchestration` reçoit `setScreen` en paramètre et l'appelle directement — jamais de navigation implicite.
- **TypeScript strict** : verbatimModuleSyntax actif → utiliser `import type` pour les imports de types purs.

### Fichiers touchés par tâche

**Tâche 1 :**
- `src/constants/quiz.ts` — supprimer `CATEGORIES` (OpenTDB), supprimer `'en'` de `LANGUAGES`
- `src/types/quiz.ts` — `Language`, `Category`
- `src/hooks/useSettings.ts` — default `language`
- `src/services/api.ts` — supprimer import trivia, simplifier routing
- `src/utils/trivia.ts` — **SUPPRIMÉ**
- `src/components/landing/SettingsModal.tsx` — vérifier imports `CATEGORIES`
- `src/components/result/ResultScreen.tsx` — vérifier `CATEGORY_LABELS`
- `src/components/stats/StatsPage.tsx` — vérifier `CATEGORIES` ou `CATEGORY_LABELS`

**Tâche 2 :**
- `src/hooks/useGameOrchestration.ts` — **NOUVEAU**
- `src/App.tsx` — simplifier `handleFinished`

**Tâche 3 :**
- `src/contexts/AuthContext.tsx` — ajouter `refreshProfile`

**Tâche 4 :**
- `vite.config.ts` — config test
- `package.json` — scripts test
- `src/test/setup.ts` — **NOUVEAU**
- `src/hooks/useGameOrchestration.test.ts` — **NOUVEAU**
- `src/hooks/useQuiz.test.ts` — **NOUVEAU**

### Pièges à éviter

1. **`CATEGORY_LABELS`** dans `constants/quiz.ts` est actuellement calculé depuis `CATEGORIES` (OpenTDB). Après suppression de `CATEGORIES`, le recalculer depuis `FR_CATEGORIES`. Les clés seront des strings (ex. `'Culture générale'`) au lieu de nombres.

2. **`handleLanguageChange` dans `SettingsModal.tsx`** contient `if (lang === 'fr' && typeof category === 'number') patch.category = 'all'`. Après simplification du type `Category`, ce guard sera inutile — le supprimer proprement.

3. **`fetchQuestionsFromSupabase` dans `api.ts`** a le cast `category === 'all' || typeof category === 'number' ? 'all' : String(category)`. Après suppression de `number`, simplifier en `category === 'all' ? 'all' : category`.

4. **`useSettings.ts`** valide les langues implicitement — si un ancien localStorage contient `language: 'en'`, le `load()` lira cette valeur sans la valider. Ajouter une validation explicite `VALID_LANGUAGES` (comme `VALID_MODES` existant) pour forcer le fallback sur `'fr'`.

5. **Mocking pour les tests** : `api.ts`, `leaderboard.ts`, `cloudStats.ts` font des appels Supabase. Dans `useGameOrchestration.test.ts`, mocker ces imports avec `vi.mock()`. Ne pas mocker le client Supabase directement.

6. **`useQuiz.ts` et les timers** : `useTimer.ts` utilise `setInterval`. Dans `useQuiz.test.ts`, utiliser `vi.useFakeTimers()` pour contrôler le temps.

### Interface complète de useGameOrchestration

```ts
// src/hooks/useGameOrchestration.ts
import type { User } from '@supabase/supabase-js'
import type { AppScreen } from '../App'
import type { GameSettings } from './useSettings'
import type { QuestionResult } from '../types/quiz'

// Ces types peuvent rester dans App.tsx si non partagés ailleurs
interface Profile { username: string }
interface GameResult {
  score: number
  results: QuestionResult[]
  bestScore: number
  isNewBest: boolean
  userRank: number | null
  rankDelta: number | null
}
interface RankingData {
  userRank: number | null
  rankDelta: number | null
  userId: string
  username: string
  userScore: number
}

interface UseGameOrchestrationParams {
  settings: GameSettings
  user: User | null
  profile: Profile | null
  setScreen: (s: AppScreen) => void
  setGameResult: React.Dispatch<React.SetStateAction<GameResult>>
  setRankingData: React.Dispatch<React.SetStateAction<RankingData | null>>
}

export function useGameOrchestration(params: UseGameOrchestrationParams) {
  async function handleFinished(score: number, results: QuestionResult[]): Promise<void> {
    // Logique extraite de App.tsx lignes 52-124
  }
  return { handleFinished }
}
```

### Pattern test recommandé pour useGameOrchestration

```ts
// src/hooks/useGameOrchestration.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../services/cloudStats', () => ({
  getCloudBestScore: vi.fn().mockResolvedValue(0),
  incrementCategoryStats: vi.fn().mockResolvedValue(undefined),
  incrementGlobalStats: vi.fn().mockResolvedValue(undefined),
}))
vi.mock('../services/leaderboard', () => ({
  getUserBestScore: vi.fn().mockResolvedValue(0),
  getUserRank: vi.fn().mockResolvedValue(5),
  submitScore: vi.fn().mockResolvedValue(undefined),
}))
```

### Project Structure Notes

- `useGameOrchestration.ts` → `src/hooks/` (co-localisé avec les autres hooks)
- `useGameOrchestration.test.ts` → `src/hooks/` (co-localisé avec le source)
- `useQuiz.test.ts` → `src/hooks/` (co-localisé)
- `setup.ts` → `src/test/` (dossier dédié pour la config de test)
- `trivia.ts` → supprimé de `src/utils/`
- Aucun nouveau composant UI dans cette story

### Référence d'architecture

- [Source: _bmad-output/planning-artifacts/architecture.md#Décision 1 — Stratégie de langue & sources de données]
- [Source: _bmad-output/planning-artifacts/architecture.md#Décision 2 — Extraction de handleFinished]
- [Source: _bmad-output/planning-artifacts/architecture.md#Décision 3 — AuthContext : extensibilité]
- [Source: _bmad-output/planning-artifacts/architecture.md#Décision 4 — Suppression de trivia.ts]
- [Source: _bmad-output/planning-artifacts/architecture.md#Décision 5 — Qualité & Résilience]
- [Source: _bmad-output/planning-artifacts/architecture.md#Tests Vitest — Emplacement]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

_Aucun blocage majeur. Notes d'implémentation :_
- `vi.mock()` est hoisted par Vitest — les variables top-level ne sont pas accessibles dans la factory. Correction : inline les données directement dans la factory mock.
- `statsLang` était dans les dépendances du `useMemo` de StatsPage — devenu inutile après suppression de la branche CATEGORIES. Supprimé de l'array de dépendances.
- Les 14 erreurs/warnings lint pré-existants (setState in effect, react-refresh, react-hooks/purity) existaient avant ce story et ne font pas partie du scope.

### Completion Notes List

- ✅ T1 — `trivia.ts` supprimé. `api.ts` route exclusivement vers Supabase. `Language = 'fr'`, `Category = 'all' | string`. `CATEGORIES` (OpenTDB) supprimé, `CATEGORY_LABELS` recalculé depuis `FR_CATEGORIES`. `useSettings` valide la langue via `VALID_LANGUAGES`.
- ✅ T2 — `useGameOrchestration.ts` créé avec toute la logique post-jeu. `GameResult` et `RankingData` déplacés dans `types/quiz.ts`. `App.tsx` délègue via une seule ligne.
- ✅ T3 — `refreshProfile()` ajouté à `AuthContextValue`, implémenté, exposé via Provider. `useAuth.ts` inchangé (re-export).
- ✅ T4 — Vitest 3.2.4 installé. `vite.config.ts` configuré avec `/// <reference types="vitest" />`. 8 tests passent sur 2 fichiers.
- ✅ T5 — `tsc --noEmit` : 0 erreur. Build : 498ms. Tests : 8/8. Lint : 14 problèmes pré-existants (0 régressif).

### File List

**Modifiés :**
- src/types/quiz.ts
- src/constants/quiz.ts
- src/hooks/useSettings.ts
- src/services/api.ts
- src/hooks/useQuiz.ts
- src/App.tsx
- src/components/landing/SettingsModal.tsx
- src/components/stats/StatsPage.tsx
- src/contexts/AuthContext.tsx
- vite.config.ts
- package.json

**Créés :**
- src/hooks/useGameOrchestration.ts
- src/hooks/useGameOrchestration.test.ts
- src/hooks/useQuiz.test.ts
- src/test/setup.ts

**Supprimés :**
- src/utils/trivia.ts

### Change Log

- 2026-04-11 — Suppression anglais (Language = 'fr'), CATEGORIES OpenTDB retirées, trivia.ts supprimé, useGameOrchestration extrait, refreshProfile ajouté, Vitest configuré avec 8 tests.
