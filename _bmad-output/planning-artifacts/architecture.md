---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
lastStep: 8
status: 'complete'
completedAt: '2026-04-11'
lastReviewedAt: '2026-04-13'
lastReviewNote: 'Sync post-livraison Epics 1–3 (PRD 2026-04-12) — arborescence, dettes, décisions D6–D9 ajoutées'
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

Écrans actuels : `'landing' | 'launching' | 'quiz' | 'ranking' | 'result' | 'stats' | 'profile' | 'achievements'`

**Code splitting** : tous les écrans hors `LandingPage` sont lazy-loadés via `React.lazy()` + `Suspense` dans `App.tsx` (bundle initial ~226 KB vs 649 KB avant).

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
Règle stricte : composants et hooks n'appellent jamais Supabase directement.
- `api.ts` — fetch questions (routing langue, FR uniquement)
- `leaderboard.ts` — scores compétitifs, classements, pagination
- `cloudStats.ts` — statistiques personnelles par mode/difficulté/catégorie
- `achievements.ts` — déblocage et lecture achievements utilisateur
- `profile.ts` — gestion compte (username, email, password, suppression)
- `errors.ts` — classe unifiée `AppError`
- `supabase.ts` — singleton client (une seule instance dans toute l'app)

**Auth**
`AuthContext` expose `user`, `profile`, `loading`, `signUp`, `signIn`, `signOut`, `refreshProfile()`, `pendingAchievements`, `clearPendingAchievements`.
`useAuth()` est la seule source de vérité — aucun composant n'accède au client Supabase directement.
Le flux `pendingAchievements` permet de débloquer des achievements depuis `AuthContext` (ex: `premiers_pas` à l'inscription) et de les afficher via `AchievementUnlockOverlay` dans `App.tsx`.

**Provider Tree**
```
ToastProvider → AuthProvider → App
```

### Tensions et Dettes Architecturales

| # | Zone | État |
|---|---|---|
| 1 | `App.tsx` `handleFinished` | ✅ **Résolue** — extraite dans `hooks/useGameOrchestration.ts` |
| 2 | `api.ts` → `trivia.ts` | ✅ **Résolue** — `trivia.ts` supprimé, EN désactivé |
| 3 | `AuthContext.refreshProfile()` | ✅ **Résolue** — exposé dans le contrat (ligne 110 du fichier) |
| 4 | `Category` type | ⚠ Partiellement résolue — simplifié en `string \| 'all'` (plus de `number` OpenTDB) |
| 5 | Error boundaries | ⚠ Partielle — `AvatarErrorBoundary` local existe, mais pas de `ErrorBoundary` global au niveau `App.tsx` (dossier `common/` non créé). Reste à traiter |

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

**Décision B — Tests :** ✅ **Effectif** — Vitest + `@testing-library/react` + `jest-dom` installés. Setup : `src/test/setup.ts`. Commandes : `npm test`, `npm run test:ui`.
Tests actifs : `useQuiz.test.ts`, `useGameOrchestration.test.ts`, `statsStorage.test.ts`, `AvatarDisplay.test.tsx`, `ConnectedLanding.test.tsx`, `LandingPage.test.tsx`, `SettingsModal.test.tsx`.
Qualité gate actuelle : `npx tsc --noEmit` + `npm run lint` + `npm run build` + `npm test`.

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
├── vite.config.ts                # Inclut config Vitest
├── tailwind.config.js
├── tsconfig.json
├── eslint.config.js
│
├── public/
│   └── (assets statiques)
│
├── scripts/
│   └── supabase_schema.sql       # Schéma DB + RLS (inclut blocage leaderboard anonyme)
│
└── src/
    ├── main.tsx                  # Provider tree : ToastProvider → AuthProvider → App
    ├── App.tsx                   # State machine 8 écrans, lazy-load, AnimatePresence
    │
    ├── test/
    │   └── setup.ts              # Setup global Vitest + jest-dom
    │
    ├── types/
    │   └── quiz.ts               # TOUS les types partagés — Category : string | 'all'
    │
    ├── constants/
    │   ├── game.ts               # COMP_SPEED_TIERS, getSpeedTier, FEEDBACK_DURATION…
    │   └── quiz.ts               # Catégories FR, labels UI
    │
    ├── contexts/
    │   ├── AuthContext.tsx       # user, profile, refreshProfile, pendingAchievements
    │   └── ToastContext.tsx      # ToastProvider + useToast()
    │
    ├── hooks/
    │   ├── useQuiz.ts + .test.ts
    │   ├── useGameOrchestration.ts + .test.ts
    │   ├── useTimer.ts
    │   ├── useSettings.ts
    │   └── useAuth.ts            # Wrapper useContext(AuthContext)
    │
    ├── services/
    │   ├── errors.ts             # AppError — classe d'erreur unifiée
    │   ├── supabase.ts           # Singleton client Supabase
    │   ├── api.ts                # Fetch questions — FR uniquement (Supabase RPC)
    │   ├── leaderboard.ts        # Scores compétitifs, classements, pagination
    │   ├── cloudStats.ts         # Stats personnelles par mode/difficulté/catégorie
    │   ├── achievements.ts       # Déblocage + lecture achievements
    │   └── profile.ts            # Username, email, password, deleteAccount
    │
    ├── utils/
    │   ├── sounds.ts             # Web Audio API — playCorrect/Wrong/Timeout/Tick
    │   └── statsStorage.ts + .test.ts
    │       # Best score anonymes + computeBestStreak + isReturningAnonymous()
    │   # trivia.ts → SUPPRIMÉ | storage.ts → jamais créé (fusionné dans statsStorage.ts)
    │
    └── components/
        ├── avatar/                   # Nouveau — Epic 1
        │   ├── AvatarContainer.tsx   # Wrapper lazy + Suspense + ErrorBoundary
        │   ├── AvatarDisplay.tsx + .test.tsx
        │   ├── AvatarPlaceholder.tsx
        │   ├── AvatarErrorBoundary.tsx
        │   ├── types.ts              # Props customisation (future-ready)
        │   └── index.ts
        ├── landing/
        │   ├── LandingPage.tsx + .test.tsx  # Router conditionnel user → Connected/Guest
        │   ├── ConnectedLanding.tsx + .test.tsx
        │   ├── GuestLanding.tsx
        │   ├── ConnectedHeader.tsx
        │   ├── GuestHeader.tsx
        │   ├── ReturningAnonymousBanner.tsx  # FR13/FR14 — détection localStorage
        │   ├── SettingsModal.tsx + .test.tsx
        │   ├── RulesModal.tsx
        │   ├── StartButton.tsx
        │   ├── KnowledgeUniverse.tsx         # Backdrop avatar + floating cards
        │   ├── ArenaBackground.tsx
        │   ├── ConstellationBackground.tsx
        │   ├── LibraryBackground.tsx
        │   └── sections/                      # Sections vitrine (hero + explicatives)
        ├── quiz/
        │   ├── QuizContainer.tsx
        │   ├── QuestionCard.tsx
        │   ├── AnswerButton.tsx
        │   ├── TimerBar.tsx
        │   └── StreakIndicator.tsx
        ├── result/
        │   └── ResultScreen.tsx       # Inclut bloc incitation inscription (FR16)
        ├── ranking/
        │   └── RankingRevealScreen.tsx
        ├── stats/
        │   └── StatsPage.tsx
        ├── profile/
        │   ├── ProfilePage.tsx
        │   └── tabs/ (GeneralTab, StatsTab, ConfidentialityTab)
        ├── achievements/
        │   ├── AchievementsPage.tsx
        │   └── AchievementUnlockOverlay.tsx
        ├── auth/
        │   └── AuthModal.tsx          # defaultTab: 'signin' | 'signup'
        # common/ErrorBoundary.tsx → non créé (dette #5 restante)
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
| Supabase Storage | Avatars personnalisés (Phase 2) — non actif | `services/profile.ts` |
| OpenTDB | Questions EN — **supprimé** | `utils/trivia.ts` (fichier supprimé) |

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

### État d'Implémentation (au 2026-04-13)

| # | Action | État |
|---|---|---|
| 1 | Supprimer `utils/trivia.ts` + désactiver anglais | ✅ Livré |
| 2 | Créer `src/services/errors.ts` (`AppError`) | ✅ Livré |
| 3 | Ajouter `refreshProfile()` à `AuthContext` | ✅ Livré |
| 4 | Extraire `useGameOrchestration` depuis `App.tsx` | ✅ Livré |
| 5 | Configurer Vitest + tests sur hooks critiques | ✅ Livré |
| 6 | Ajouter `ErrorBoundary` global dans `App.tsx` | ⏳ Restant (seul `AvatarErrorBoundary` local existe) |

**Itérations postérieures livrées (PRD 2026-04-12, Epics 1–3) :**
- Composant `avatar/` découplé, lazy-loaded, props-driven
- Landing bifurquée `ConnectedLanding` / `GuestLanding` selon `useAuth()`
- Header enrichi (icônes + labels), navigation Stats/Profil/Achievements
- Page vitrine avec hero, sections explicatives, CTA inscription/connexion
- Blocage compétitif client + RLS Supabase
- Détection joueur anonyme via `statsStorage.isReturningAnonymous()`
- Incitation inscription post-partie normale (ResultScreen)
- Code splitting par écran (`React.lazy` sur 7 écrans — bundle initial 649 KB → 226 KB)

### Décisions architecturales ajoutées post-livraison

**D6 — Code splitting par écran**
Tous les écrans hors `LandingPage` sont lazy-loadés via `React.lazy()` + `Suspense`. Fallback = `bg-game-bg` vide, transitions Framer Motion masquent le flash. Ne pas importer ces écrans en statique ailleurs.

**D7 — Landing bifurquée par authentification**
`LandingPage.tsx` route vers `ConnectedLanding` ou `GuestLanding` selon `user` de `useAuth()`. Chaque branche a son header dédié (`ConnectedHeader` vs `GuestHeader`). Ne pas dupliquer la logique entre branches — extraire en composants partagés si besoin.

**D8 — Autorisation : défense en profondeur**
Accès aux fonctionnalités réservées aux comptes (compétitif, stats cloud, achievements) protégé à DEUX niveaux :
1. **UI client** : option masquée/désactivée, CTA vers `AuthModal`
2. **RLS Supabase** : policies sur `leaderboard`, `user_stats`, `user_global_stats`, `user_achievements` — `INSERT`/`UPDATE` rejetés si `auth.uid() IS NULL` ou `!= user_id`
Ne jamais retirer une des deux couches. Documenté dans `scripts/supabase_schema.sql`.

**D9 — Flux `pendingAchievements` via AuthContext**
Les achievements débloqués hors partie (ex: `premiers_pas` à l'inscription) sont exposés via `AuthContext.pendingAchievements`. `App.tsx` les consomme via `useEffect`, déclenche l'overlay, puis appelle `clearPendingAchievements()`. Évite que `AuthContext` connaisse l'UI.
