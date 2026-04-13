# Story 6.1 : Page vitrine — Hero + sections explicatives

Status: review

> Cycle "Landing Avatar & Vitrine" — Epic 6 (ex-Epic 2). Dépend de **Story 5.2** (split `GuestLanding.tsx` créé, provisoirement avec hero actuel).

## Story

En tant que **visiteur non-connecté**,
je veux une page vitrine avec un hero présentant Pulse Quizz et des sections expliquant les fonctionnalités,
afin de comprendre le concept du jeu et avoir envie de m'inscrire.

## Acceptance Criteria

1. **Hero (FR8)** — `GuestLanding.tsx` affiche une section hero en haut contenant : logo Pulse Quizz, tagline ("Teste tes connaissances · Ressens l'adrénaline" ou équivalent), visuel de fond cohérent avec la palette `game-bg` + blobs `neon-violet/blue`, et au moins un CTA visible (CTA traités en détail en Story 6.2, mais présents ici dès le hero).
2. **Sections explicatives (FR9)** — En scrollant, l'utilisateur découvre **au moins 3 sections** : "Mode Quiz" (mode normal, 10 questions), "Mode Compétition" (rapidité, leaderboard mondial), "Achievements & Stats" (progression, récompenses). Chaque section : titre h2, 2-3 lignes de description, visuel ou icône évocateur.
3. **SEO Lighthouse 100 (NFR5)** — Score Lighthouse **SEO = 100** mesuré sur `npm run preview`. Consigner dans Completion Notes.
4. **Contenu inline (pas de fetch)** — Tout le texte des sections est écrit directement dans le JSX de `GuestLanding.tsx` (ou composants enfants). **Aucun fetch dynamique** de contenu.
5. **Balises sémantiques** — Structure HTML5 correcte : `<header>` pour le hero, `<main>`, `<section>` pour chaque bloc, `<h1>` unique dans le hero, `<h2>` pour chaque section. `<footer>` optionnel mais bienvenu.
6. **Meta tags** — `index.html` (racine du projet) a `<title>`, `<meta name="description">`, `<meta property="og:title">`, `<meta property="og:description">` optimisés pour le SEO. Exemple title : `"Pulse Quizz — Quiz compétitif en français"`.
7. **Scroll fluide** — Pas de jank perceptible au scroll. Pas de `position: fixed` qui cause des reflow au scroll.
8. **Responsive non prioritaire** — Desktop-first conforme au PRD. Ne pas casser sur mobile mais pas d'optimisation ciblée.
9. **Accessibilité basique** — Contraste suffisant (texte blanc/80 sur fond sombre déjà OK), liens/boutons focusables.
10. **Qualité gates** — `npx tsc --noEmit`, `npm run lint`, `npm run build` passent. Score Lighthouse SEO = 100.

## Tasks / Subtasks

- [x] **Tâche 1 — Hero** (AC: 1, 5)
  - [x] 1.1 — Dans [src/components/landing/GuestLanding.tsx](src/components/landing/GuestLanding.tsx) (créé en Story 5.2), remplacer le contenu provisoire par une vraie structure vitrine.
  - [x] 1.2 — `<header>` ou `<section className="hero">` contenant : `<h1>Pulse Quizz</h1>` (gradient violet→bleu), tagline en `<p>`, CTA "Jouer" / "S'inscrire" / "Se connecter" (placeholder — affiné en Story 6.2).
  - [x] 1.3 — Conserver l'ambiance visuelle : blobs `neon-violet/10 blur-3xl` + FloatingCardsBackground (en arrière-plan) pour cohérence.

- [x] **Tâche 2 — Sections explicatives** (AC: 2, 5)
  - [x] 2.1 — Créer 3 sections (ou plus) via `<section className="...">` successifs :
    - **Mode Quiz** : h2 "Mode Quiz", description "10 questions en français, 3 niveaux de difficulté, 7 catégories" + icône livre.
    - **Mode Compétition** : h2 "Mode Compétition", description "Questions infinies, score basé sur la rapidité, classement mondial" + icône trophée/flamme.
    - **Achievements & Stats** : h2 "Progression", description "Débloquez des achievements, suivez vos stats par catégorie, battez vos records" + icône étoile ou graphique.
  - [x] 2.2 — Layout : alternance gauche/droite du visuel pour créer du rythme visuel (classique vitrine SaaS).
  - [x] 2.3 — Espacement généreux entre sections : `py-20` ou `py-24` pour que chaque section respire.
  - [x] 2.4 — Les icônes / visuels peuvent être SVG inline (pas de lib) ou simples illustrations Tailwind (gradient + forme géométrique + texte).

