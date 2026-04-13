# Story 8.2 : Cards latérales (Leaderboard + Stats perso) + CTA JOUER

Status: review

> **Epic 8 — Podium & Personnalisation Avatar** (deuxième story). Construit sur Story 8.1 (PodiumScene avec avatar flottant, ConstellationBackground, 4 slots DOM réservés, StartButton masqué/inutilisé).
>
> **Décision produit Luca (2026-04-13)** : Ajouter deux cards flottantes gauche/droite à la landing connectée, inspirées du layout GeoGuessr. Card gauche = Leaderboard compétitif Top 5. Card droite = Stats perso du joueur. L'avatar flotte derrière les cards (z-10 vs z-30 cards). Un bouton JOUER (StartButton existant) est rendu visible et ancré en bas au centre (z-40). Cet ensemble donne une landing "hub" riche sans casser la vue mobile.

---

## Story

En tant que **joueur connecté**,
je veux voir deux cards d'information (leaderboard compétitif et mes stats) encadrant mon avatar sur la landing, avec un bouton JOUER proéminent en bas,
afin d'avoir une vision immédiate du contexte compétitif et de mon profil, et pouvoir lancer une partie en un clic.

---

## Acceptance Criteria

### 1. Card gauche — Leaderboard Compétitif

**Given** je suis connecté sur la landing
**When** la page se charge
**Then** une card est visible sur le côté gauche de l'écran (masquée en `< md`, visible en `md+`)
**And** la card affiche un titre "Classement" ou "Hall of Gloire"
**And** la card liste les 5 premiers du leaderboard compétitif (mode `compétitif`, language `fr`) avec : rang numérique, username, score
**And** si l'utilisateur courant est dans le top 5, son entrée est mise en évidence (background ou couleur différente)
**And** un lien "Voir tout" en bas de la card appelle `onShowStats('leaderboard')` au clic

**Given** le fetch du leaderboard est en cours
**When** la card est rendue
**Then** un skeleton de 5 lignes est affiché à la place des entrées

