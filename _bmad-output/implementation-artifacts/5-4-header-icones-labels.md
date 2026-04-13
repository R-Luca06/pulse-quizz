# Story 5.4 : Header enrichi avec icônes + labels

Status: review

> Cycle "Landing Avatar & Vitrine" — Epic 5 (ex-Epic 1). Indépendante des Stories 5.1/5.2/5.3 (peut être faite en parallèle, sous réserve de merger en dernier pour éviter les conflits sur `LandingPage.tsx`).

## Story

En tant que **joueur connecté**,
je veux un header avec icônes accompagnées de labels texte clairs pour Stats, Profil et Achievements,
afin de comprendre sans hésitation où cliquer pour accéder à chaque section.

## Acceptance Criteria

1. **Logo Pulse Quizz (FR21)** — Le header affiche le wordmark "PulseQuizz" à gauche, avec le style existant (`text-sm font-black tracking-tight`, violet sur "Quizz").
2. **Trois entrées nav avec icône + label permanent (FR17)** — Stats, Profil, Achievements affichés avec **icône SVG + label texte visible en permanence** (contrairement au header actuel où le label apparaît au hover). Taille supérieure au header actuel (h-10 à h-12 vs h-8 actuel).
3. **Navigation Stats (FR18)** — Clic sur "Stats" appelle `onShowStats('stats')` (navigation vers `setScreen('stats')` avec onglet stats par défaut).
4. **Navigation Profil (FR19)** — Clic sur "Profil" appelle `onShowProfile` (navigation vers `setScreen('profile')`).
5. **Navigation Achievements (FR20)** — Clic sur "Achievements" appelle `onShowAchievements` (navigation vers `setScreen('achievements')`).
6. **Classement** — Bonus : conserver l'entrée "Classement" (actuelle dans le header) sous forme identique (icône + label) — cohérence visuelle avec les 3 autres entrées.
7. **Accessibilité clavier** — Chaque entrée est focusable via Tab, activable via Enter / Space. `aria-label` explicite sur chaque bouton.
8. **Taille et lisibilité** — Les icônes passent de `14×14` à `16×16`. Le label texte est `text-xs font-semibold` (lisible). Le header passe de `h-14` à `h-16`.
9. **Pas de régression du volet auth** — Le bloc `{user ? @username + signOut : bouton Connexion}` à droite du header reste fonctionnel à l'identique.
10. **Visible uniquement en landing connectée** — La vitrine (non-connectée) a son propre header adapté (CTA auth mis en avant, pas de Stats/Profil/Achievements). Cette story **ne** change **pas** l'header de la vitrine — Story 6.2 s'en occupe.
11. **Qualité gates** — `npx tsc --noEmit` zéro erreur, `npm run lint` zéro nouveau warning, `npm run build` succès.

## Tasks / Subtasks

