# Story 2.1 : Header-bar — Visibilité et navigation vers le profil

Status: review

## Story

En tant qu'utilisateur de Pulse Quizz,
je veux que la barre de navigation en haut de la landing page soit lisible et que le clic sur mon pseudo/connexion ouvre ma page profil,
afin de pouvoir m'identifier facilement et accéder à mon espace personnel.

## Acceptance Criteria

1. Le logo "PulseQuizz" dans la nav est nettement plus lisible qu'actuellement (opacité/contraste augmentés).
2. Les boutons Classement et Statistiques sont visuellement distincts sur le fond sombre.
3. Le pseudo `@username` (utilisateur connecté) est cliquable et déclenche la navigation vers l'écran `'profile'`.
4. Le bouton "Connexion" (utilisateur non connecté) conserve son comportement actuel (ouvre AuthModal).
5. Le bouton de déconnexion reste présent et fonctionnel.
6. Aucune régression visuelle sur les animations existantes (motion.nav fade-in, FloatingCardsBackground, etc.).
7. `npx tsc --noEmit`, `npm run lint` passent sans nouvelle erreur.

## Tasks / Subtasks

- [x] **Tâche 1 — Améliorer la visibilité des éléments de la nav** (AC: 1, 2)
  - [x] 1.1 — Dans `LandingPage.tsx`, modifier le logo : `text-white/20` → `text-white/70`, `text-neon-violet/40` → `text-neon-violet`
  - [x] 1.2 — Boutons Classement/Statistiques : `text-white/30` → `text-white/60`, `border-white/10` → `border-white/20`, `bg-white/5` → `bg-white/[0.08]` ; hover : `text-white/80`, `border-white/35`
  - [x] 1.3 — Username connecté : `text-white/40` → `text-white/70` ; bouton logout : `text-white/30` → `text-white/60`, `border-white/10` → `border-white/20`
  - [x] 1.4 — Bouton Connexion non connecté : `text-white/40` → `text-white/65`, `border-white/[0.07]` → `border-white/15`

- [x] **Tâche 2 — Rendre le pseudo/connexion cliquable vers le profil** (AC: 3, 4)
  - [x] 2.1 — Ajouter la prop `onShowProfile: () => void` à l'interface `Props` de `LandingPage.tsx`
  - [x] 2.2 — Transformer le `<span>@{profile?.username}</span>` en `<button onClick={onShowProfile}>` avec le même style + cursor-pointer
  - [x] 2.3 — Garder le bouton de déconnexion séparé (icône logout à droite du pseudo cliquable)
  - [x] 2.4 — Dans `App.tsx`, ajouter `handleShowProfile()` qui appelle `setScreen('profile')` et passer `onShowProfile={handleShowProfile}` à `LandingPage`
  - [x] 2.5 — Ajouter `'profile'` au type `AppScreen` dans `App.tsx` (préparation pour story 2.2) — cas dans `AnimatePresence` avec placeholder `<div>` pour l'instant

- [x] **Tâche 3 — Validation** (AC: 6, 7)
  - [x] 3.1 — Vérifier visuellement dans le navigateur : lisibilité de la nav sur fond sombre
  - [x] 3.2 — `npx tsc --noEmit` : zéro erreur
  - [x] 3.3 — `npm run lint` : zéro nouveau warning (erreurs pré-existantes non introduites par cette story)

## Dev Notes

### Fichier cible principal

**`src/components/landing/LandingPage.tsx`** — uniquement la section `{/* Top nav bar */}` (lignes ~82-155).
Ne pas toucher au reste du composant (hero, modals, animations de launch).

### Valeurs Tailwind actuelles → cibles

| Élément | Classe actuelle | Classe cible |
|---|---|---|
| Logo "Pulse" | `text-white/20` | `text-white/70` |
| Logo "Quizz" | `text-neon-violet/40` | `text-neon-violet` |
| Boutons icônes (base) | `text-white/30 border-white/10 bg-white/5` | `text-white/60 border-white/20 bg-white/[0.08]` |
| Boutons icônes (hover) | `hover:border-white/20 hover:text-white/60` | `hover:border-white/35 hover:text-white/80` |
| Username | `text-white/40` | `text-white/70` |
| Bouton logout (base) | `text-white/30 border-white/10` | `text-white/60 border-white/20` |
| Bouton Connexion | `text-white/40 border-white/[0.07] bg-white/[0.03]` | `text-white/65 border-white/15 bg-white/[0.06]` |

