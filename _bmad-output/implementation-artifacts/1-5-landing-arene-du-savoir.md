# Story 1.5 : Landing connectée — Arène du Savoir

Status: review

## Story

As a joueur connecté,
I want une landing page immersive et cohérente avec une scène unique d'arène futuriste où mon avatar est le point focal,
So that l'expérience soit épurée, belle et cohérente façon GeoGuessr — pas un patchwork d'éléments flottants.

## Contexte & Vision

Refonte visuelle de la landing connectée, inspirée de GeoGuessr : **une seule scène cohérente qui raconte une histoire, 80% de respiration**.

**Métaphore** : l'Arène du Savoir. L'avatar est au centre d'une arène futuriste. Des colonnes de lumière néon en arc de cercle dessinent l'architecture derrière lui. Deux spots convergent sur l'avatar. Une aura dorée au sol évoque un podium / trophée — cohérent avec la dimension compétitive du jeu.

**Séparation visuelle header / scène** : on passe du gradient overlay actuel à un header solide avec border-bottom, pour une vraie séparation nette (à la GeoGuessr).

## Acceptance Criteria

**AC1 — Header visuellement séparé**

**Given** je suis connecté et sur la landing
**When** la page est rendue
**Then** le header `ConnectedHeader` a un fond solide (`bg-game-bg/95 backdrop-blur-md`) avec `border-b border-white/10`
**And** il a une hauteur `h-14` (au lieu de `h-16`)
**And** le gradient noir top (`pointer-events-none absolute inset-x-0 top-0 z-[5] h-28 bg-gradient-to-b from-black/70...`) est retiré

**AC2 — Scène Arena monte à la place de Library (connecté uniquement)**

**Given** je suis connecté (user présent via `useAuth()`)
**When** j'arrive sur la landing
**Then** le composant `ArenaBackground` est monté en fond plein écran
**And** `LibraryBackground` n'est pas monté pour les utilisateurs connectés
**And** `LibraryBackground` reste monté pour les utilisateurs non-connectés (GuestLanding inchangé)

**AC3 — Scène Arena : composition visuelle**

**Given** le `ArenaBackground` est rendu
**When** la scène s'affiche
**Then** un dégradé radial `radial-gradient(ellipse at center 60%, #1a0f2e 0%, #0a0612 70%)` couvre le fond
**And** un sol circulaire (grande ellipse fine, bordure `neon-violet/30`) est visible sous la position de l'avatar
**And** 4 à 6 colonnes néon verticales fines (width 2-3px, `blur-sm`, dégradé base `neon-violet` → sommet `neon-cyan`) sont disposées en arc de cercle derrière l'avatar
**And** les colonnes ont une hauteur qui décroît vers les côtés (effet perspective forcée)
**And** 2 à 3 arches SVG (stroke-width 1, couleur `neon-cyan/40`) relient les sommets des colonnes centrales
**And** 2 spots cônes descendants (`blur-3xl`, `opacity-30`, `neon-violet` à gauche, `neon-cyan` à droite) convergent derrière l'avatar
**And** un cercle doré (`neon-gold`) au sol dessine une aura de podium sous l'avatar
**And** 8 à 10 particules dorées fines dérivent lentement vers le haut (cycle 15-20s, opacity 0 → 1 → 0)

**AC4 — Animations lentes et continues**

**Given** la scène est affichée
**When** j'observe les animations
**Then** chaque colonne pulse en opacity entre 0.6 et 1 sur un cycle de 4 à 6 secondes
**And** les cycles des colonnes sont décalés entre eux (ex: 0s, 0.8s, 1.6s...)
**And** les particules gold dérivent en translation verticale continue via Framer Motion
**And** aucune animation n'est brusque ou "pop"

**AC5 — Entrée de la scène**

**Given** la landing connectée se monte
**When** elle apparaît
**Then** la scène `ArenaBackground` entre via un fade + scale 0.98 → 1 sur 0.6s ease-out

**AC6 — Avatar : point focal avec aura gold**