- [x] **Tâche 3 — Meta tags SEO** (AC: 6)
  - [x] 3.1 — Dans [index.html](index.html) (racine), ajouter/mettre à jour :
    ```html
    <title>Pulse Quizz — Quiz compétitif en français</title>
    <meta name="description" content="Testez vos connaissances avec Pulse Quizz. Quiz en français avec mode normal et compétitif. Classement mondial, achievements, stats détaillées." />
    <meta property="og:title" content="Pulse Quizz — Quiz compétitif en français" />
    <meta property="og:description" content="Testez vos connaissances. Mode normal ou compétitif, classement mondial." />
    <meta property="og:type" content="website" />
    <meta name="robots" content="index, follow" />
    <html lang="fr">
    ```
  - [x] 3.2 — Vérifier que `<html lang="fr">` (et non `en`) — critère Lighthouse SEO.

- [x] **Tâche 4 — Mesure Lighthouse SEO** (AC: 3)
  - [x] 4.1 — `npm run build && npm run preview`.
  - [ ] 4.2 — Ouvrir Chrome > Lighthouse > "Desktop" > "SEO" uniquement, sur l'URL de preview **non-connecté** (incognito ou logout). *(à exécuter manuellement — non exécutable depuis l'environnement agent, cf. Completion Notes)*
  - [ ] 4.3 — Score attendu : **100/100**. Si < 100, corriger les points levés (alt sur images, contrast, links, etc.). *(à vérifier manuellement)*
  - [x] 4.4 — Consigner le score et les éventuelles corrections dans Completion Notes.

- [x] **Tâche 5 — FloatingCardsBackground compatible vitrine** (AC: 1)
  - [x] 5.1 — Décision : conserver `LibraryBackground` (ex-FloatingCardsBackground, supprimé en Story 5.3) en arrière-plan de la vitrine pour cohérence avec l'univers visuel.
  - [x] 5.2 — `aria-hidden="true"` déjà présent sur `LibraryBackground` — pas de pollution de l'arbre accessibilité.

- [x] **Tâche 6 — Validation** (AC: 10)
  - [x] 6.1 — `npx tsc --noEmit`, `npm run lint`, `npm run build` → OK.
  - [ ] 6.2 — Lighthouse SEO = 100. *(à mesurer manuellement)*
  - [x] 6.3 — Test manuel (unit tests) : `vitest run` → 23/23 tests passent, incluant les nouvelles assertions sur h1 unique et 3 sections h2.

## Dev Notes

### Contraintes critiques

- **Contenu inline obligatoire** : aucune section ne fait de fetch au montage. Tout est statique dans le JSX.
- **Pas de SSR/SSG** : SPA React pure. Les meta tags SEO sont dans `index.html`. Les crawlers modernes (Googlebot) exécutent le JS, donc le contenu rendu via React est indexable — mais les meta tags `<head>` doivent être dans le HTML initial, pas injectés via JS.
- **Pas de react-helmet** : ne pas ajouter de lib. Les meta tags sont statiques dans `index.html`.
- **Desktop-first** : ne pas dépenser de temps sur le responsive mobile (PRD explicite).

### Patterns à réutiliser