### Pattern pour le pseudo cliquable

```tsx
// Avant
<span className="select-none text-xs font-semibold text-white/40">
  @{profile?.username}
</span>

// Après
<button
  onClick={onShowProfile}
  className="select-none text-xs font-semibold text-white/70 transition-colors hover:text-white cursor-pointer"
>
  @{profile?.username}
</button>
```

### Ajout prop dans App.tsx

```tsx
// App.tsx — dans handleShowProfile
function handleShowProfile() { setScreen('profile') }

// LandingPage usage
<LandingPage
  ...
  onShowProfile={handleShowProfile}
/>
```

### Placeholder AppScreen 'profile' dans App.tsx

```tsx
// Ajouter dans le type
export type AppScreen = 'landing' | 'launching' | 'quiz' | 'ranking' | 'result' | 'stats' | 'profile'

// Ajouter dans AnimatePresence — placeholder minimal (sera remplacé en story 2.2)
{screen === 'profile' && (
  <motion.div
    key="profile"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1, transition: { duration: 0.4 } }}
    exit={{ opacity: 0, transition: { duration: 0.25 } }}
    className="absolute inset-0"
  >
    {/* ProfilePage — story 2.2 */}
    <div className="flex min-h-screen items-center justify-center bg-game-bg text-white">
      Profil (bientôt)
    </div>
  </motion.div>
)}
```

### Règles critiques à respecter

- **Tailwind uniquement** — pas de style inline, pas de CSS custom
- **Framer Motion** conservé tel quel pour la nav (`motion.nav` avec son animation d'entrée)
- **Ne pas modifier** les callbacks `onShowStats`, `onOpenAuth` existants
- **`import type`** pour tout import de type pur (verbatimModuleSyntax actif)
- L'opacité du logo et des boutons doit être augmentée mais rester dans l'esprit "dark/subtle" du design — ne pas rendre la nav trop agressive visuellement

### Pièges à éviter

1. `bg-white/8` n'existe pas en Tailwind standard — utiliser `bg-white/[0.08]` pour les valeurs non-standard
2. Ne pas oublier de passer `onShowProfile` dans `App.tsx` — TypeScript le détectera mais autant l'anticiper
3. Le pseudo connecté et le bouton logout sont dans le même `div` — transformer uniquement le span en button, ne pas enrober le logout dedans

### Project Structure Notes

- Seul fichier modifié : `src/components/landing/LandingPage.tsx` + `src/App.tsx`
- Aucun nouveau fichier créé dans cette story
- `'profile'` ajouté à `AppScreen` dans `App.tsx` est un prérequis bloquant pour story 2.2

### References

- [Source: src/components/landing/LandingPage.tsx] — section `{/* Top nav bar */}` (lignes ~82-155)
- [Source: src/App.tsx] — `AppScreen` type (ligne 14), `AnimatePresence` block
- [Source: _bmad-output/planning-artifacts/architecture.md#Ajout d'un nouvel écran]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

Aucun bug rencontré. Les erreurs lint rapportées par `npm run lint` sont toutes pré-existantes (LandingPage.tsx:38, QuizContainer.tsx, RankingRevealScreen.tsx, useQuiz.ts, useTimer.ts) — aucune n'a été introduite par cette story.

### Completion Notes List

- Tâche 1 : Logo, boutons Classement/Statistiques, username connecté, logout et bouton Connexion mis à jour avec les nouvelles valeurs d'opacité Tailwind conformément au tableau Dev Notes.
- Tâche 2 : `onShowProfile: () => void` ajouté à Props ; `<span>` transformé en `<button onClick={onShowProfile}>` ; logout reste séparé ; `handleShowProfile()` ajouté dans App.tsx et passé en prop.
- Tâche 2.5 : `'profile'` ajouté à `AppScreen` ; placeholder motion.div ajouté dans AnimatePresence — prêt pour story 2.2.
- TypeScript : `npx tsc --noEmit` → exit 0, zéro erreur.
- Lint : zéro nouvelle erreur introduite par cette story.

### File List

- src/components/landing/LandingPage.tsx
- src/App.tsx

## Change Log

| Date | Changes |
|---|---|
| 2026-04-11 | Story 2.1 implémentée : visibilité nav améliorée, pseudo cliquable vers profil, AppScreen étendu avec 'profile' |