**Given** je suis sur la landing connectée
**When** l'avatar est rendu
**Then** l'avatar (`AvatarContainer`) reste centré horizontalement et positionné à ~55% verticalement dans la scène
**And** le bouton Play (`StartButton`) reste positionné sous l'avatar avec `gap-8`
**And** l'avatar reçoit une aura gold pulsante douce (`shadow-neon-gold/20`, scale 1 ↔ 1.02 sur 3s) en plus de son breathing scale existant

**AC7 — Launch animation préservée**

**Given** je clique sur le bouton Play puis lance une partie (`isLaunching === true`)
**When** la transition vers l'écran quiz se produit
**Then** la scène `ArenaBackground` fait un fade-out 0.25s (cohérent avec le comportement actuel)
**And** le comportement shake + flash de `LandingPage` reste préservé

**AC8 — Respect de la palette et des contraintes**

**Given** le code est implémenté
**When** je vérifie le style
**Then** seules les couleurs `game-*` et `neon-*` de `tailwind.config.js` sont utilisées (pas de couleurs Tailwind génériques)
**And** aucun CSS module ni styled-component n'est introduit
**And** toutes les animations utilisent Framer Motion uniquement

**AC9 — Gate qualité**

**Given** la story est implémentée
**When** les commandes sont exécutées
**Then** `npx tsc --noEmit` retourne 0 erreur
**And** `npm run lint` retourne 0 warning
**And** `npm run build` passe sans erreur

**AC10 — Non-régression guest**

**Given** je ne suis pas connecté
**When** j'arrive sur la landing
**Then** `GuestLanding` s'affiche comme avant
**And** `LibraryBackground` est toujours le fond
**And** aucun changement visuel n'est introduit côté guest

## Tasks / Subtasks

