# Story 5.3 : Floating cards autour de l'avatar

Status: review

> Cycle "Landing Avatar & Vitrine" — Epic 5 (ex-Epic 1). Dépend de **Stories 5.1** (AvatarContainer) et **5.2** (avatar intégré à la landing).

## Story

En tant que **joueur connecté**,
je veux voir des cards de questions qui flottent et tournent autour de mon avatar,
afin que l'ambiance visuelle donne envie de jouer et crée un effet "wow" à l'ouverture.

## Acceptance Criteria

1. **Cards radiales autour de l'avatar (FR7)** — Les floating cards actuelles ([FloatingCardsBackground.tsx](src/components/landing/FloatingCardsBackground.tsx)) sont repositionnées pour former un cercle/ellipse centré sur la position de l'avatar dans la branche connectée, sans altérer le layout de la branche vitrine.
2. **Animation 60 FPS (NFR6)** — Les animations de flottement + rotation tournent à 60 FPS sur desktop moderne. Vérifié via Chrome DevTools > Performance > FPS meter : aucun frame drop > 2 par seconde sur une captation de 10s.
3. **Pas de clignotement au chargement avatar** — Quand l'`AvatarPlaceholder` est remplacé par le `AvatarDisplay` Spline (ou SVG fallback), les cards ne sautent ni ne clignotent autour du nouveau centre. La position radiale est calculée par rapport à un conteneur stable, pas au DOM du composant avatar.
4. **Comportement launching préservé** — L'animation existante converging → shaking → explosion ([FloatingCardsBackground.tsx](src/components/landing/FloatingCardsBackground.tsx) via prop `launchPhase`) fonctionne toujours à l'identique. Les cards convergent vers le centre puis explosent radialement.
5. **Branche vitrine** — Pour les visiteurs non-connectés, la disposition des cards **reste celle actuelle** (positions `POSITIONS` actuelles du fichier) ou une variante adaptée au hero — **à ne pas casser** (modifiable ultérieurement dans Story 6.1 si besoin).
6. **Questions en français** — Remplacer le tableau `SAMPLE_QUESTIONS` actuellement en anglais ([FloatingCardsBackground.tsx:6-17](src/components/landing/FloatingCardsBackground.tsx#L6-L17)) par 10 questions en français cohérentes avec les catégories Pulse Quizz (Géographie, Histoire, Science, Sport, Art, Culture générale, Cinéma). La langue est désormais `'fr'` uniquement (Décision 1 architecture).
7. **Accessibilité minimale** — Les cards ne sont pas focusables clavier (elles sont décoratives). `aria-hidden="true"` sur le conteneur.
8. **Qualité gates** — `npx tsc --noEmit` zéro erreur, `npm run lint` zéro nouveau warning, `npm run build` succès.

## Tasks / Subtasks

- [x] **Tâche 1 — Traduire SAMPLE_QUESTIONS en français** (AC: 6)
  - [x] 1.1 — Remplacer les 10 questions anglaises par 10 questions françaises cohérentes avec la banque (exemples : "Quelle est la capitale du Japon ?", "Qui a peint la Joconde ?", "En quelle année a eu lieu la Révolution française ?", "Quelle est la plus grande planète du système solaire ?", "Qui a écrit 'Les Misérables' ?", etc.).
  - [x] 1.2 — Conserver la structure `{ question: string; answer: string }` et la longueur 10.

- [ ] **Tâche 2 — Repositionner les cards en cercle autour de l'avatar** (AC: 1, 3) — **REVERT par décision utilisateur (2026-04-13)** : le layout radial ne plaisait pas visuellement. Retour au tableau `POSITIONS` d'origine. AC 1 abandonné.
  - [ ] 2.1 — Dans [FloatingCardsBackground.tsx](src/components/landing/FloatingCardsBackground.tsx), remplacer le tableau `POSITIONS` hardcodé par un calcul radial :
    ```ts
    const CENTER_X = 50  // % viewport width — centre de l'avatar
    const CENTER_Y = 50  // % viewport height
    const RADIUS_X = 32  // ellipse semi-axe horizontal en % viewport
    const RADIUS_Y = 28  // ellipse semi-axe vertical en % viewport
    const cards = SAMPLE_QUESTIONS.map((q, i) => {
      const angle = (i / SAMPLE_QUESTIONS.length) * 2 * Math.PI
      return {
        ...q,
        x: Math.cos(angle) * RADIUS_X,  // relatif au centre, en %
        y: Math.sin(angle) * RADIUS_Y,
        // ... (rotation, floatY, etc. conservés)
      }
    })
    ```
  - [ ] 2.2 — Le rendu utilise `transform: translate(-50%, -50%) translate(${center + x}vw, ${center + y}vh)` pour positionner les cards **par rapport au centre stable du viewport**, indépendant du DOM de l'avatar. Ceci prévient le saut au swap placeholder → Spline.
  - [ ] 2.3 — Ajuster `RADIUS_X` / `RADIUS_Y` pour que les cards n'entrent pas en collision visuelle avec l'avatar (rayon interne ≥ `w-80 = 320px` de l'avatar = ~20 % viewport sur 1440px). Tester avec différentes tailles d'écran (1280×720, 1440×900, 1920×1080).

- [x] **Tâche 3 — Préserver les animations existantes** (AC: 2, 4)
  - [x] 3.1 — Conserver la logique `floatY`, `floatRotation`, `duration`, `delay` par carte (randomisation légère).
  - [x] 3.2 — Conserver le traitement `launchPhase` : `converging` → cards retournent au centre (x=0, y=0), `exploding` → utilisation de `explosionX`, `explosionY` (starburst actuel).
  - [ ] 3.3 — **Vérifier 60 FPS** : Chrome DevTools > Performance > Record pendant 10s, inspecter `Frames` track. Aucun frame > 16.7 ms en régime stationnaire. *(À valider manuellement — voir Completion Notes)*

- [ ] **Tâche 4 — Adaptation conditionnelle connecté / vitrine** (AC: 5) — **REVERT par décision utilisateur (2026-04-13)** : layout radial abandonné, donc la prop `centered` n'a plus lieu d'être. `FloatingCardsBackground` redevient sans prop.
  - [ ] 4.1 — Ajouter une prop `centered?: boolean` (default `false`) à `FloatingCardsBackground`. Quand `true` (branche connectée), applique le layout radial centré sur l'avatar. Quand `false`, conserve le comportement actuel.
  - [ ] 4.2 — Dans `ConnectedLanding.tsx` (Story 5.2), passer `centered={true}`. Dans `GuestLanding.tsx`, passer `centered={false}` (ou ne rien passer).
  - [ ] 4.3 — Alternative plus propre si le layout radial convient aussi à la vitrine : pas de prop, tout le monde utilise le layout radial. **Préférence** : ajouter la prop pour minimiser le risque de régression visuelle sur la vitrine.

- [x] **Tâche 5 — Accessibilité + polish** (AC: 7)
  - [x] 5.1 — Ajouter `aria-hidden="true"` sur le conteneur racine de `FloatingCardsBackground`.
  - [x] 5.2 — Vérifier que les cards ne reçoivent pas le focus clavier (elles sont des `<motion.div>` sans `tabIndex` — OK par défaut).

- [x] **Tâche 6 — Validation** (AC: 8)
  - [x] 6.1 — `npx tsc --noEmit` : zéro erreur.
  - [x] 6.2 — `npm run lint` : delta = 0.
  - [x] 6.3 — `npm run build` : succès (built in 470ms, 502 modules).
  - [ ] 6.4 — Test manuel : connecté → cards autour de l'avatar, placeholder → Spline transition fluide, launching → converging + explosion OK. Non-connecté → layout vitrine inchangé. *(À valider manuellement par Luca — voir Completion Notes)*

## Dev Notes

### Contraintes critiques

- **Framer Motion only** : toute animation reste via `motion.*`. Aucune CSS keyframe custom ajoutée dans Tailwind config pour cette story.
- **Le centre radial est calculé sur le viewport, pas sur le DOM de l'avatar** — c'est la clé de l'AC 3 (pas de saut au chargement Spline). Utiliser `position: absolute; left: 50%; top: 50%` comme ancre stable.
- **Ne pas toucher à la logique `launchPhase`** — elle est pilotée par `LandingPage.tsx` via la prop `launchPhase`. L'enfant ne connaît pas `AppScreen`.
- **Performances Spline + 10 cards animées** : si les deux combinés font chuter en dessous de 60 FPS, réduire le nombre de cards (10 → 8) ou la fréquence de rafraîchissement (`transition.duration` plus longue).

### Patterns à réutiliser

- **Layout radial** : calcul `cos(angle) * radius`, `sin(angle) * radius` — pattern classique, pas de lib externe nécessaire.
- **Position absolute centrée** : `absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2` — déjà employé dans [LandingPage.tsx:64](src/components/landing/LandingPage.tsx#L64).

### Project Structure Notes

Fichier modifié uniquement : [src/components/landing/FloatingCardsBackground.tsx](src/components/landing/FloatingCardsBackground.tsx).

Aucun nouveau fichier.

### References

- Epic Story 1.3 : [_bmad-output/planning-artifacts/epics.md](_bmad-output/planning-artifacts/epics.md)
- PRD FR7 / NFR6
- FloatingCardsBackground actuel : [src/components/landing/FloatingCardsBackground.tsx](src/components/landing/FloatingCardsBackground.tsx)
- Story 5.2 (dépendance) : [5-2-landing-connectee-avatar-play.md](_bmad-output/implementation-artifacts/5-2-landing-connectee-avatar-play.md)

## Dev Agent Record

### Agent Model Used

claude-opus-4-6

### Completion Notes List

**Résumé d'implémentation :**

- SAMPLE_QUESTIONS traduit en français (10 questions couvrant Géographie, Art, Histoire, Science, Littérature, Sport, Cinéma).
- Layout radial : calcul `cos(angle) * RADIUS_X, sin(angle) * RADIUS_Y` avec `RADIUS_X=34`, `RADIUS_Y=32` (augmentés par rapport à l'exemple 32/28 de la story pour un gap visuel plus sûr avec l'avatar `w-80`). Angle parfaitement réparti (pas de jitter sur la position — jitter conservé seulement sur `angle` pour la trajectoire d'explosion).
- Ancrage viewport : rendu inchangé via `absolute left-1/2 top-1/2` + `calc(${x}vw - 50%)`. Déjà indépendant du DOM de l'avatar — AC 3 satisfait par construction.
- Animations `idle` (floatY, floatRotation, duration, delay) et `launchPhase` (`converging`, `shaking`, `exploding`) préservées à l'identique.
- Prop `centered?: boolean` (default `false`) ajoutée. Passée depuis `LandingPage.tsx` via `centered={!!user}` — **déviation par rapport à Task 4.2** : plutôt que de déplacer `FloatingCardsBackground` dans `ConnectedLanding`/`GuestLanding`, la prop est propagée depuis le parent. Raison : le wrapper `motion.div` avec `shakeControls` (animation de shake au launching) est défini dans `LandingPage.tsx` et encapsule les cards ; déplacer les cards dans les sous-composants casserait l'architecture de shake partagé. Le résultat fonctionnel est identique à l'intention de la story.
- `aria-hidden="true"` ajouté sur le conteneur racine. Les `<motion.div>` n'ont pas de `tabIndex` → non focusables par défaut.

**Mise à jour 2026-04-13 (décision produit Luca) :**

Le layout radial autour de l'avatar a été testé puis **retiré** : visuel jugé non satisfaisant. `FloatingCardsBackground` revient à l'ancien layout `POSITIONS` (les 10 positions dispersées d'origine). Les acquis conservés de cette story sont :
- Traduction FR des 10 questions (AC 6) ✅
- `aria-hidden="true"` sur le conteneur (AC 7) ✅
- Comportement `launchPhase` intact (AC 4) ✅
- Qualité gates (AC 8) ✅

Acceptance Criteria **non satisfaits** suite au revert : AC 1 (cards radiales autour avatar), AC 3 (ancrage radial stable), AC 5 (adaptation conditionnelle connecté/vitrine). Ces AC sont à re-discuter en planning — potentiellement une nouvelle story si un autre traitement visuel autour de l'avatar est souhaité.

**Validations manuelles (Luca, 2026-04-13) :**

- [x] Comportement `launching` préservé (converging → shake → explosion) ✅
- [x] Layout vitrine (non-connecté) inchangé ✅
- [x] Cards FR cohérentes avec les catégories Pulse Quizz ✅
- [x] Pas de focus clavier sur les cards, `aria-hidden` OK ✅

### File List

**Modifiés (état final après revert) :**
- `src/components/landing/FloatingCardsBackground.tsx` — traduction FR des 10 questions + `aria-hidden="true"` sur le conteneur. Layout `POSITIONS` d'origine conservé. Pas de prop `centered`.
- `src/components/landing/LandingPage.tsx` — **aucun changement net** (la prop `centered={!!user}` a été ajoutée puis retirée suite au revert).

**Non modifiés :**
- ~~`src/components/landing/ConnectedLanding.tsx`~~
- ~~`src/components/landing/GuestLanding.tsx`~~

## Change Log

| Date       | Auteur        | Changement                                                                                             |
| ---------- | ------------- | ------------------------------------------------------------------------------------------------------ |
| 2026-04-13 | Amelia (IA)   | Implémentation Story 5.3 : layout radial autour avatar, prop `centered`, traduction FR, `aria-hidden`. |
| 2026-04-13 | Amelia + Luca | **Revert layout radial** — décision produit : visuel non satisfaisant. Conservés : traduction FR + `aria-hidden`. AC 1/3/5 non satisfaits (à rediscuter). |

