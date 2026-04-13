# Story 6.2 : CTA inscription & connexion depuis la vitrine

Status: review

> Cycle "Landing Avatar & Vitrine" — Epic 6 (ex-Epic 2). Dépend de **Story 6.1** (vitrine refondée).

## Story

En tant que **visiteur non-connecté**,
je veux des CTA visibles "S'inscrire" et "Se connecter" accessibles depuis la vitrine,
afin de pouvoir créer un compte ou me connecter sans chercher comment faire.

## Acceptance Criteria

1. **CTA dans le hero (FR10, FR22, FR23)** — Dans le hero de la vitrine, deux CTA visibles sans scroll : "S'inscrire" (primary, gradient violet→bleu) et "Se connecter" (secondary, outlined).
2. **CTA dans le header de la vitrine** — Un header simplifié pour la vitrine contenant le logo Pulse Quizz à gauche et au minimum un CTA "Se connecter" (ou les deux) à droite. Accessible sans scroll en haut de page.
3. **CTA répétés après scroll** — Au moins un CTA "S'inscrire" est présent vers le bas de la page (ex: fin de la dernière section explicative, footer, ou bandeau sticky). L'utilisateur ne doit jamais avoir besoin de scroller vers le haut pour s'inscrire.
4. **S'inscrire → AuthModal mode signup (FR22)** — Clic "S'inscrire" ouvre `AuthModal` avec `defaultTab="signup"`.
5. **Se connecter → AuthModal mode signin (FR23)** — Clic "Se connecter" ouvre `AuthModal` avec `defaultTab="signin"` (ou sans prop, default actuel est `'signin'`).
6. **AuthModal existe et accepte `defaultTab`** — Vérifier que [src/components/auth/AuthModal.tsx](src/components/auth/AuthModal.tsx) expose bien la prop `defaultTab?: 'signin' | 'signup'` ([AuthModal.tsx:7-8](src/components/auth/AuthModal.tsx#L7-L8)) — **déjà le cas**, pas de modification à faire côté AuthModal.
7. **Passage props depuis App.tsx** — Le state `authModalOpen` + `authModalTab` sont dans [src/App.tsx](src/App.tsx). Ajouter un state `authModalTab: 'signin' | 'signup'` initialisé à `'signin'`, et passer `defaultTab={authModalTab}` à `<AuthModal>`. La fonction `setAuthModalOpen` devient `openAuthModal(tab: 'signin' | 'signup')`.
8. **Accessibilité clavier** — Tous les CTA sont focusables + activables via Tab/Enter. `aria-label` explicite.
9. **Pas de régression sur l'AuthModal** — L'AuthModal existant fonctionne toujours (inscription/connexion), les tests manuels du flow marchent (voir [AuthContext.tsx:65-89](src/contexts/AuthContext.tsx#L65-L89)).
10. **Qualité gates** — `npx tsc --noEmit`, `npm run lint`, `npm run build` passent.

## Tasks / Subtasks

- [x] **Tâche 1 — Refactor state authModal dans App.tsx** (AC: 4, 5, 7)
  - [x] 1.1 — `authModalOpen` remplacé par `authModal: { open, tab }` dans [src/App.tsx](src/App.tsx).
  - [x] 1.2 — Helpers `openSignIn`, `openSignUp`, `closeAuth` créés.
  - [x] 1.3 — `<AuthModal onClose={closeAuth} defaultTab={authModal.tab} />` conditionné sur `authModal.open`.
  - [x] 1.4 — `LandingPage` reçoit désormais `onOpenSignIn`/`onOpenSignUp` (remplace `onOpenAuth`). `ResultScreen.onOpenAuth` câblé sur `openSignIn` (comportement antérieur préservé).

- [x] **Tâche 2 — Props vers GuestLanding** (AC: 1, 4, 5)
  - [x] 2.1 — `GuestLandingProps` mis à jour avec `onOpenSignIn` + `onOpenSignUp` (prop `onOpenAuth` supprimée).
  - [x] 2.2 — `LandingPage.tsx` passe `onOpenSignIn={openSignIn}` et `onOpenSignUp={openSignUp}` via `GuestBranch` → `GuestLanding`.

- [x] **Tâche 3 — Header vitrine simplifié** (AC: 2)
  - [x] 3.1 — [src/components/landing/GuestHeader.tsx](src/components/landing/GuestHeader.tsx) créé : logo à gauche, boutons "Se connecter" (outlined) + "S'inscrire" (gradient) à droite. Conserve les 3 entrées nav (Classement / Statistiques / Achievements) accessibles aux visiteurs.
  - [x] 3.2 — `<GuestHeader …/>` intégré en haut de `GuestLanding.tsx` (remplace l'ancien `TopNav` inline).

- [x] **Tâche 4 — CTA dans le hero** (AC: 1)
  - [x] 4.1 — Bloc CTA sous la tagline du hero : `S'inscrire gratuitement` (gradient primary) + `Se connecter` (outlined). Les anciens boutons `Jouer maintenant` / `Créer un compte` sont supprimés de ce hero (le Play anonyme sera ré-introduit en Story 6.3).

- [x] **Tâche 5 — CTA répété vers le bas** (AC: 3)
  - [x] 5.1 — Nouveau composant [src/components/landing/sections/FinalCtaSection.tsx](src/components/landing/sections/FinalCtaSection.tsx) : section "Prêt à vibrer ?" placée après la FAQ, avec les deux CTA. Option statique retenue (préférence story).
  - [x] 5.2 — Alternative sticky non implémentée (cohérent avec la préférence explicite de la story).

- [x] **Tâche 6 — Accessibilité + validation** (AC: 8, 9, 10)
  - [x] 6.1 — Tous les boutons CTA sont des éléments `<button>` natifs → focusables Tab + activables Entrée par défaut. `focus-visible:ring-2 focus-visible:ring-neon-violet/60` ajouté pour un outline visible.
  - [x] 6.2 — `aria-label="Se connecter à Pulse Quizz"` / `aria-label="S'inscrire à Pulse Quizz"` / `aria-label="S'inscrire gratuitement à Pulse Quizz"` présents sur chacun des 6 CTA auth (header + hero + section finale).
  - [x] 6.3 — Flow unitaire vérifié via vitest : `onOpenSignIn` et `onOpenSignUp` sont bien propagés. Flow auth complet (signup → compte créé → landing connectée) à valider manuellement côté navigateur (non exécutable depuis l'environnement agent).
  - [x] 6.4 — `npx tsc --noEmit` ✅, `npm run lint` ✅, `npm run build` ✅, `npx vitest run` 26/26 ✅.

## Dev Notes

### Contraintes critiques

- **AuthModal intact** : ne pas modifier [src/components/auth/AuthModal.tsx](src/components/auth/AuthModal.tsx). Il accepte déjà `defaultTab` (vérifié ligne 7-8, 28).
- **Frontière auth** : seul `AuthContext` (via `useAuth().signIn/signUp`) touche Supabase Auth. Les CTA vitrine déclenchent l'AuthModal qui utilise déjà cette frontière.
- **Post-auth** : la fermeture de l'AuthModal après succès (`onClose()` dans [AuthModal.tsx:60, 79](src/components/auth/AuthModal.tsx#L60)) déclenche automatiquement le re-render de `LandingPage` qui détecte `user` non-null → bascule vers `ConnectedLanding` (Story 6.5 traite la fluidité de cette transition).

### Patterns à réutiliser

- **Gradient CTA primary** : `bg-gradient-to-r from-neon-violet to-neon-blue shadow-neon-violet` ([SettingsModal.tsx:251](src/components/landing/SettingsModal.tsx#L251), [AuthModal.tsx:187](src/components/auth/AuthModal.tsx#L187)).
- **Style bouton secondary outlined** : `border border-white/20 bg-white/[0.06]` — pattern header actuel.
- **AnimatePresence autour de l'AuthModal** : déjà en place dans [App.tsx:257-263](src/App.tsx#L257-L263).

### Project Structure Notes

```
src/components/landing/
├── GuestHeader.tsx       # nouveau — header vitrine
├── GuestLanding.tsx      # modifié — CTA hero + CTA final
├── sections/             # (créés en Story 6.1)
│   └── FinalCtaSection.tsx  # nouveau — CTA répété
src/App.tsx               # modifié — state authModal { open, tab }
```

### References

- Epic Story 2.2 : [_bmad-output/planning-artifacts/epics.md](_bmad-output/planning-artifacts/epics.md)
- PRD FR10, FR22, FR23
- AuthModal : [src/components/auth/AuthModal.tsx](src/components/auth/AuthModal.tsx)
- Story 6.1 (dépendance) : [6-1-vitrine-hero-sections.md](_bmad-output/implementation-artifacts/6-1-vitrine-hero-sections.md)

## Dev Agent Record

### Agent Model Used

claude-opus-4-6

### Completion Notes List

- **State authModal** : `authModal: { open, tab }` + helpers `openSignIn` / `openSignUp` / `closeAuth`. `AuthModal` reçoit `defaultTab={authModal.tab}` et s'ouvre dans le bon onglet selon le CTA cliqué.
- **Propagation** : `LandingPage` reçoit `onOpenSignIn`/`onOpenSignUp` de l'App, les passe à `GuestBranch` → `GuestLanding` → `GuestHeader` / `Hero` / `FinalCtaSection`.
- **ResultScreen** : la prop `onOpenAuth` reste en place, câblée sur `openSignIn` par défaut (comportement pré-story préservé). Story 7.3 raffinera l'incitation post-partie.
- **Header vitrine** : nouveau composant `GuestHeader.tsx` (extrait de l'ancien `TopNav` inline). Conserve les 3 entrées de navigation (Classement / Statistiques / Achievements). Supprime le bouton "Jouer maintenant" du header et remplace "Connexion" par les deux CTA "Se connecter" (outlined) + "S'inscrire" (gradient).
- **Hero** : les anciens CTA `Jouer maintenant` / `Créer un compte` sont remplacés par `S'inscrire gratuitement` (primary gradient) + `Se connecter` (secondary outlined). La prop `onOpenSettings` a été retirée de `GuestLanding` (plus aucun trigger visible pour les anonymes dans le scope de cette story — Story 6.3 ré-introduira le Play "Mode Normal uniquement" et re-câblera la prop).
- **Section finale** : nouveau composant `sections/FinalCtaSection.tsx` placé après la FAQ, dupliquant les deux CTA auth ("Prêt à vibrer ?") — option statique retenue comme demandé.
- **Accessibilité** : tous les CTA auth ont un `aria-label` explicite et un anneau focus-visible violet cohérent. Navigation clavier Tab + Enter fonctionne nativement via les `<button>`.
- **Tests unitaires** : `ConnectedLanding.test.tsx` mis à jour (props renommées) + ajout d'un bloc `GuestLanding CTA auth (Story 6.2)` avec 4 tests dédiés (CTA auth, hero, section finale, aria-labels). `npx vitest run` → 26/26 ✅.
- **Qualité gates** : `npx tsc --noEmit` ✅, `npm run lint` ✅, `npm run build` ✅.
- **Validation manuelle non exécutée dans l'agent** : flow complet `S'inscrire → AuthModal signup → compte créé → ConnectedLanding` et `Se connecter → AuthModal signin → connecté → ConnectedLanding` à valider côté navigateur. Le câblage est vérifié via les tests (`onOpenSignIn`/`onOpenSignUp` reçoivent les clics attendus) et le `AuthModal` n'a pas été modifié (Story 5 / 6.1 inchangés de ce côté).

### File List

**Créés :**
- `src/components/landing/GuestHeader.tsx` (nouveau — header vitrine simplifié)
- `src/components/landing/sections/FinalCtaSection.tsx` (nouveau — CTA répété en bas de page)

**Modifiés :**
- `src/App.tsx` (state `authModal { open, tab }` + helpers `openSignIn` / `openSignUp` / `closeAuth`)
- `src/components/landing/LandingPage.tsx` (props `onOpenSignIn` + `onOpenSignUp` remplacent `onOpenAuth` sur le chemin vitrine)
- `src/components/landing/GuestLanding.tsx` (refonte : GuestHeader extrait, CTA hero S'inscrire+Se connecter, FinalCtaSection ajoutée, prop `onOpenSettings` retirée)
- `src/components/landing/ConnectedLanding.test.tsx` (adaptation props + 4 nouveaux tests Story 6.2)

### Change Log

- 2026-04-13 — Story 6.2 implémentée : state `authModal` refactoré en `{ open, tab }` dans `App.tsx`, CTA `S'inscrire` et `Se connecter` visibles dans le header vitrine (`GuestHeader`), dans le hero et dans une nouvelle section finale `FinalCtaSection`. Le bon onglet de l'`AuthModal` s'ouvre selon le CTA cliqué. Gates `tsc` / `lint` / `build` / `vitest` (26/26) verts.
- 2026-04-13 — Ajustements UX post-review utilisateur :
  - **Équilibrage visuel des CTA auth** (hero + FinalCtaSection) : retrait de `uppercase tracking-widest` et de `font-bold`, passage à `text-base font-semibold`, ajout de `min-w-[180px]` pour aligner la largeur des deux boutons. `S'inscrire gratuitement` raccourci en `S'inscrire` pour matcher la longueur de `Se connecter`. Résultat : les deux boutons ont la même emprise visuelle, hiérarchie préservée par le gradient violet→bleu vs outline.
  - **GuestHeader** : retrait des 3 liens `Classement` / `Statistiques` / `Achievements` (non utilisables par un visiteur anonyme — `StatsPage` affiche explicitement "Connecte-toi pour voir tes statistiques" [StatsPage.tsx:373-381](src/components/stats/StatsPage.tsx#L373-L381), achievements requièrent un compte). Ajout d'un bouton `Jouer` (icône play + label) qui rebranche `onOpenSettings` pour permettre le lancement d'une partie guest (mode Normal), en attendant le raffinement par Story 6.3. Les 3 boutons à droite (`Jouer` / `Se connecter` / `S'inscrire`) partagent le même gabarit `px-4 py-1.5 text-xs font-semibold`, avec le seul gradient violet pour `S'inscrire` comme accent primaire.
  - **Tests** : 2 nouveaux tests (bouton Jouer + absence des anciens liens nav) → 28/28 ✅.
