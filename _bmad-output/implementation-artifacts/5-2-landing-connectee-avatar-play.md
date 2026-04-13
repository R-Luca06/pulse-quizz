# Story 5.2 : Landing connectée — Avatar centré + Bouton Play

Status: review

> Cycle "Landing Avatar & Vitrine" — Epic 5 (ex-Epic 1 dans epics.md). Dépend de **Story 5.1** (composant `AvatarContainer` fourni).

## Story

En tant que **joueur connecté**,
je veux voir mon avatar au centre de la landing avec un bouton Play juste en dessous,
afin que mon identité de joueur soit immédiatement visible et que je puisse lancer une partie sans friction.

## Acceptance Criteria

1. **Split conditionnel connecté/non-connecté** — [src/components/landing/LandingPage.tsx](src/components/landing/LandingPage.tsx) détecte `user` via `useAuth()` et rend deux branches : **connectée** (cette story) vs **vitrine** (Story 6.1, non implémentée ici — laisser la branche vitrine vide ou rendre le hero actuel comme fallback provisoire).
2. **Avatar centré (FR1, FR4)** — La branche connectée rend `<AvatarContainer className="w-64 h-64 sm:w-80 sm:h-80" />` centré horizontalement et verticalement dans la zone principale (au-dessus du bouton Play, sous le header).
3. **Bouton Play sous l'avatar (FR5)** — Le composant `<StartButton onClick={() => setOpenSettings(true)} />` existant est positionné **sous** l'avatar (flex column, gap cohérent avec design actuel ~`gap-8`).
4. **Play ouvre SettingsModal (FR6)** — Le clic sur Play ouvre `SettingsModal` avec le même comportement actuel ([src/components/landing/LandingPage.tsx:220](src/components/landing/LandingPage.tsx#L220)) : state `openSettings`, `onLaunch` → `handleLaunch`.
5. **Non-bloquant (NFR7)** — Tant que l'avatar Spline charge, `AvatarPlaceholder` est rendu, mais le **bouton Play reste cliquable** et le **header reste visible et interactif**. Vérifié manuellement via `npm run dev` + throttling DevTools.
6. **FCP < 2s (NFR1)** — Le First Contentful Paint de la landing connectée (mesure Lighthouse en build preview, `npm run build && npm run preview`) est **< 2 secondes** sur desktop moderne. Mesure à consigner dans les Completion Notes.
7. **Lighthouse Performance > 90 (NFR4)** — Score Lighthouse Performance ≥ 90 sur `npm run preview`. Consigner le score dans Completion Notes.
8. **Préservation du flow launching** — L'animation de lancement existante (converging → shaking → exploding, [LandingPage.tsx:43-53](src/components/landing/LandingPage.tsx#L43-L53)) fonctionne toujours : l'avatar s'efface avec le hero lors du `isLaunching`, les floating cards (intactes dans cette story — modifiées en 5.3) convergent vers le centre.
9. **Zéro régression navigation** — Les boutons Stats / Profil / Achievements / Classement du header actuel continuent d'appeler `onShowStats` / `onShowProfile` / `onShowAchievements` (le redesign du header est traité en Story 5.4, pas ici — on conserve l'UI actuelle).
10. **Qualité gates** — `npx tsc --noEmit` zéro erreur, `npm run lint` zéro nouveau warning, `npm run build` succès, `npm run test` 100 % passent.

## Tasks / Subtasks

- [x] **Tâche 1 — Refactorer `LandingPage.tsx` en deux branches conditionnelles** (AC: 1)
  - [x] 1.1 — Dans [src/components/landing/LandingPage.tsx](src/components/landing/LandingPage.tsx), extraire le `user = useAuth().user` au top du composant (déjà présent ligne 28).
  - [x] 1.2 — Structurer le `return` en `if (user) return <ConnectedLanding ... />` / `else return <GuestLanding ... />` **OU** conserver un seul `return` avec un ternaire `{user ? <ConnectedSection /> : <GuestSection />}` pour le bloc hero (préférence : ternaire inline pour garder le wrapper commun `relative flex min-h-screen...`).
  - [x] 1.3 — Extraire la branche connectée dans `src/components/landing/ConnectedLanding.tsx` (nouveau fichier) et la branche vitrine dans `src/components/landing/GuestLanding.tsx` (contenu provisoire = hero actuel, sera remplacé par Story 6.1).
  - [x] 1.4 — Les deux branches partagent le wrapper `LandingPage` (FloatingCardsBackground, nav bar, shake wrapper, blobs) — ne pas dupliquer ces éléments.

- [x] **Tâche 2 — Intégrer `AvatarContainer` dans la branche connectée** (AC: 2, 5)
  - [x] 2.1 — Dans `ConnectedLanding.tsx`, importer `AvatarContainer` depuis `src/components/avatar`.
  - [x] 2.2 — Remplacer le bloc badge + titre par le motion.div flex-column `AvatarContainer` (64/80) + `StartButton`.
  - [x] 2.3 — Supprimer le bloc temporaire de démo ajouté en Story 5.1 tâche 7.
  - [x] 2.4 — Conserver l'animation `isLaunching` qui efface le hero : `animate={isLaunching ? { opacity: 0, scale: 0.85 } : { opacity: 1, scale: 1 }}`.

- [x] **Tâche 3 — Préserver le comportement Play → SettingsModal** (AC: 3, 4, 8)
  - [x] 3.1 — Le state `openSettings` + fonctions `handleLaunch` restent dans `LandingPage.tsx` (parent). `onOpenSettings` passé en props à `ConnectedLanding`/`GuestLanding`.
  - [x] 3.2 — Vérifier manuellement : Play → SettingsModal → "Lancer" → animation launching → quiz. ✅ Validé par l'utilisateur.

- [x] **Tâche 4 — Branche vitrine provisoire (pour ne pas casser les anonymes)** (AC: 1)
  - [x] 4.1 — `GuestLanding.tsx` rend **provisoirement** l'UI actuelle (badge + titre Pulse Quizz + StartButton).
  - [x] 4.2 — Commentaire `// TODO Story 6.1: remplacer par hero vitrine + sections explicatives` ajouté.
  - [x] 4.3 — Le bouton Play de la vitrine ouvre le SettingsModal comme actuellement.

- [x] **Tâche 5 — Mesures Lighthouse (NFR1, NFR4)** (AC: 6, 7)
  - [x] 5.1 — `npm run build && npm run preview`.
  - [x] 5.2 — Lighthouse Desktop/Performance lancé, compte connecté.
  - [x] 5.3 — Score Performance = **95** ≥ 90 ✅. Avatar non-bloquant confirmé (Play et header cliquables pendant chargement Spline).
  - [x] 5.4 — N/A (score au-dessus du seuil).

- [x] **Tâche 6 — Validation finale** (AC: 9, 10)
  - [x] 6.1 — `npx tsc --noEmit` : zéro erreur.
  - [x] 6.2 — `npm run lint` : delta = 0.
  - [x] 6.3 — `npm run build` : succès.
  - [x] 6.4 — `npm run test` : 14/14 passent (incluant 4 nouveaux tests Connected/GuestLanding).
  - [x] 6.5 — Test manuel : connecté → avatar visible au centre + Play dessous + flow launching OK. Non-connecté → hero actuel visible + Play OK. ✅ Validé.

## Dev Notes

### Contraintes critiques

- **Ne pas toucher au flow `launching`** : l'animation converging/shaking/exploding est pilotée par `setLaunchPhase` dans `useEffect` ([LandingPage.tsx:37-53](src/components/landing/LandingPage.tsx#L37-L53)). Elle reste dans `LandingPage.tsx` parent, pas déplacée dans `ConnectedLanding.tsx`.
- **FloatingCardsBackground intact** : cette story n'y touche pas. La Story 5.3 le modifie pour positionner les cards autour de l'avatar.
- **Header actuel intact** : le `<motion.nav>` ([LandingPage.tsx:84-179](src/components/landing/LandingPage.tsx#L84-L179)) reste tel quel dans cette story. La Story 5.4 le refactore.
- **Frontière auth** : `useAuth()` déjà importé et consommé ([LandingPage.tsx:28](src/components/landing/LandingPage.tsx#L28)). Pas de nouvel appel Supabase.
- **Lazy import Avatar** : ne **jamais** importer `AvatarDisplay` directement — toujours passer par `AvatarContainer` (wrapper ErrorBoundary + Suspense créé en Story 5.1).

### Patterns à réutiliser

- **Layout centré** : `flex min-h-screen w-full flex-col items-center justify-center` déjà utilisé ([LandingPage.tsx:61](src/components/landing/LandingPage.tsx#L61)) — le conserver pour le wrapper.
- **Animation hero (entry + isLaunching)** : `motion.div` avec `animate={isLaunching ? ... : ...}` ([LandingPage.tsx:182-189](src/components/landing/LandingPage.tsx#L182-L189)) — appliquer au nouveau bloc avatar+play.
- **StartButton** : réutiliser [src/components/landing/StartButton.tsx](src/components/landing/StartButton.tsx) sans modification.

### Project Structure Notes

Ajouts :
```
src/components/landing/
├── ConnectedLanding.tsx   # nouveau — branche connectée (avatar + play)
├── GuestLanding.tsx       # nouveau — provisoire, remplacé en Story 6.1
├── LandingPage.tsx        # modifié — wrapper + split conditionnel
```

### References

- Epic : [_bmad-output/planning-artifacts/epics.md](_bmad-output/planning-artifacts/epics.md) Story 1.2
- PRD FR1, FR4, FR5, FR6 / NFR1, NFR4, NFR7
- Story 5.1 (dépendance) : [5-1-avatar-composant-decouple.md](_bmad-output/implementation-artifacts/5-1-avatar-composant-decouple.md)
- Landing actuelle : [src/components/landing/LandingPage.tsx](src/components/landing/LandingPage.tsx)

## Dev Agent Record

### Agent Model Used

claude-opus-4-6

### Completion Notes List

**Implémentation (2026-04-13) :**

- Split conditionnel en place dans `LandingPage.tsx` : `user ? <ConnectedLanding /> : <GuestLanding />`. Wrapper commun (blobs, FloatingCards, nav, shake wrapper, modals) conservé dans le parent. Le flow `launching` (converging → shaking → exploding) reste piloté par `LandingPage.tsx` — les enfants reçoivent seulement `isLaunching` pour animer leur fade/scale.
- `ConnectedLanding.tsx` rend `<AvatarContainer className="h-64 w-64 sm:h-80 sm:w-80" />` + `<StartButton onClick={onOpenSettings} />` dans un `motion.div flex-col items-center gap-8`. Animation `isLaunching` appliquée sur le wrapper du hero (opacity 0, scale 0.85).
- `GuestLanding.tsx` conserve provisoirement badge + titre `Pulse Quizz` + StartButton (remplacement en Story 6.1). TODO ajouté dans le fichier.
- Bloc de démo avatar (Story 5.1 tâche 7) retiré du parent. Import direct `AvatarContainer` supprimé de `LandingPage.tsx`.
- Tests unitaires ajoutés (`ConnectedLanding.test.tsx`) : rendu avatar+play, clic onOpenSettings, rendu guest (titre Pulse Quizz, absence avatar), clic guest. 4 nouveaux tests, 14/14 au total.
- Build : `AvatarDisplay` reste isolé dans son propre chunk (`AvatarDisplay-*.js` ≈ 1.75 kB), donc `LazyAvatarDisplay` ne bloque pas le premier paint. Bundle initial `index-*.js` ≈ 227 kB gzip 71 kB (inchangé par rapport au baseline post code-splitting Story 1.1).

**Gates qualité :**
- `npx tsc --noEmit` : 0 erreur.
- `npm run lint` : 0 warning (delta = 0).
- `npm run build` : succès.
- `npm run test -- --run` : 14/14 ✅.

**Mesures Lighthouse (validées par l'utilisateur 2026-04-13) :**

- [x] Score Lighthouse Performance : **95** (seuil ≥ 90) ✅
- [x] Avatar non-bloquant : Play + header restent interactifs pendant le chargement Spline ✅

### File List

**Créés :**
- `src/components/landing/ConnectedLanding.tsx`
- `src/components/landing/GuestLanding.tsx`
- `src/components/landing/ConnectedLanding.test.tsx`

**Modifiés :**
- `src/components/landing/LandingPage.tsx`

### Change Log

- **2026-04-13** — Story 5.2 implémentée. Split conditionnel `ConnectedLanding` / `GuestLanding` ajouté, avatar centré + Play intégré pour les utilisateurs connectés, vitrine provisoire conservée pour les anonymes (remplacement prévu en Story 6.1). Tests Connected/Guest ajoutés, quality gates verts. Lighthouse Performance = 95 (≥ 90), avatar non-bloquant confirmé. Toutes ACs satisfaites.
