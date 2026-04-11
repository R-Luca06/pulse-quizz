---
project_name: 'Pulse Quizz'
user_name: 'Luca'
date: '2026-04-11'
sections_completed: ['technology_stack', 'language_rules', 'framework_rules', 'testing_rules', 'quality_rules', 'workflow_rules', 'anti_patterns']
status: 'complete'
rule_count: 42
optimized_for_llm: true
---

# Project Context for AI Agents

_Ce fichier contient les règles critiques et les patterns que les agents AI doivent respecter lors de l'implémentation de code sur ce projet. Focus sur les détails non-évidents._

---

## Stack Technique & Versions

- React 19.2.4 + TypeScript 6.0.2
- Vite 8.0.4 (bundler), plugin-react 6.0.1
- Framer Motion 12.38.0 — seule librairie d'animation autorisée
- Tailwind CSS 3.4.19 — classes utilitaires, pas de CSS custom inline
- Supabase JS 2.103.0 — auth + DB + Storage
- Node types : @types/node 24.12.2

---

## Règles d'Implémentation Critiques

### Règles TypeScript

- `verbatimModuleSyntax` activé → toujours utiliser `import type` pour les imports de types purs
  ```ts
  import type { TriviaQuestion, GameMode } from '../types/quiz'  // ✅
  import { TriviaQuestion } from '../types/quiz'                  // ❌
  ```
- `noUnusedLocals` + `noUnusedParameters` activés → supprimer toute variable/paramètre inutilisé avant commit
- `erasableSyntaxOnly` activé → pas de `const enum`, pas de namespaces
- `target: es2023` → les features ES2023 sont disponibles
- Vérification TypeScript obligatoire après chaque changement : `npx tsc --noEmit`
- Tous les types partagés vivent dans `src/types/quiz.ts` — ne pas dupliquer les types ailleurs
- Interfaces locales à un hook/composant restent dans ce fichier (ex: `QuizSettings`, `UseQuizReturn` dans `useQuiz.ts`)

### Règles React & Architecture

**State machine & navigation**
- Pas de router (React Router, etc.) — la navigation se fait uniquement via `setScreen(screen: AppScreen)` dans `App.tsx`
- Tout nouvel écran = nouvelle valeur dans le type `AppScreen` + cas dans le `AnimatePresence` de `App.tsx`
- L'état global du jeu remonte dans `App.tsx` via callbacks (`onFinished`, `onStart`, etc.)

**Hooks**
- La logique jeu réside dans `useQuiz.ts` — ne pas déplacer de logique dans les composants
- `useSettings` → persistance localStorage via `useSettings.ts`, ne jamais lire/écrire localStorage directement
- `useAuth` → seule source de vérité pour `user` (Supabase)

**Composants**
- Chaque écran a son propre dossier dans `src/components/` (ex: `landing/`, `quiz/`, `result/`)
- Les composants sont default export, nommés en PascalCase, fichier en PascalCase.tsx
- Pas de CSS modules ni styled-components — Tailwind uniquement

**Animations**
- Toutes les transitions utilisent Framer Motion (`motion.*`, `AnimatePresence`)
- Les swaps de question utilisent `AnimatePresence mode="sync"` avec `key={currentIndex}`
- Ne jamais utiliser `transition` ou `animation` CSS pour des transitions d'écran

**Services**
- Appels Supabase → uniquement via les services (`leaderboard.ts`, `cloudStats.ts`, `supabase.ts`)
- Appels API quiz → uniquement via `src/services/api.ts` (ne pas appeler `trivia.ts` directement)

### Règles de Tests

- Aucun framework de test configuré (pas de Vitest, Jest, etc.)
- Vérification de qualité = `npx tsc --noEmit` + `npm run lint` + `npm run build`
- Validation UI = dev server (`npm run dev`) + test manuel dans le navigateur
- Si des tests sont ajoutés : Vitest (cohérent avec Vite), pas Jest

### Qualité du Code & Style

