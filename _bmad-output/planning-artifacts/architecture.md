---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
lastStep: 8
status: 'complete'
completedAt: '2026-04-11'
inputDocuments:
  - _bmad-output/project-context.md
workflowType: 'architecture'
project_name: 'Pulse Quizz'
user_name: 'Luca'
date: '2026-04-11'
scope: 'architecture-projet-global'
---

# Architecture Decision Document — Pulse Quizz

_Ce document définit l'architecture de référence de Pulse Quizz. Il sert de base solide pour toutes les futures implémentations, peu importe la feature._

---

## Analyse de Contexte Projet

### Architecture Existante

**State Machine (`App.tsx`)**
La navigation est entièrement pilotée par `setScreen(screen: AppScreen)` dans `App.tsx`.
Aucun router externe. Chaque écran est un cas dans `AnimatePresence`.
Règle invariable : tout nouvel écran = nouvelle valeur dans `AppScreen` + cas dans `App.tsx`.

Écrans actuels : `'landing' | 'launching' | 'quiz' | 'ranking' | 'result' | 'stats'`

**Flux de données — Questions**
`language` détermine la source :
- `'en'` → OpenTDB REST API (via `utils/trivia.ts`, wrappé dans `services/api.ts`)
- `'fr'` → Supabase RPC `get_random_questions` (table `questions`)

Ce routing est encapsulé dans `api.ts` — les consommateurs ne connaissent pas la source.

**Persistance des Scores**

| Contexte | Mécanisme |
|---|---|
| Anonyme | `localStorage` via `storage.ts` |
| Connecté, mode normal | Supabase `user_stats` via `cloudStats.ts` |
| Connecté, mode compétitif | Supabase `leaderboard` via `leaderboard.ts` |

