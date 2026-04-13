---
stepsCompleted: ['step-01-init', 'step-02-discovery', 'step-02b-vision', 'step-02c-executive-summary', 'step-03-success', 'step-04-journeys', 'step-05-domain', 'step-06-innovation', 'step-07-project-type', 'step-08-scoping', 'step-09-functional', 'step-10-nonfunctional', 'step-11-polish', 'step-12-complete']
status: 'complete'
completedAt: '2026-04-12'
inputDocuments:
  - _bmad-output/project-context.md
  - _bmad-output/planning-artifacts/architecture.md
workflowType: 'prd'
project_name: 'Pulse Quizz'
user_name: 'Luca'
date: '2026-04-12'
classification:
  projectType: 'web_app'
  domain: 'entertainment_gaming_casual'
  complexity: 'low'
  projectContext: 'brownfield'
---

# Product Requirements Document - Pulse Quizz

**Author:** Luca
**Date:** 2026-04-12

## Executive Summary

Pulse Quizz est une web app de quiz compétitif en français. L'application propose deux modes — normal (10 questions) et compétitif (questions infinies, scoring basé sur la rapidité, classement global). Le projet est en production avec auth Supabase, leaderboard, stats par catégorie et système d'achievements.

**Cette itération** transforme l'expérience utilisateur en posant les fondations de l'identité joueur. La landing page est refondée pour placer un avatar personnage au centre de l'expérience, différencier clairement l'état connecté (accès au jeu, avatar, stats) de l'état non-connecté (page vitrine incitant à l'inscription), et enrichir le header avec des labels explicites. L'objectif stratégique : créer le socle d'identité nécessaire avant d'ajouter la personnalisation d'avatar et le multijoueur.

### Ce qui rend ce produit spécial

Les features sociales et compétitives (multijoueur, défis entre amis, personnalisation) ne fonctionnent que si le joueur a d'abord une identité dans le jeu. L'avatar n'est pas cosmétique — c'est le point d'ancrage émotionnel qui transforme un quiz anonyme en "chez soi". La progression future débloquera de la personnalisation, créant une boucle de rétention naturelle : jouer → progresser → personnaliser → revenir jouer.

## Project Classification

| Attribut | Valeur |
|---|---|
| Type de projet | Web App (SPA React) |
| Domaine | Entertainment / Gaming casual |
| Complexité | Basse |
| Contexte | Brownfield — projet existant en production |

## Success Criteria

### User Success

- **Effet "wow"** — La landing connectée avec avatar central et cards flottantes crée un impact visuel immédiat.
- **Clarté de navigation** — Les icônes du header avec labels sont comprises sans hésitation.
- **Conversion non-connecté** — La page vitrine explique le jeu et donne envie de s'inscrire. CTA évident et accessible.
- **Flow Play préservé** — Le joueur connecté trouve le bouton Play instantanément, sans friction supplémentaire.

### Business Success

- **Fondation posée** — L'architecture avatar est extensible pour la personnalisation et le multijoueur sans refonte.
- **Inscription encouragée** — L'expérience non-connectée pousse vers la création de compte (compétitif, stats et avatar réservés aux connectés).
- **Pas de régression** — Tous les flows existants (normal, compétitif, stats, achievements, profil) fonctionnent.

### Technical Success

- **Performance** — Cibles détaillées dans les NFRs (NFR1-NFR7).
- **Composant avatar découplé** — Isolé, remplaçable (props-driven), prêt pour la personnalisation future.
- **Zéro erreur TypeScript** — `npx tsc --noEmit` passe sans erreur après chaque changement.
- **Build clean** — `npm run build` produit un bundle fonctionnel sans warning.

## Product Scope & Roadmap

### MVP Strategy

**Approche :** Experience MVP — transformer le feeling de l'app. Le joueur doit sentir que Pulse Quizz a changé de dimension en ouvrant la landing.

**Ressources :** Développeur solo (Luca). Design guidé par l'inspiration GeoGuessr et la palette existante.

### MVP Feature Set (Phase 1)

**User Journeys supportées :** Théo (découverte → inscription), Sarah (rétention → Play rapide), Lucas (anonyme → conversion), Maxime (compétiteur → leaderboard).

**Must-Have Capabilities :**
1. Landing connectée : avatar générique Spline centré + floating cards autour + bouton Play
2. Landing non-connectée : hero + sections explicatives + CTA inscription/connexion
3. Header enrichi : icônes + labels texte, taille augmentée
4. Blocage mode compétitif pour anonymes (normal accessible)
5. Message de transition pour joueurs anonymes existants (détection localStorage)
6. Composant avatar découplé et lazy-loaded

### Phase 2 — Personnalisation (Post-MVP)

- Personnalisation avatar (accessoires, couleurs, items)
- Déblocage lié à la progression (achievements, streaks)
- Page dédiée customisation avatar
- Responsive mobile

### Phase 3 — Social & Multijoueur