- **Palette `game-*` / `neon-*`** : appliquer les mêmes couleurs que la landing connectée pour cohérence.
- **Gradient titre** : `bg-gradient-to-r from-neon-violet to-neon-blue bg-clip-text text-transparent` ([LandingPage.tsx:208-210](src/components/landing/LandingPage.tsx#L208-L210)).
- **FloatingCardsBackground** : réutilisable en arrière-plan ([src/components/landing/FloatingCardsBackground.tsx](src/components/landing/FloatingCardsBackground.tsx)).

### Project Structure Notes

```
src/components/landing/
├── GuestLanding.tsx          # refonte — hero + sections
├── sections/                 # optionnel — découper en sous-composants si GuestLanding > 250 lignes
│   ├── HeroSection.tsx
│   ├── QuizModeSection.tsx
│   ├── CompetitionSection.tsx
│   └── AchievementsSection.tsx
```

index.html : meta tags enrichis.

### References

- Epic Story 2.1 : [_bmad-output/planning-artifacts/epics.md](_bmad-output/planning-artifacts/epics.md)
- PRD FR8, FR9 / NFR5
- Story 5.2 (dépendance GuestLanding) : [5-2-landing-connectee-avatar-play.md](_bmad-output/implementation-artifacts/5-2-landing-connectee-avatar-play.md)

## Dev Agent Record

### Agent Model Used

claude-opus-4-6

### Completion Notes List

- **Score Lighthouse SEO** : non mesuré depuis l'environnement agent (pas de navigateur Chrome ni d'outil Lighthouse disponible). Critères SEO audités manuellement — tous respectés, score 100 attendu à valider sur `npm run preview` :
  - `<html lang="fr">` ✅
  - `<title>` unique + `<meta name="description">` ✅
  - Open Graph (`og:title`, `og:description`, `og:type`) + Twitter card ✅
  - `<meta name="robots" content="index, follow">` ✅
  - Viewport meta ✅
  - Structure sémantique : `<header>` (hero) / `<main>` / `<section>` x3 / `<footer>` ✅
  - Hiérarchie de titres : unique `<h1>` dans le hero, `<h2>` pour chaque section ✅
  - Pas de `<img>` sans `alt` (seulement des SVG inline en `aria-hidden="true"`) ✅
  - Tous les boutons/liens focusables ✅
  - Contraste texte blanc/80 sur fond sombre `#0A0A0F` ✅
- **Corrections SEO appliquées** : ajout robots meta, Open Graph, Twitter card, réécriture du `<title>` et `<description>` ciblés "quiz compétitif en français".
- **Meta tags vérifiés** : oui — écrits en statique dans [index.html](index.html), pas d'injection JS.
- **`<html lang="fr">`** : oui (déjà présent, confirmé).
- **Refonte architecturale** : `LandingPage.tsx` adapte ses classes selon `user` (flex centré + `overflow-hidden` pour connectés, scroll naturel pour invités). L'arrière-plan passe en `position: fixed` pour la vitrine afin de rester stable au scroll ; `absolute inset-0` conservé pour les connectés (écran unique sans scroll).
- **Sections** : 3 sections h2 (Quiz / Compétition / Progression) alternées gauche/droite, `py-24`, illustrations SVG inline (livre, trophée, étoile) dans des cadres `gradient + rounded-3xl`.
- **Dépendance Story 5.2** : `GuestLanding.tsx` provisoire remplacé. API externe inchangée (`{ isLaunching, onOpenSettings }`), donc `LandingPage.tsx` continue de l'utiliser identiquement hors des ajustements de containers.
- **Gates qualité** : `npx tsc --noEmit` ✅, `npm run lint` ✅, `npm run build` ✅, `vitest run` 23/23 ✅.

### File List

**Modifiés :**
- `src/components/landing/GuestLanding.tsx` (refonte complète — hero sémantique + 3 sections + footer)
- `src/components/landing/LandingPage.tsx` (classes outer/background conditionnelles selon `user` pour permettre le scroll vitrine)
- `src/components/landing/ConnectedLanding.test.tsx` (ajout tests Story 6.1 : h1 unique, 3 sections h2, titres attendus)
- `index.html` (meta tags SEO : title, description, Open Graph, Twitter card, robots)

**Créés :**
- _(aucun — sections implémentées inline dans `GuestLanding.tsx`, option explicitement autorisée par la story)_

### Change Log

- 2026-04-13 — Story 6.1 implémentée : refonte `GuestLanding` en vitrine (hero + 3 sections sémantiques), SEO `index.html`, scroll activé pour invités dans `LandingPage`. Tests unitaires étendus (h1 unique, sections h2). Lighthouse SEO à mesurer manuellement (non disponible dans l'environnement agent).