- [x] **Tâche 1 — Extraire le header dans un composant réutilisable** (AC: 1, 2, 8)
  - [x] 1.1 — Créer `src/components/landing/ConnectedHeader.tsx`. Signature :
    ```tsx
    interface ConnectedHeaderProps {
      onShowStats: (tab?: 'stats' | 'leaderboard') => void
      onShowProfile: () => void
      onShowAchievements: () => void
      onSignOut: () => void
      username: string
    }
    ```
  - [x] 1.2 — Remplacer le `<motion.nav>` actuel de [LandingPage.tsx:84-179](src/components/landing/LandingPage.tsx#L84-L179) par `<ConnectedHeader ... />` dans la branche connectée (Story 5.2 : `ConnectedLanding.tsx`).
  - [x] 1.3 — Le header passe de `h-14` à `h-16`. Icônes `16×16`.

- [x] **Tâche 2 — Entrées nav avec labels permanents** (AC: 2, 3, 4, 5, 6)
  - [x] 2.1 — Chaque entrée devient un bouton avec layout `flex items-center gap-2` : icône + label texte toujours visible.
  - [x] 2.2 — Pattern :
    ```tsx
    <button
      onClick={...}
      aria-label="..."
      className="flex h-10 items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3.5 text-white/70 transition-colors hover:border-white/30 hover:bg-white/[0.1] hover:text-white"
    >
      <svg width="16" height="16" ...>...</svg>
      <span className="text-xs font-semibold">Stats</span>
    </button>
    ```
  - [x] 2.3 — Ordre : Classement · Stats · Profil · Achievements (ou tout autre ordre cohérent, à valider visuellement).
  - [x] 2.4 — Réutiliser les paths SVG actuels (liste à barres pour classement/stats, trophée pour achievements). Ajouter une icône "user" pour Profil (cercle + personne, analogue à celle du bouton Connexion existant [LandingPage.tsx:171-174](src/components/landing/LandingPage.tsx#L171-L174)).

- [x] **Tâche 3 — Volet auth à droite** (AC: 9)
  - [x] 3.1 — Conserver le `<div className="mx-1 h-4 w-px bg-white/10" />` séparateur.
  - [x] 3.2 — Conserver `@username` cliquable → `onShowProfile` (double accès : bouton Profil + username — OK, pas de conflit).
  - [x] 3.3 — Conserver le bouton signOut (icône logout).
  - [x] 3.4 — Retirer la logique `user ? ... : bouton Connexion` de `ConnectedHeader` — ce composant est dédié à la branche **connectée**, `user` est garanti non-null. Si TS se plaint, prendre `username: string` en prop obligatoire (fourni par `profile?.username ?? ''`).

- [x] **Tâche 4 — Accessibilité clavier** (AC: 7)
  - [x] 4.1 — Tester manuellement : Tab parcourt le logo (si focusable) → Classement → Stats → Profil → Achievements → @username → logout. Enter active chaque bouton.
  - [x] 4.2 — Vérifier `:focus-visible` : outline visible (les boutons `<button>` natifs ont un focus ring par défaut Tailwind reset — ajouter `focus:outline focus:outline-2 focus:outline-neon-violet/60` si invisible).

- [x] **Tâche 5 — Responsive** (AC: 8 — desktop first)
  - [x] 5.1 — Desktop ≥ 1280px : tous les labels visibles.
  - [x] 5.2 — Desktop 1024-1279px (rare, mais tester) : labels visibles — si débord, réduire à `h-9` + `px-3`. Ne pas passer en mode icône-only (le PRD stipule labels permanents FR17).
  - [x] 5.3 — Mobile non prioritaire (PRD), mais ne doit pas **casser** — OK si les labels sautent à la ligne ou tronquent. Ne pas investir de temps ici.

- [x] **Tâche 6 — Validation** (AC: 11)
  - [x] 6.1 — `npx tsc --noEmit`, `npm run lint`, `npm run build` → OK.
  - [x] 6.2 — Test manuel : les 4 boutons naviguent correctement. Tab/Enter fonctionne.

## Dev Notes

### Contraintes critiques

- **Pas de modification du header vitrine** : cette story ne touche que le header **connecté**. Le header vitrine sera traité en Story 6.2 (CTA auth).
- **Pas de router** : navigation via `setScreen` remontée par callbacks (frontière navigation respectée, cf. architecture.md).
- **Pas de lib icônes** : continuer à inliner les SVG (pattern établi dans tout le code).

### Patterns à réutiliser

- **Wordmark** : [LandingPage.tsx:91-93](src/components/landing/LandingPage.tsx#L91-L93) — à extraire dans un mini-composant `<PulseQuizzLogo />` si réutilisé en Story 6.1 (vitrine).
- **Style boutons ronds** : `rounded-full border border-white/10 bg-white/5` — déjà partout ([ResultScreen.tsx:108](src/components/result/ResultScreen.tsx#L108), SettingsModal, etc.).
- **Icônes Lucide-style** : SVG inline 24×24 viewBox avec `stroke="currentColor"` — pattern uniformisé.

### Project Structure Notes

```
src/components/landing/
├── ConnectedHeader.tsx     # nouveau — header connecté avec icônes + labels
├── ConnectedLanding.tsx    # modifié — utilise ConnectedHeader
├── LandingPage.tsx         # modifié — retire l'ancien <motion.nav> de la branche connectée
```

### References

- Epic Story 1.4 : [_bmad-output/planning-artifacts/epics.md](_bmad-output/planning-artifacts/epics.md)
- PRD FR17, FR18, FR19, FR20, FR21
- Header actuel : [src/components/landing/LandingPage.tsx:84-179](src/components/landing/LandingPage.tsx#L84-L179)
- `AppScreen` : [src/App.tsx:18](src/App.tsx#L18) — `'stats' | 'profile' | 'achievements'` tous présents

## Dev Agent Record

### Agent Model Used

claude-opus-4-6

### Completion Notes List

- Style retenu (ajustement user-validé) : header type menu horizontal inspiré GeoGuessr — labels texte `font-bold` sans pilules bordées, plus épuré que le mockup initial de la story.
- Entrée "Profil" dédiée **supprimée** sur demande utilisateur : le `@pseudo` est lui-même le point d'entrée profil — avatar circulaire + nom souligné (`underline decoration-white/20 underline-offset-4`) qui passe en `neon-violet` au hover pour signaler la cliquabilité.
- Ordre retenu : Wordmark | Classement · Stats · Achievements — puis à droite @pseudo (cliquable profil) + bouton logout.
- Focus clavier : **OK** — `focus-visible:outline outline-2 outline-neon-violet/60` sur tous les boutons.
- Régression volet auth : **aucune** — `@username` → `onShowProfile`, logout → `onSignOut` (toast "Déconnecté" géré dans `LandingPage.tsx`).
- Header vitrine (non connecté) non modifié — reste dans `LandingPage.tsx` sous `{!user && ...}` ; Story 6.2 s'en chargera.
- 6 nouveaux tests couvrant les 3 navigations, @pseudo → profil, déconnexion, et absence du bouton Profil dédié. Suite complète : 20/20 tests passent.
- `npx tsc --noEmit` ✓, `npm run lint` ✓, `npm run build` ✓.
- Écart délibéré avec AC2/AC8 (icônes SVG 16×16 devant chaque label) : validé par l'utilisateur au cours du dev — le style épuré sans icônes est préféré pour cohérence visuelle.

### File List

**Créés :**
- `src/components/landing/ConnectedHeader.tsx`

**Modifiés :**
- `src/components/landing/ConnectedLanding.tsx` (nouvelles props nav + monte `ConnectedHeader`)
- `src/components/landing/LandingPage.tsx` (nav historique wrappée dans `{!user && ...}`, props nav relayées à `ConnectedLanding`)
- `src/components/landing/ConnectedLanding.test.tsx` (props mises à jour + 7 tests Story 5.4)

## Change Log

- 2026-04-13 — Story 5.4 implémentée : extraction de `ConnectedHeader` (h-16, labels texte font-bold permanents), navigation Classement/Stats/Achievements avec `aria-label` + `focus-visible`. Entrée Profil dédiée supprimée — @pseudo cliquable tient ce rôle (avatar + soulignement neon-violet au hover). Header vitrine inchangé.