**Given** le fetch échoue ou retourne une liste vide
**When** la card est rendue
**Then** un message discret "Pas encore de scores" est affiché (pas de crash, pas de toast d'erreur)

### 2. Card droite — Stats perso

**Given** je suis connecté sur la landing
**When** la page se charge
**Then** une card est visible sur le côté droit de l'écran (masquée en `< md`, visible en `md+`)
**And** la card affiche : parties jouées (global), meilleur streak (global), meilleur score normal (max sur toutes catégories/difficultés), meilleur score compétitif (`fr`)
**And** si aucune stat n'existe encore, chaque valeur affiche `—` ou `0` (pas de crash)

**Given** le fetch des stats est en cours
**When** la card est rendue
**Then** un skeleton est affiché à la place des valeurs

### 3. CTA JOUER visible et ancré

**Given** je suis sur la landing connectée (toutes tailles d'écran)
**When** la page est rendue
**Then** le `StartButton` existant est rendu visible, centré horizontalement, ancré en bas de la zone principale (env. 20-25 % depuis le bas)
**And** le bouton est à `z-40` (au-dessus de tout : avatar z-10, cards z-30)
**And** cliquer sur le bouton appelle `onOpenSettings` → ouvre `SettingsModal`

### 4. Profondeur visuelle — avatar derrière les cards

**Given** l'avatar flotte et traverse la zone gauche ou droite de l'écran
**When** il passe sur la zone couverte par une card
**Then** il disparaît visuellement derrière la card (avatar z-10, cards z-30)

### 5. Responsive

**Given** la viewport est inférieure à `md` (< 768px)
**When** la landing s'affiche
**Then** les deux cards sont masquées (`hidden md:block`)
**And** seuls l'avatar flottant et le bouton JOUER sont visibles

**Given** la viewport est `md+` (≥ 768px)
**When** la landing s'affiche
**Then** les deux cards sont visibles de chaque côté sans masquer l'avatar centré

### 6. Qualité

**Given** les fichiers sont modifiés
**When** les gates de qualité sont exécutés
**Then** `npx tsc --noEmit` → 0 erreur TypeScript
**And** `npm run lint` → 0 nouveau warning (delta = 0 vs avant la story)
**And** `npm run build` → succès
**And** `npm run test -- --run` → tous les tests existants passent (zéro régression)

---

## Developer Context

### État du code avant cette story

La landing connectée (`ConnectedLanding.tsx`) rend deux enfants :
1. `ConnectedHeader` — header sticky en haut avec navigation
2. `PodiumScene` — scène full-screen avec avatar flottant + ConstellationBackground

Dans [PodiumScene.tsx](src/components/landing/podium/PodiumScene.tsx) :
- L'avatar (`AvatarContainer`) est dans un wrapper `z-10`
- `onOpenSettings` est reçu mais **inutilisé** (renommé `_onOpenSettings`) → StartButton absent
- 4 slots DOM réservés existent : `data-slot="top-left"`, `data-slot="top-right"`, `data-slot="behind-avatar"`, `data-slot="podium-front"`
- Le slot `podium-front` est vide (devait accueillir StartButton — non implémenté en 8.1)

Dans `ConnectedLanding.tsx`, `onShowStats` est reçu en prop mais **non transmis à PodiumScene** (PodiumScene ne l'accepte pas encore).

---

### Fichiers à modifier

| Fichier | Action |
|---|---|
| [src/components/landing/podium/PodiumScene.tsx](src/components/landing/podium/PodiumScene.tsx) | Ajouter `onShowStats` prop, ajouter les deux cards, rendre StartButton visible dans slot `podium-front`, ajouter z-30 aux cards |
| [src/components/landing/ConnectedLanding.tsx](src/components/landing/ConnectedLanding.tsx) | Passer `onShowStats` à `PodiumScene` |

### Nouveaux fichiers à créer

| Fichier | Description |
|---|---|
| [src/components/landing/LeaderboardCard.tsx](src/components/landing/LeaderboardCard.tsx) | Card gauche — top 5 compétitif |
| [src/components/landing/PlayerStatsCard.tsx](src/components/landing/PlayerStatsCard.tsx) | Card droite — stats personnelles |

---

### Services disponibles — NE PAS recréer

Tous les appels Supabase passent par les services existants. **Ne jamais importer `supabase` directement dans un composant.**

#### `src/services/leaderboard.ts`

```ts
// Top N scores compétitif (mode='compétitif', language='fr')
getCompTopScores(language: Language, limit?: number): Promise<LeaderboardEntry[]>
// → retourne LeaderboardEntry[] : { id, user_id, username, score, updated_at, rank? }

// Meilleur score compétitif d'un user
getUserBestScore(userId: string, language: Language): Promise<number>
```

Utiliser `getCompTopScores('fr', 5)` pour la LeaderboardCard.

#### `src/services/cloudStats.ts`

```ts
// Toutes les stats d'un user
fetchAllStats(userId: string): Promise<{ categories: CloudCategoryStatRow[], global: CloudGlobalStatRow | null }>

// CloudGlobalStatRow : { games_played, total_correct, best_streak, comp_total_score }
// CloudCategoryStatRow : { mode, difficulty, category, best_score, best_streak, ... }
```

Pour la PlayerStatsCard :
- `global.games_played` → parties jouées
- `global.best_streak` → meilleure streak globale
- `max(categories.filter(r => r.mode === 'normal').map(r => r.best_score))` → meilleur score normal
- `getUserBestScore(userId, 'fr')` → meilleur score compétitif (appel séparé, import de `leaderboard.ts`)

#### `src/hooks/useAuth.ts`

```ts
const { user } = useAuth()
// user.id → userId pour passer aux services
```

Utiliser `useAuth()` dans les cards pour obtenir `user.id`. Attention : cards ne renderont que si `user` est présent (le parent `ConnectedBranch` garantit `user !== null`).

---

### Architecture des nouveaux composants

#### `LeaderboardCard.tsx`

```ts
interface Props {
  onShowStats: (tab: 'leaderboard') => void
}
```

- `useAuth()` pour `user.id` (highlight entrée courante)
- `useState` + `useEffect` pour fetch `getCompTopScores('fr', 5)`
- State : `loading: boolean`, `entries: LeaderboardEntry[]`, `error: boolean`
- Médaille emoji ou badge #1/#2/#3 pour les 3 premiers (optionnel, mais appréciable)
- Styling : `bg-game-card border border-game-border rounded-xl` avec backdrop-blur léger

#### `PlayerStatsCard.tsx`

```ts
// Pas de props externes — lit useAuth() et appelle les services directement
```

- `useAuth()` pour `user.id`
- `useState` + `useEffect` pour fetch `fetchAllStats(userId)` + `getUserBestScore(userId, 'fr')` en **parallèle** (`Promise.all`)
- State : `loading: boolean`, `data: { gamesPlayed, bestStreak, bestNormal, bestComp } | null`
- Calcul `bestNormal` : `Math.max(0, ...allStats.categories.filter(r => r.mode === 'normal').map(r => r.best_score))`
- Valeurs affichées : `—` si `0` ou `null` pour indiquer "pas encore joué"

---

### Positionnement dans PodiumScene

```tsx
// Layout : absolute inset-0 overflow-hidden
// Couches z-index :
//   z-0  → fond (radial gradient + ConstellationBackground)
//   z-10 → avatar flottant (déjà en place)
//   z-30 → cards gauche et droite
//   z-40 → StartButton (CTA JOUER)

// Card gauche (md+)
<div className="absolute left-4 top-1/2 z-30 hidden -translate-y-1/2 md:block lg:left-8">
  <LeaderboardCard onShowStats={onShowStats} />
</div>

// Card droite (md+)
<div className="absolute right-4 top-1/2 z-30 hidden -translate-y-1/2 md:block lg:right-8">
  <PlayerStatsCard />
</div>

// CTA JOUER (toutes tailles)
<div className="absolute bottom-[20%] left-1/2 z-40 -translate-x-1/2">
  <StartButton onClick={onOpenSettings} />
</div>
```

**Important** : retirer le `_` devant `onOpenSettings` dans les props de PodiumScene — le paramètre devient utilisé.

---

### Mise à jour de PodiumScene Props

```ts
// Avant (story 8.1)
interface Props {
  isLaunching: boolean
  onOpenSettings: () => void
}

// Après (story 8.2)
interface Props {
  isLaunching: boolean
  onOpenSettings: () => void
  onShowStats: (tab?: 'stats' | 'leaderboard') => void
}
```

Le type de `onShowStats` doit correspondre exactement au type dans [ConnectedLanding.tsx](src/components/landing/ConnectedLanding.tsx) et remonter jusqu'à [App.tsx](src/App.tsx). Vérifier la cohérence.

---

### Mise à jour de ConnectedLanding.tsx

Ajouter `onShowStats` dans les props passées à `PodiumScene` :

```tsx
<PodiumScene
  isLaunching={isLaunching}
  onOpenSettings={onOpenSettings}
  onShowStats={onShowStats}   {/* ← ajouter cette ligne */}
/>
```

---

### Skeleton pattern

Utiliser `animate-pulse` Tailwind pour les squelettes (pas de lib externe) :

```tsx
// Exemple skeleton ligne leaderboard
<div className="animate-pulse flex items-center gap-3 py-2">
  <div className="h-4 w-4 rounded bg-game-border" />
  <div className="h-4 flex-1 rounded bg-game-border" />
  <div className="h-4 w-10 rounded bg-game-border" />
</div>
```

---

### Styling des cards — palette obligatoire

Utiliser exclusivement les couleurs `game-*` et `neon-*` du thème :

```
bg-game-card            → fond de card
border-game-border      → bordure standard
text-white / text-white/60  → texte principal / secondaire
neon-violet / neon-blue / neon-cyan  → accents (titres, highlight, rang #1)
text-yellow-400          → scores compétitif (cohérent avec leaderboard existant)
shadow-neon-violet       → glow subtil sur la card (optionnel)
```

Largeur des cards : `w-60 sm:w-64 md:w-72` — assez compact pour ne pas empiéter sur la zone centrale de l'avatar.

---

### Tests à ajouter

Dans [ConnectedLanding.test.tsx](src/components/landing/ConnectedLanding.test.tsx) (14 tests existants — ne pas casser) :

1. `'ConnectedLanding rend la LeaderboardCard sur desktop'` — vérifier la présence de l'élément avec `getByRole` ou `getByText` (titre card) — mock `getCompTopScores` retournant `[]`
2. `'ConnectedLanding rend la PlayerStatsCard sur desktop'` — similaire, mock `fetchAllStats` + `getUserBestScore`
3. `'ConnectedLanding rend le bouton JOUER visible'` — `getByRole('button', { name: /play/i })` présent dans le DOM
4. Mock requis : `vi.mock('../../services/leaderboard', ...)` et `vi.mock('../../services/cloudStats', ...)` en haut du fichier test

---

### Précédente story — learnings de 8.1

- `useReducedMotion()` doit être respecté : si `reduced = true`, désactiver les animations de flottement (déjà appliqué pour l'avatar)
- L'import de `StartButton` dans PodiumScene doit être depuis `'../StartButton'` (relatif depuis le dossier `podium/`)
- `AvatarContainer` (et non `AvatarDisplay`) est l'export public du dossier `src/components/avatar/` — utiliser uniquement `AvatarContainer`
- `unlockAudio()` dans StartButton est déjà géré — ne pas ajouter de logique audio dans les nouvelles cards

---

### Checklist qualité avant de marquer done

- [x] `npx tsc --noEmit` → 0 erreur
- [x] `npm run lint` → 0 nouveau warning
- [x] `npm run build` → succès
- [x] `npm run test -- --run` → 0 régression (49/49 tests passent en 2.59s)
- [ ] Test visuel `npm run dev` : cards visibles md+, masquées mobile, avatar passe derrière, JOUER cliquable
- [ ] Skeleton visible pendant le fetch (simuler avec slow 3G dans DevTools)
- [ ] État vide (nouveau compte sans stats) → valeurs affichées proprement (`—` ou `0`)

---

## Dev Agent Record

### Fichiers créés / modifiés

| Fichier | Action |
|---|---|
| `src/components/landing/LeaderboardCard.tsx` | **Créé** — card gauche top 5 compétitif, skeleton, médailles, highlight utilisateur courant, CTA "Voir tout" |
| `src/components/landing/PlayerStatsCard.tsx` | **Créé** — card droite stats perso, skeleton, valeurs `—` si vide, CTA "Voir mes stats →" |
| `src/components/landing/PlayZoneCard.tsx` | **Créé** — lobby card centrée (badges mode/difficulté, StartButton, bouton Personnaliser désactivé) |
| `src/components/landing/podium/PodiumScene.tsx` | **Modifié** — ajout props `onShowStats`, LeaderboardCard, PlayerStatsCard, PlayZoneCard (remplace StartButton seul) |
| `src/components/landing/ConnectedLanding.tsx` | **Modifié** — transmission `onShowStats` à PodiumScene |
| `src/components/landing/ConnectedLanding.test.tsx` | **Modifié** — mocks auth/leaderboard/cloudStats, 3 nouveaux tests Story 8.2, `afterEach` flush |
| `src/test/__mocks__/framer-motion.tsx` | **Créé** — stub passthrough sans `vi` (résout les timeouts des tests depuis l'ajout des animations) |
| `vitest.config.ts` | **Modifié** — `resolve.alias` + `fileURLToPath` pour injecter le stub framer-motion globalement |

### Completion Notes

**Implémenté :**
- AC1 : LeaderboardCard (Hall of Gloire) — top 5 compétitif, médailles 🥇🥈🥉, highlight utilisateur, skeleton, état vide, CTA "Voir tout"
- AC2 : PlayerStatsCard (Mes Stats) — parties jouées, meilleur streak, meilleur score normal/compétitif, skeleton, état vide, CTA "Voir mes stats →"
- AC3 : PlayZoneCard centrée — badges mode/difficulté, StartButton, bouton "Personnaliser l'avatar" (bientôt) — résout le sentiment de "page vide"
- AC4 : z-index respectés (avatar z-10, cards z-30, PlayZoneCard z-40)
- AC5 : responsive — cards masquées `< md`, PlayZoneCard visible toutes tailles
- AC6 : tsc 0 erreur, lint 0 warning, 49/49 tests en 2.59s

**Décisions prises pendant l'implémentation :**
- `PlayZoneCard` créé à la demande de Luca (feedback visuel "page vide"), remplace le StartButton nu
- `PlayerStatsCard` reçoit `onShowStats: (tab: 'stats') => void` (ajout demandé par Luca)
- Les deux titres de cards utilisent `text-neon-violet` (alignement couleur demandé par Luca)
- Fix timeouts tests : stub framer-motion via `resolve.alias` dans vitest.config.ts (élimine 130+ animations repeat:Infinity dans jsdom)

### Change Log

- 2026-04-13 : Story 8.2 implémentée — LeaderboardCard, PlayerStatsCard, PlayZoneCard, mise à jour PodiumScene/ConnectedLanding, 3 tests ajoutés, fix global tests framer-motion