**Nommage**
- Composants React : PascalCase (fichier + export default) — ex: `QuizContainer.tsx`
- Hooks : camelCase préfixé `use` — ex: `useQuiz.ts`, `useSettings.ts`
- Services : camelCase — ex: `api.ts`, `leaderboard.ts`, `cloudStats.ts`
- Constantes partagées : SCREAMING_SNAKE_CASE dans `src/constants/game.ts`
- Types/interfaces : PascalCase dans `src/types/quiz.ts`

**Tailwind**
- Palette obligatoire : `game-bg`, `game-card`, `game-border`, `game-success`, `game-danger`, `game-warning`
- Couleurs accent : `neon-violet`, `neon-blue`, `neon-cyan`, `neon-pink`
- Glows : `shadow-neon-violet`, `shadow-neon-blue`, `shadow-neon-green`, `shadow-neon-red`, `shadow-neon-gold`
- Ne pas utiliser de couleurs Tailwind génériques là où une couleur `game-*` existe

**ESLint (flat config)**
- `eslint-plugin-react-hooks` activé — respecter les règles des hooks (deps arrays complets)
- `eslint-plugin-react-refresh` activé — exports de composants uniquement dans les fichiers composants
- Faire tourner `npm run lint` avant tout commit

**Commentaires**
- Séparateurs de sections avec `// ─── Nom de section ───` (style de `api.ts`)
- Commentaires JSDoc uniquement pour les fonctions de service publiques complexes
- Pas de commentaires évidents sur du code auto-explicatif

### Workflow de Développement

**Commandes essentielles**
- `npm run dev` — serveur dev (localhost:5173)
- `npm run build` — vérifie TypeScript + build Vite
- `npm run lint` — ESLint
- `npx tsc --noEmit` — type-check rapide après chaque modification

**Git**
- Branche principale : `main`
- Commits en français, format : `type: description courte` (ex: `feat: ajouter page profil`)
- Types : `feat`, `fix`, `refactor`, `chore`, `docs`

**Checklist avant commit**
1. `npx tsc --noEmit` → 0 erreur
2. `npm run lint` → 0 warning
3. `npm run build` → si changement architectural

**Supabase**
- Client singleton dans `src/services/supabase.ts` — ne jamais créer un second client
- Variables d'environnement : `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` dans `.env`

### Règles Critiques — Anti-patterns à Éviter

**Navigation**
- ❌ Ne jamais importer React Router ou tout autre router
- ❌ Ne jamais utiliser `window.location` pour naviguer — toujours `setScreen()`

**Stockage & Auth**
- ❌ Ne jamais écrire dans localStorage directement — passer par `useSettings` ou `storage.ts`
- ❌ Ne jamais lire `user` ailleurs que via `useAuth()` — pas de contexte Supabase direct dans les composants
- Persistance des scores : localStorage (anonyme) vs Supabase (connecté) — toujours vérifier `user` avant d'appeler un service Supabase

**API & Données**
- ❌ Ne pas appeler `src/utils/trivia.ts` directement — utiliser `src/services/api.ts`
- `trivia.ts` est legacy et sera supprimé — ne pas étendre ses fonctionnalités
- Le mode compétitif ignore `difficulty` et `category` — ne pas les passer à `fetchCompetitifBatch`
- `Language = 'fr'` route vers Supabase table `questions`, `'en'` vers OpenTDB — ne pas mélanger les sources

**Sons**
- Ne pas créer de nouveaux `AudioContext` — utiliser uniquement les fonctions exportées de `sounds.ts`

**Mode compétitif**
- Le score = somme des points speed-based via `COMP_SPEED_TIERS` — ne pas utiliser le compteur de bonnes réponses
- `getSpeedTier(elapsedSeconds)` est la source de vérité pour les multiplicateurs — ne pas recalculer inline

**PRD actif**
- 

---

## Guidelines d'Utilisation

**Pour les agents AI**
- Lire ce fichier avant toute implémentation de code
- Respecter TOUTES les règles telles que documentées
- En cas de doute, préférer l'option la plus restrictive
- Mettre à jour ce fichier si de nouveaux patterns émergent

**Pour les humains**
- Garder ce fichier lean et focalisé sur les besoins des agents
- Mettre à jour lors de changements de stack technique
- Supprimer les règles devenues évidentes avec le temps

_Dernière mise à jour : 2026-04-11_