**Couche Service**
Quatre services distincts. Règle stricte : composants et hooks n'appellent jamais Supabase directement.
- `api.ts` — fetch questions (routing langue)
- `leaderboard.ts` — scores compétitifs, classements, pagination
- `cloudStats.ts` — statistiques personnelles par mode/difficulté/catégorie
- `supabase.ts` — singleton client (une seule instance dans toute l'app)

**Auth**
`AuthContext` expose `user` (Supabase Auth) et `profile` (table `profiles`, actuellement `username` seul).
`useAuth()` est la seule source de vérité — aucun composant n'accède au client Supabase directement.

**Provider Tree**
```
ToastProvider → AuthProvider → App
```

### Tensions et Dettes Architecturales

| # | Zone | Description |
|---|---|---|
| 1 | `App.tsx` `handleFinished` | Mélange orchestration post-jeu et appels de service directs — candidat à l'extraction |
| 2 | `api.ts` → `trivia.ts` | Import legacy encore actif — doit être absorbé dans `api.ts` puis supprimé |
| 3 | `AuthContext` | Pas de `refreshProfile()` — impossible de propager une mise à jour de profil sans déconnexion |
| 4 | `Category` type | `number \| 'all' \| string` — `string` absorbe tout, perte de sûreté de type |
| 5 | Error boundaries | Absents — erreurs réseau en post-jeu silencieuses (fallback direct vers `result`) |

---

## Stack Technique (Brownfield)

Projet existant — aucune initialisation requise. Stack figée et opérationnelle.

**Runtime & Build**
- React 19.2.4 + TypeScript 6.0.2
- Vite 8.0.4 (bundler) + plugin-react 6.0.1

**UI & Animation**
- Tailwind CSS 3.4.19 — utilitaires uniquement, palette custom `game-*` / `neon-*`
- Framer Motion 12.38.0 — seule librairie d'animation autorisée

**Backend & Auth**
- Supabase JS 2.103.0 — Auth + PostgreSQL + Storage

**Conventions établies**
- TypeScript strict : `verbatimModuleSyntax`, `noUnusedLocals`, `erasableSyntaxOnly`, `target: es2023`
- ESLint flat config : `react-hooks` + `react-refresh`
- Commits en français, format `type: description courte`
- Vérification obligatoire : `npx tsc --noEmit` après chaque changement

---

## Décisions Architecturales Fondamentales

### Décision 1 — Stratégie de langue & sources de données

**Décision :** Désactiver l'anglais immédiatement. Le produit se concentre sur le français (Supabase) en source unique.
L'anglais sera réactivé quand les questions EN seront disponibles dans Supabase.

**Rationale :** Éliminer la dépendance à OpenTDB dès maintenant. Une seule source de données = une seule couche à maintenir, zéro gestion de rate-limit externe.

**Impacts immédiats :**
- `language: 'en'` retiré de `SettingsModal` (option supprimée de l'UI)
- `utils/trivia.ts` → **supprimer immédiatement** (code mort)
- `api.ts` : garder le routing langue pour la réactivation future, mais seul `'fr'` est actif
- `useSettings.ts` : valeur par défaut `language: 'fr'`
- `Category` type : simplifier en `string | 'all'` (suppression du `number` OpenTDB)

### Décision 2 — Extraction de `handleFinished`

**Décision :** Extraire la logique post-jeu dans un hook `useGameOrchestration`.

**Rationale :** Cohérent avec le pattern existant — la logique métier vit dans des hooks, pas dans `App.tsx`. L'extraction rend la logique testable isolément et allège `App.tsx` à son rôle d'orchestrateur d'écrans.

**Interface cible :**
```ts
const { handleFinished } = useGameOrchestration({
  settings, user, profile, setScreen, setGameResult, setRankingData
})
```

### Décision 3 — AuthContext : extensibilité

**Décision :** Ajouter `refreshProfile()` au contrat de `AuthContext`.

**Rationale :** Toute future feature modifiant le profil peut propager les changements sans déconnexion/reconnexion.

**Ajout au contrat `AuthContextValue` :**
```ts
refreshProfile: () => Promise<void>
```

### Décision 4 — Suppression de `trivia.ts`

**Décision :** Supprimer `utils/trivia.ts` en même temps que la désactivation de l'anglais.

**Rationale :** Avec l'anglais désactivé, le fichier est code mort. Le conserver crée de la confusion et maintient une dépendance externe inutile.

### Décision 5 — Qualité & Résilience

**Décision A — ErrorBoundary :** Ajouter un composant `ErrorBoundary` au niveau `App.tsx` pour capturer les pannes inattendues et afficher un état d'erreur contrôlé.

**Décision B — Tests :** Adopter Vitest comme framework de test (cohérent avec Vite).
Priorité : hooks critiques (`useQuiz`, `useGameOrchestration` une fois extrait).
Qualité gate actuelle conservée : `npx tsc --noEmit` + `npm run lint` + `npm run build`.

---

## Patterns d'Implémentation & Règles de Cohérence

### Ajout d'un nouvel écran

Séquence obligatoire, dans cet ordre :
1. Ajouter la valeur dans `AppScreen` (`App.tsx`)
2. Créer `src/components/{screen-name}/` (kebab-case du nom d'écran)
3. Fichier principal : `{ScreenName}Page.tsx` ou `{ScreenName}Screen.tsx` (PascalCase, default export)
4. Ajouter le cas dans `AnimatePresence` de `App.tsx` avec `motion.div`
5. Transitions cohérentes avec les écrans voisins dans le flux

Tout écran expose ses callbacks vers le haut via props (`onBack`, `onDone`, etc.) — jamais de `setScreen` appelé directement depuis un composant d'écran.

### Ajout d'un nouveau service

```ts
// src/services/{domain}.ts
// ─── Exports nommés uniquement, pas de default export ──────────────────────
// Fonctions async, erreurs propagées via throw (jamais avalées)
// Pas de console.log dans les services — les erreurs remontent au caller
// Supabase appelé uniquement ici, jamais dans les composants ou hooks

export async function doSomething(params: Params): Promise<Result> {
  const { data, error } = await supabase.from('table').select(...)
  if (error) throw new AppError('db_error', error.message)
  return data
}
```

### Gestion d'erreur unifiée — `AppError`

Classe unique dans `src/services/errors.ts` :

```ts
export class AppError extends Error {
  readonly code:
    | 'rate_limit' | 'api_error' | 'network_error'
    | 'db_error' | 'auth_error' | 'not_found' | 'validation_error'
  constructor(code: AppErrorCode, message?: string) {
    super(message ?? code)
    this.name = 'AppError'
    this.code = code
  }
}
export type AppErrorCode = AppError['code']
```

- `ApiError` est remplacé progressivement par `AppError`
- Tous les nouveaux services utilisent `AppError`
- Discrimination : `err instanceof AppError && err.code === 'db_error'`

### Tests Vitest — Emplacement

Co-localisés, à côté du fichier source :
```
src/hooks/useQuiz.ts
src/hooks/useQuiz.test.ts
src/hooks/useGameOrchestration.ts
src/hooks/useGameOrchestration.test.ts
```

Nommage : `{filename}.test.ts` (logique pure) ou `{filename}.test.tsx` (composants).
Priorité des tests : hooks métier (`useQuiz`, `useGameOrchestration`), puis services.

### Toasts — Règle d'usage

`ToastContext` est appelé **uniquement depuis les composants ou `App.tsx`**.
Jamais depuis un service ou un hook métier — les erreurs remontent via `throw`, le composant décide d'afficher un toast.

### Supabase Realtime

**Interdit** sans décision architecturale explicite documentée ici.
Raison : les abonnements nécessitent une gestion de cycle de vie rigoureuse. Le chargement à la demande est la stratégie actuelle et suffit.

### Nouveaux types

- Types **partagés entre plusieurs fichiers** → `src/types/quiz.ts`
- Types **locaux à un hook ou service** → dans le fichier lui-même
- Jamais de duplication de types entre fichiers

### Pattern loading state dans les composants

```ts
const [loading, setLoading] = useState(false)
const [error, setError] = useState<string | null>(null)

setError(null)
setLoading(true)
try { ... } catch (err) {
  setError(err instanceof AppError ? err.message : 'Erreur inattendue')
} finally {
  setLoading(false)
}
```

---

## Structure du Projet & Frontières Architecturales

### Arborescence Cible

```
pulse-quizz/
├── .env                          # Variables Supabase (non committé)
├── .env.example                  # Template variables d'environnement
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
├── eslint.config.js
│
├── public/
│   └── (assets statiques)
│
└── src/
    ├── main.tsx                  # Provider tree : ToastProvider → AuthProvider → App
    ├── App.tsx                   # State machine écrans, AnimatePresence, AppScreen type
    │
    ├── types/
    │   └── quiz.ts               # TOUS les types partagés — Category : string | 'all'
    │
    ├── constants/
    │   ├── game.ts               # COMP_SPEED_TIERS, getSpeedTier, FEEDBACK_DURATION…
    │   └── quiz.ts               # Catégories FR, labels UI
    │
    ├── contexts/
    │   ├── AuthContext.tsx       # AuthProvider + useAuth() — expose refreshProfile()
    │   └── ToastContext.tsx      # ToastProvider + useToast()
    │
    ├── hooks/
    │   ├── useQuiz.ts            # Logique de jeu complète
    │   ├── useQuiz.test.ts       # Tests Vitest — priorité haute
    │   ├── useGameOrchestration.ts   # Extrait de handleFinished (App.tsx)
    │   ├── useGameOrchestration.test.ts
    │   ├── useTimer.ts           # Countdown 10s, 100ms tick
    │   ├── useSettings.ts        # Persistance settings localStorage
    │   └── useAuth.ts            # Wrapper useContext(AuthContext)
    │
    ├── services/
    │   ├── errors.ts             # AppError — classe d'erreur unifiée
    │   ├── supabase.ts           # Singleton client Supabase
    │   ├── api.ts                # Fetch questions — routing langue (fr → Supabase)
    │   ├── api.test.ts
    │   ├── leaderboard.ts        # Scores compétitifs, classements, pagination
    │   └── cloudStats.ts        # Stats personnelles par mode/difficulté/catégorie
    │
    ├── utils/
    │   ├── sounds.ts             # Web Audio API — playCorrect/Wrong/Timeout/Tick
    │   ├── storage.ts            # getBestScore/saveBestScore localStorage (anonymes)
    │   └── statsStorage.ts      # computeBestStreak(results)
    │   # trivia.ts → SUPPRIMÉ
    │
    └── components/
        ├── landing/
        │   ├── LandingPage.tsx
        │   ├── SettingsModal.tsx
        │   ├── RulesModal.tsx
        │   ├── FloatingCardsBackground.tsx
        │   └── StartButton.tsx
        ├── quiz/
        │   ├── QuizContainer.tsx
        │   ├── QuestionCard.tsx
        │   ├── AnswerButton.tsx
        │   ├── TimerBar.tsx
        │   └── StreakIndicator.tsx
        ├── result/
        │   └── ResultScreen.tsx
        ├── ranking/
        │   └── RankingRevealScreen.tsx
        ├── stats/
        │   └── StatsPage.tsx
        ├── auth/
        │   └── AuthModal.tsx
        └── common/              # Composants partagés entre plusieurs écrans
            └── ErrorBoundary.tsx
```

### Frontières Architecturales

**Frontière Navigation**
```
App.tsx (setScreen) ──→ Composants d'écran (props callbacks)
         ↑
         └── useGameOrchestration (logique post-jeu)
```
Règle : aucun composant d'écran n'appelle `setScreen` directement — ils exposent `onBack`, `onDone`, etc.

**Frontière Service**
```
Composants / Hooks
      ↓ (appels de fonctions)
   Services (api.ts, leaderboard.ts, cloudStats.ts)
      ↓ (uniquement ici)
   Supabase / (futur EN)
```
Règle : Supabase n'est jamais importé dans un composant ou hook métier.

**Frontière Auth**
```
Composants ──→ useAuth() ──→ AuthContext
                                ↓
                           supabase.auth + profiles table
```
Règle : `useAuth()` est la seule source de vérité pour `user` et `profile`.

**Frontière Données**
```
language: 'fr' ──→ Supabase RPC get_random_questions
language: 'en' ──→ DÉSACTIVÉ (réactivation future via Supabase)
```
Routing encapsulé dans `api.ts`.

### Flux de données complet

```
Settings (useSettings) ──→ App.tsx ──→ QuizContainer ──→ useQuiz
                                                              ↓
                                              api.ts (fetchQuestions)
                                                              ↓
                                         Supabase RPC (fr uniquement)
                                                              ↓
                                         onFinished(score, results)
                                                              ↓
                                      useGameOrchestration (App.tsx)
                                         ↙              ↘
                              leaderboard.ts        cloudStats.ts
                                         ↘              ↙
                                      setScreen('ranking'|'result')
```

### Points d'intégration externes

| Service | Usage | Fichier |
|---|---|---|
| Supabase Auth | Inscription / connexion | `AuthContext.tsx` |
| Supabase DB | Questions FR, leaderboard, stats | `services/*.ts` |
| Supabase Storage | Avatars (futur) | `services/profile.ts` (futur) |
| OpenTDB | Questions EN — **désactivé** | `api.ts` (code conservé, non actif) |

---

## Validation de l'Architecture

### Cohérence ✅

- Stack sans conflit de versions — en production depuis le départ
- Décisions mutuellement compatibles : `AppError` (migration progressive), `useGameOrchestration` (pattern hook), `refreshProfile()` (extension `AuthContext`)
- Frontières clairement délimitées — aucun chevauchement de responsabilités

### Couverture des besoins ✅

| Besoin | Couverture architecturale |
|---|---|
| Navigation sans router | State machine + `setScreen` documenté |
| Isolation logique de jeu | `useQuiz` + `useGameOrchestration` |
| Source de données unique (FR) | Décision 1 — anglais désactivé |
| Erreurs structurées | `AppError` dans `errors.ts` |
| Auth extensible | `refreshProfile()` dans `AuthContext` |
| Résilience | `ErrorBoundary` dans `common/` |
| Qualité & tests | Vitest co-localisé, gate TypeScript |

### Gaps non bloquants

- Schéma Supabase non documenté ici — tables existantes à inférer du code actuel
- Interface complète de `useGameOrchestration` à spécifier lors de la story d'implémentation
- Config Vitest dans `vite.config.ts` à ajouter lors des premiers tests

### Checklist de Complétude

- [x] Contexte projet analysé et dettes documentées
- [x] Stack technique établie
- [x] Décisions fondamentales prises (langue, erreurs, auth, tests, orchestration)
- [x] Patterns d'implémentation définis
- [x] Structure cible complète
- [x] Frontières architecturales délimitées
- [x] Flux de données documenté

### Priorisation des Premières Implémentations

1. Supprimer `utils/trivia.ts` + désactiver anglais dans UI
2. Créer `src/services/errors.ts` (`AppError`)
3. Ajouter `refreshProfile()` à `AuthContext`
4. Extraire `useGameOrchestration` depuis `App.tsx`
5. Configurer Vitest + premiers tests sur `useQuiz`
6. Ajouter `ErrorBoundary` dans `App.tsx`