- Multijoueur temps réel avec avatars visibles
- Défis entre amis
- Marketplace cosmétiques
- Avatar réactif pendant le quiz

### Risk Mitigation

**Risque technique — Performance Spline :**
Tester Spline en premier (choix PO). Mesurer bundle size gzipped + temps chargement 4G. Si > 3s ou > 200 KB : fallback vers SVG animé Framer Motion. Le composant avatar découplé rend le remplacement chirurgical.

**Risque UX — Transition joueurs anonymes :**
Mode normal reste accessible sans compte. Message dédié détecté via localStorage. Incitations douces post-partie, pas de blocage agressif.

**Risque ressource — Développeur solo :**
Scope MVP serré (pas de personnalisation, pas de mobile). Chaque capability est indépendante — livrable incrémentalement.

## User Journeys

### Journey 1 — Théo, le nouveau joueur (découverte via un ami)

**Qui :** Théo, 24 ans. Son pote Maxime lui envoie un lien : "Essaie Pulse Quizz, j'ai un score de fou en compétitif."

**Opening Scene :** Théo ouvre le lien. Il tombe sur la landing non-connectée : hero avec le logo, fond sombre avec des cards de questions qui flottent, sections expliquant le concept en dessous.

**Rising Action :** Il scrolle, comprend le principe. "Mode Compétitif — affrontez les meilleurs" l'intrigue. Il clique "S'inscrire", crée un compte. La page se transforme — avatar générique au centre, cards flottantes autour, bouton Play en dessous.

**Climax :** Il lance un compétitif. 8 bonnes réponses, multiplicateurs de vitesse. Maxime est 15ème — Théo finit 23ème.

**Resolution :** Il revient le lendemain. Son avatar l'accueille. Il relance une partie pour dépasser Maxime.

**Capabilities :** Page vitrine convaincante, inscription fluide, transition non-connecté → connecté immédiate, avatar visible dès la première connexion.

### Journey 2 — Sarah, la joueuse régulière (rétention)

**Qui :** Sarah, 29 ans. 6 achievements débloqués, 42ème au classement compétitif.

**Opening Scene :** Sarah ouvre Pulse Quizz en pause déjeuner. Avatar au centre, floating cards autour. Header avec "Stats", "Profil", "Achievements" clairement labellisés.

**Rising Action :** Elle clique Play, SettingsModal s'ouvre. Compétitif. 12 bonnes réponses — nouveau record.

**Climax :** RankingRevealScreen : 42ème → 31ème. Achievement "Série de 10" débloqué.

**Resolution :** Retour à la landing. Avatar toujours là. "Ce serait cool de le personnaliser." Boucle de rétention en place.

**Capabilities :** Accès rapide au Play, header avec labels clairs, avatar comme ancre visuelle.

### Journey 3 — Lucas, le joueur anonyme existant (transition)

**Qui :** Lucas, 21 ans. Jouait en mode normal sans compte depuis 1 mois.

**Opening Scene :** Lucas ouvre l'app après la mise à jour. Page vitrine non-connectée avec message dédié : "Tu jouais déjà ? Crée un compte pour le compétitif, les stats et ton avatar."

**Rising Action :** Il peut toujours jouer en mode normal — bouton Play accessible, mention "Mode Normal uniquement". Il fait une partie.

**Climax :** Écran de résultat : "Crée un compte pour sauvegarder tes scores et accéder au compétitif." Il se décide.

**Resolution :** Avatar apparaît. Accès compétitif, stats cloud, achievements. Transition réussie.

**Capabilities :** Détection joueur anonyme (localStorage), message de transition dédié, mode normal sans compte, incitations douces post-partie.

### Journey 4 — Maxime, le compétiteur (leaderboard-first)

**Qui :** Maxime, 27 ans. 15ème au classement mondial. Ouvre l'app chaque jour pour défendre sa position.

**Opening Scene :** Avatar au centre. Regard direct au header → clic "Stats".

**Rising Action :** Passé 17ème — deux joueurs l'ont dépassé. Retour à la landing, Play, compétitif.

**Climax :** 19 bonnes réponses, temps < 3s. Remonte 12ème — nouveau record.

**Resolution :** Satisfait. Reviendra demain vérifier sa position.

**Capabilities :** Navigation rapide header → Stats, retour facile landing, flow Play optimisé pour sessions répétées.

### Journey Requirements Summary

| Capability | Journeys |
|---|---|
| Page vitrine non-connectée (hero + sections + CTA) | Théo, Lucas |
| Message de transition joueur anonyme existant | Lucas |
| Avatar générique centré (landing connectée) | Théo, Sarah, Maxime |
| Floating cards autour de l'avatar | Théo, Sarah, Maxime |
| Bouton Play sous l'avatar → SettingsModal | Tous (connectés) |
| Header enrichi avec labels | Sarah, Maxime |
| Mode normal accessible sans compte | Lucas |
| Blocage compétitif sans compte + incitations | Lucas, Théo |
| Transition inscription → avatar visible | Théo, Lucas |