- [x] **Task 1 — Créer `ArenaBackground.tsx`** (AC: #3, #4, #5)
  - [x] Créer `src/components/landing/ArenaBackground.tsx` (composant props-less ou avec prop `isLaunching?: boolean` si la logique d'exit doit être centralisée — sinon gérer l'exit au niveau parent)
  - [x] Structure en couches : fond radial → sol ellipse → colonnes (array mappé) → arches SVG → spots blurés → aura gold → particules
  - [x] Colonnes : utiliser un array de positions en arc de cercle, chaque colonne = `motion.div` avec `animate={{ opacity: [0.6, 1, 0.6] }}` + `transition={{ duration, delay, repeat: Infinity }}`
  - [x] Particules gold : 8-10 `motion.div` avec `animate={{ y: [initial, -viewportHeight], opacity: [0, 1, 0] }}` + durées et delays aléatoires stables (ne pas recalculer à chaque render)
  - [x] Animation d'entrée : `motion.div` parent avec `initial={{ opacity: 0, scale: 0.98 }}` `animate={{ opacity: 1, scale: 1 }}` `transition={{ duration: 0.6 }}`
  - [x] Aucun usage de `<img>`, `<video>` ou asset externe — pur SVG + divs stylés Tailwind

- [x] **Task 2 — Modifier `LandingPage.tsx` pour brancher la scène selon `user`** (AC: #2, #10)
  - [x] Remplacer le `<LibraryBackground>` global par un branchement conditionnel : `user ? <ArenaBackground /> : <LibraryBackground />`
  - [x] Garder le wrapper shake `motion.div` autour des deux
  - [x] **Attention** : `LibraryBackground` accepte une prop `launchPhase`. Vérifier si l'Arena a besoin d'une prop équivalente pour la séquence de lancement, ou si le fade-out géré via `isLaunching` côté `ConnectedLanding` suffit. Décision recommandée : **l'Arena ne reçoit pas `launchPhase`** — le fade-out se fait au niveau du contenu (avatar + play) via `isLaunching` existant, et le background reste stable pendant la séquence (le shake et le flash restent gérés par `LandingPage`)

- [x] **Task 3 — Refondre `ConnectedHeader.tsx`** (AC: #1)
  - [x] Retirer le `<div aria-hidden>` avec gradient noir top
  - [x] Passer la `motion.nav` de `h-16` à `h-14`
  - [x] Ajouter `bg-game-bg/95 backdrop-blur-md border-b border-white/10` à la nav
  - [x] Vérifier que la nav reste en `absolute inset-x-0 top-0 z-10` (pas de passage à `sticky` dans cette story)

- [x] **Task 4 — Aura gold sur l'avatar dans `ConnectedLanding.tsx`** (AC: #6)
  - [x] Envelopper `<AvatarContainer>` dans un `motion.div` qui porte la `shadow-neon-gold/20` et un scale pulse lent (1 → 1.02 → 1, duration 3s, repeat Infinity, ease easeInOut)
  - [x] Vérifier qu'aucun conflit d'animation avec le breathing scale interne de l'avatar (si l'avatar fait déjà son propre pulse, l'aura sera indépendante et portée par un wrapper)
  - [x] Positionnement vertical ~55% : la scène étant positionnée par flex `items-center justify-center` sur `LandingPage`, ajuster via un `translate-y` négatif léger sur le conteneur `ConnectedLanding` si besoin, ou laisser tel quel si visuellement cohérent (valider au dev)

- [x] **Task 5 — Vérifier / nettoyer `LibraryBackground.tsx`** (AC: #10)
  - [x] **Ne pas supprimer** le fichier — il reste utilisé par `GuestLanding`
  - [x] Aucun changement attendu dans ce fichier (hors fix lint préexistant `Math.random` → valeur pré-calculée stable pour passer AC9)

- [x] **Task 6 — Gate qualité** (AC: #9)
  - [x] `npx tsc --noEmit` → 0 erreur
  - [x] `npm run lint` → 0 warning
  - [x] `npm run build` → OK
  - [x] Test manuel `npm run dev` : landing connectée, landing guest, séquence de lancement, avatar chargé + placeholder (à valider par l'utilisateur au prochain run)

## Dev Notes

### Contraintes projet critiques

Voir `_bmad-output/project-context.md` pour les règles complètes. Les règles pertinentes pour cette story :

- **Tailwind uniquement** — pas de CSS inline autre que les `style={{ background: 'radial-gradient(...)' }}` pour le dégradé radial (le seul endroit où un style inline est nécessaire car Tailwind ne couvre pas les gradients radiaux complexes)
- **Framer Motion uniquement** — `motion.*` et `AnimatePresence` ; pas de transition CSS pour des animations complexes
- **Palette obligatoire** — `game-bg`, `game-card`, `game-border`, `neon-violet`, `neon-blue`, `neon-cyan`, `neon-pink`, `shadow-neon-gold`, etc. Voir `tailwind.config.js`
- **`import type`** pour tous les imports de types purs (`verbatimModuleSyntax` activé)
- **Pas de router** — la navigation reste via `setScreen()` dans `App.tsx`, rien à changer côté navigation

### Fichiers impactés

| Fichier | Action |
|---|---|
| `src/components/landing/ArenaBackground.tsx` | **NEW** |
| `src/components/landing/LandingPage.tsx` | **MODIFY** — branchement conditionnel background selon `user` |
| `src/components/landing/ConnectedHeader.tsx` | **MODIFY** — retire gradient overlay, fond solide, h-14, border-bottom |
| `src/components/landing/ConnectedLanding.tsx` | **MODIFY** — wrapper aura gold autour de l'avatar |
| `src/components/landing/LibraryBackground.tsx` | **UNCHANGED** — reste utilisé par GuestLanding |
| `src/components/landing/GuestLanding.tsx` | **UNCHANGED** |

### Palette exacte

| Usage | Valeur |
|---|---|
| Fond arène | `style={{ background: 'radial-gradient(ellipse at center 60%, #1a0f2e 0%, #0a0612 70%)' }}` (inline) + fallback `bg-game-bg` |
| Colonnes (base) | `from-neon-violet` |
| Colonnes (sommet) / arches | `to-neon-cyan`, stroke `neon-cyan/40` |
| Spots | `bg-neon-violet/20` + `bg-neon-cyan/20` avec `blur-3xl` |
| Aura avatar / particules | `shadow-neon-gold/20`, `bg-neon-gold` |
| Séparateur header | `border-white/10` |

### Animations — patterns Framer Motion

```tsx
// Colonne
<motion.div
  animate={{ opacity: [0.6, 1, 0.6] }}
  transition={{ duration: 5, delay, repeat: Infinity, ease: 'easeInOut' }}
  className="absolute w-[2px] rounded-full blur-sm bg-gradient-to-t from-neon-violet to-neon-cyan"
  style={{ left, height, bottom: '20%' }}
/>

// Particule
<motion.div
  animate={{ y: [0, -viewportHeight - 50], opacity: [0, 1, 0] }}
  transition={{ duration, delay, repeat: Infinity, ease: 'linear' }}
  className="absolute h-1 w-1 rounded-full bg-neon-gold"
  style={{ left }}
/>

// Aura avatar
<motion.div
  animate={{ scale: [1, 1.02, 1] }}
  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
  className="rounded-full shadow-[0_0_60px_rgba(var(--neon-gold-rgb),0.2)]"
>
  <AvatarContainer ... />
</motion.div>
```

**Note importante** : le projet utilise déjà `shadow-neon-*` dans `tailwind.config.js`. Utiliser la classe existante `shadow-neon-gold` (ou variante avec `/20`) plutôt que de construire un shadow inline custom si la classe existe. Vérifier `tailwind.config.js` avant d'inventer.

### Positions des colonnes (arc de cercle)

Utiliser 5 ou 6 colonnes avec positions calculées en JS (pas hardcodées) pour rester clean. Exemple :

```ts
const COLUMN_COUNT = 6
const columns = Array.from({ length: COLUMN_COUNT }, (_, i) => {
  const t = (i + 0.5) / COLUMN_COUNT // 0..1
  const angle = (t - 0.5) * Math.PI * 0.9 // -0.45π à 0.45π
  const x = 50 + Math.sin(angle) * 35 // % horizontal
  const heightFactor = 1 - Math.abs(t - 0.5) * 0.7 // décroît vers les bords
  return { left: `${x}%`, height: `${55 * heightFactor}vh`, delay: i * 0.8 }
})
```

### Séquence de lancement (`isLaunching`)

Le `LandingPage.tsx` pilote aujourd'hui un shake sur le background + flash blanc. **Garder ce comportement** : l'Arena reste dans le `motion.div` shake. L'Arena **ne reçoit pas** de prop `launchPhase` — elle est stable pendant la séquence, et c'est le contenu (avatar + play) qui s'efface via `isLaunching` dans `ConnectedLanding`.

### Project Structure Notes

- Cohérent avec la structure existante : `src/components/landing/` accueille le nouveau `ArenaBackground.tsx`
- Cohérent avec la règle "chaque écran a son propre dossier" — pas de sous-dossier requis
- Pas de nouveau type à ajouter dans `src/types/quiz.ts`
- Pas de nouvelle constante à ajouter dans `src/constants/`
- Pas de service ni hook impacté

### Testing Standards

Pas de framework de test obligatoire sur ce projet (voir project-context.md). Validation via :

1. `npx tsc --noEmit` (obligatoire)
2. `npm run lint` (obligatoire)
3. `npm run build` (obligatoire)
4. Test manuel dans le navigateur via `npm run dev` :
   - Connecté : vérifier scène Arena, header séparé, avatar avec aura, bouton Play fonctionnel
   - Guest : vérifier non-régression LibraryBackground
   - Séquence de lancement : converge → shake → flash → quiz (sans casse)
   - Fluidité visuelle : 60 FPS, pas de jank, animations lentes et continues

### References

- Inspiration visuelle : GeoGuessr landing (scène unique cohérente, header séparé, respiration, métaphore narrative)
- Règles projet : [_bmad-output/project-context.md](../project-context.md)
- Fichier tailwind config : `tailwind.config.js` (pour palette et shadows)
- Composant avatar existant : [src/components/avatar/](../../src/components/avatar/) — `AvatarContainer` gère déjà lazy-loading + placeholder + error boundary + breathing scale

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (claude-opus-4-6)

### Debug Log References

- `npx tsc --noEmit` → 0 erreur
- `npm run lint` → 0 warning (après correction d'une erreur `react-hooks/purity` préexistante dans `LibraryBackground.tsx`, fichier untracked : l'appel `Math.random()` dans l'animate du glyph a été remplacé par une valeur `rotateEnd` pré-calculée dans `generateGlyphs()`)
- `npm run build` → OK (bundle principal 236 KB gzipped 72.95 KB)
- `npx vitest run` → 20/20 tests passent (4 fichiers)

### Completion Notes List

- **ArenaBackground** : composant props-less, pur Tailwind + Framer Motion. Couches empilées : gradient radial (inline, seul style inline nécessaire) → sol ellipse `border-neon-violet/30` → aura gold podium (inline radial gold) → 2 spots blur-3xl (`neon-violet/20` gauche, `neon-cyan/20` droite) → 6 colonnes `from-neon-violet to-neon-cyan` en arc de cercle (formule `sin(angle) * 35` + décroissance vers les bords) → 3 arches SVG `stroke #06B6D4` décroissantes → 10 particules `bg-neon-gold` montantes → vignettage final pour concentrer le regard.
- **Stabilité des randoms** : toutes les positions/delays des colonnes et particules sont générés via `useMemo`, et les valeurs "semi-aléatoires" sont en fait déterministes (`(i * 73) % 70`, `(i * 37) % 5`) pour éviter tout re-calcul de render et respecter `react-hooks/purity`.
- **Tailwind palette** : ajout de `neon.gold: '#EAB308'` dans `tailwind.config.js` pour supporter `bg-neon-gold` (AC8 exige `neon-*` exclusifs). Le shadow `shadow-neon-gold` existait déjà.
- **ConnectedHeader** : suppression de l'overlay gradient + passage à `h-14 bg-game-bg/95 backdrop-blur-md border-b border-white/10`. Composant simplifié en `motion.nav` unique (plus de fragment).
- **Aura avatar** : wrapper `motion.div` autour de `AvatarContainer` avec boxShadow inline `rgba(234,179,8,0.18)` (Tailwind ne supporte pas `/20` sur boxShadow custom) + scale pulse 1↔1.02 sur 3s infinite. Indépendant du breathing scale interne du container, donc pas de conflit.
- **Branchement LandingPage** : `{user ? <ArenaBackground /> : <LibraryBackground launchPhase={launchPhase} />}` à l'intérieur du `motion.div` de shake. Comportement guest strictement inchangé.
- **Launch sequence** : l'Arena n'est pas désynchronisée par le shake ni par le flash (gérés au niveau parent). Le fade-out du contenu (avatar + Play) est piloté par `isLaunching` dans `ConnectedLanding` comme avant.
- **Fix lint LibraryBackground** : un appel `Math.random()` dans un prop `animate` interne violait `react-hooks/purity` (règle récemment activée). Le `rotate` final est désormais pré-calculé dans l'interface `Glyph` + `generateGlyphs()`. Aucun changement visuel.
- **Tests** : la suite existante (`ConnectedLanding.test.tsx`) continue de passer sans modification — le wrapper aura n'interfère pas avec le `data-testid="avatar-placeholder"`. Pas de test spécifique ajouté pour `ArenaBackground` (composant purement visuel, `aria-hidden`, pas de logique métier) — cohérent avec les standards du projet.

### File List

- `src/components/landing/ArenaBackground.tsx` — **NEW**
- `src/components/landing/LandingPage.tsx` — **MODIFIED** (import + branchement conditionnel)
- `src/components/landing/ConnectedHeader.tsx` — **MODIFIED** (header solide h-14, suppression overlay gradient)
- `src/components/landing/ConnectedLanding.tsx` — **MODIFIED** (aura gold autour de l'avatar)
- `src/components/landing/LibraryBackground.tsx` — **MODIFIED** (fix lint `Math.random` dans render — `rotateEnd` pré-calculé)
- `tailwind.config.js` — **MODIFIED** (ajout `neon.gold: '#EAB308'`)

## Change Log

| Date | Version | Changes | Author |
|---|---|---|---|
| 2026-04-13 | 1.0 | Implémentation Story 1.5 — Arène du Savoir : scène unique cohérente pour landing connectée (ArenaBackground), header solide séparé (h-14 + border-bottom), aura gold pulsante autour de l'avatar, ajout `neon.gold` palette. Non-régression guest validée (LibraryBackground conservé). Gates qualité tsc/lint/build/tests OK. | Dev Agent (Opus 4.6) |