## Web App — Requirements Techniques

### Overview

SPA React sans router, navigation par state machine (`setScreen`). Desktop-first, navigateurs modernes (Chrome, Firefox, Safari, Edge). Mobile non prioritaire.

### Responsive Design

- **Desktop-first** — Pas de layout mobile dédié dans cette itération.
- **Breakpoints Tailwind** — Rendu correct sur différentes tailles d'écran desktop.

### SEO Strategy

- Lighthouse SEO 100/100 à maintenir.
- Page vitrine non-connectée indexable : balises meta, titre, description, structure sémantique HTML.
- Contenu des sections explicatives dans le HTML initial (pas de fetch dynamique).

### Accessibility

- Pas une priorité. Minimum basique : contrastes (palette `game-*`), navigation clavier sur les CTA principaux.

### Implementation Considerations

- **Composant avatar** : lazy-loaded, placeholder d'abord, contenu 3D/2D ensuite.
- **Page vitrine** : contenu statique dans le JSX, favorable au SEO.
- **SPA pure** : pas de SSR/SSG. SEO via meta tags et contenu inline.

## Functional Requirements

### Identité Joueur (Avatar)

- **FR1 :** Le joueur connecté peut voir son avatar générique au centre de la landing page
- **FR2 :** Le système affiche l'avatar avec un chargement progressif (placeholder puis contenu final)
- **FR3 :** Le composant avatar accepte des paramètres de personnalisation (préparation future, non exposés dans cette itération)

### Landing Page — État Connecté

- **FR4 :** Le joueur connecté peut voir la landing avec avatar centré entouré de floating cards de questions
- **FR5 :** Le joueur connecté peut accéder au jeu via un bouton Play visible sous l'avatar
- **FR6 :** Le bouton Play ouvre le SettingsModal comme actuellement
- **FR7 :** Le joueur connecté peut voir les floating cards tourner/flotter autour de l'avatar

### Landing Page — État Non-Connecté (Vitrine)

- **FR8 :** Le visiteur non-connecté peut voir une page vitrine avec section hero présentant Pulse Quizz
- **FR9 :** Le visiteur non-connecté peut découvrir les fonctionnalités via des sections explicatives en scrollant (quiz, compétition, achievements)
- **FR10 :** Le visiteur non-connecté peut accéder à l'inscription ou la connexion via des CTA visibles
- **FR11 :** Le visiteur non-connecté ne peut pas accéder au mode compétitif
- **FR12 :** Le visiteur non-connecté peut jouer en mode normal sans créer de compte

### Transition Joueurs Anonymes Existants

- **FR13 :** Le système détecte les joueurs anonymes existants (via données localStorage)
- **FR14 :** Le joueur anonyme existant peut voir un message de transition dédié l'incitant à créer un compte
- **FR15 :** Le joueur anonyme existant peut continuer à jouer en mode normal sans compte
- **FR16 :** Le système affiche une incitation à l'inscription après une partie en mode normal (écran de résultat)

### Navigation (Header)

- **FR17 :** Le joueur peut voir un header enrichi sur la landing avec icônes accompagnées de labels texte
- **FR18 :** Le joueur connecté peut naviguer vers les Stats depuis le header
- **FR19 :** Le joueur connecté peut naviguer vers le Profil depuis le header
- **FR20 :** Le joueur connecté peut naviguer vers les Achievements depuis le header
- **FR21 :** Le header affiche le logo Pulse Quizz

### Authentification & Conversion

- **FR22 :** Le visiteur non-connecté peut créer un compte depuis la page vitrine
- **FR23 :** Le visiteur non-connecté peut se connecter depuis la page vitrine
- **FR24 :** Après inscription/connexion, le joueur voit immédiatement la landing connectée avec son avatar

## Non-Functional Requirements

### Performance

- **NFR1 :** First Contentful Paint de la landing < 2 secondes
- **NFR2 :** Temps de chargement complet de la landing (incluant avatar Spline) < 3 secondes en 4G throttled
- **NFR3 :** Bundle size additionnel du composant avatar < 200 KB gzipped
- **NFR4 :** Lighthouse Performance > 90
- **NFR5 :** Lighthouse SEO = 100
- **NFR6 :** Animations (floating cards, avatar) à 60 FPS sans jank sur desktop moderne
- **NFR7 :** Chargement avatar non-bloquant — page utilisable (header, bouton Play) avant rendu complet de l'avatar

### Security

- **NFR8 :** Authentification exclusivement via Supabase Auth — pas de gestion custom de sessions ou tokens
- **NFR9 :** Blocage du mode compétitif pour les anonymes appliqué côté client ET vérifié côté serveur (RLS Supabase)

### Intégration

- **NFR10 :** Composant avatar chargé en lazy-loading via `React.lazy` — l'échec de chargement ne casse pas la landing (fallback vers placeholder)
