---
stepsCompleted: ['step-01-validate-prerequisites', 'step-02-design-epics', 'step-03-create-stories', 'step-04-final-validation']
status: 'complete'
completedAt: '2026-04-12'
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/architecture.md
workflowType: 'epics-and-stories'
project_name: 'Pulse Quizz'
user_name: 'Luca'
date: '2026-04-12'
---

# Pulse Quizz - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for Pulse Quizz, decomposing the requirements from the PRD and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

**Identité Joueur (Avatar)**
- **FR1 :** Le joueur connecté peut voir son avatar générique au centre de la landing page
- **FR2 :** Le système affiche l'avatar avec un chargement progressif (placeholder puis contenu final)
- **FR3 :** Le composant avatar accepte des paramètres de personnalisation (préparation future, non exposés dans cette itération)

**Landing Page — État Connecté**
- **FR4 :** Le joueur connecté peut voir la landing avec avatar centré entouré de floating cards de questions
- **FR5 :** Le joueur connecté peut accéder au jeu via un bouton Play visible sous l'avatar
- **FR6 :** Le bouton Play ouvre le SettingsModal comme actuellement
- **FR7 :** Le joueur connecté peut voir les floating cards tourner/flotter autour de l'avatar

**Landing Page — État Non-Connecté (Vitrine)**
- **FR8 :** Le visiteur non-connecté peut voir une page vitrine avec section hero présentant Pulse Quizz
- **FR9 :** Le visiteur non-connecté peut découvrir les fonctionnalités via des sections explicatives en scrollant (quiz, compétition, achievements)
- **FR10 :** Le visiteur non-connecté peut accéder à l'inscription ou la connexion via des CTA visibles
- **FR11 :** Le visiteur non-connecté ne peut pas accéder au mode compétitif
- **FR12 :** Le visiteur non-connecté peut jouer en mode normal sans créer de compte

**Transition Joueurs Anonymes Existants**
- **FR13 :** Le système détecte les joueurs anonymes existants (via données localStorage)
- **FR14 :** Le joueur anonyme existant peut voir un message de transition dédié l'incitant à créer un compte
- **FR15 :** Le joueur anonyme existant peut continuer à jouer en mode normal sans compte
- **FR16 :** Le système affiche une incitation à l'inscription après une partie en mode normal (écran de résultat)

**Navigation (Header)**
- **FR17 :** Le joueur peut voir un header enrichi sur la landing avec icônes accompagnées de labels texte
- **FR18 :** Le joueur connecté peut naviguer vers les Stats depuis le header
- **FR19 :** Le joueur connecté peut naviguer vers le Profil depuis le header
- **FR20 :** Le joueur connecté peut naviguer vers les Achievements depuis le header
- **FR21 :** Le header affiche le logo Pulse Quizz

**Authentification & Conversion**
- **FR22 :** Le visiteur non-connecté peut créer un compte depuis la page vitrine
- **FR23 :** Le visiteur non-connecté peut se connecter depuis la page vitrine
- **FR24 :** Après inscription/connexion, le joueur voit immédiatement la landing connectée avec son avatar

### NonFunctional Requirements

**Performance**
- **NFR1 :** First Contentful Paint de la landing < 2 secondes
- **NFR2 :** Temps de chargement complet de la landing (incluant avatar Spline) < 3 secondes en 4G throttled
- **NFR3 :** Bundle size additionnel du composant avatar < 200 KB gzipped
- **NFR4 :** Lighthouse Performance > 90
- **NFR5 :** Lighthouse SEO = 100
- **NFR6 :** Animations (floating cards, avatar) à 60 FPS sans jank sur desktop moderne
- **NFR7 :** Chargement avatar non-bloquant — page utilisable (header, bouton Play) avant rendu complet de l'avatar

**Security**
- **NFR8 :** Authentification exclusivement via Supabase Auth — pas de gestion custom de sessions ou tokens
- **NFR9 :** Blocage du mode compétitif pour les anonymes appliqué côté client ET vérifié côté serveur (RLS Supabase)

**Intégration**
- **NFR10 :** Composant avatar chargé en lazy-loading via `React.lazy` — l'échec de chargement ne casse pas la landing (fallback vers placeholder)

### Additional Requirements

**Contexte brownfield — pas de starter template requis.** Le projet est en production avec stack figée (React 19.2.4, TypeScript 6.0.2, Vite 8.0.4, Tailwind 3.4.19, Framer Motion 12.38.0, Supabase JS 2.103.0).

**Architecture — contraintes d'implémentation :**
- Composant avatar dans un nouveau dossier `src/components/avatar/` avec AvatarDisplay découplé (props-driven, extensible pour personnalisation future)
- Avatar lazy-loaded via `React.lazy` + `Suspense` avec fallback placeholder
- Refonte `LandingPage.tsx` en deux branches conditionnelles selon `user` de `useAuth()` : landing connectée vs vitrine non-connectée
- Détection joueur anonyme existant : utilitaire dans `utils/statsStorage.ts` (ou nouveau fichier) lisant les clés `pulse_stats_*` du localStorage
- Blocage compétitif côté serveur : policy RLS sur table `leaderboard` filtrant `INSERT` par `auth.uid() IS NOT NULL` (à vérifier/ajouter dans `scripts/supabase_schema.sql`)
- Page vitrine : contenu sémantique HTML statique inline pour SEO Lighthouse 100
- Header : composant partagé (ou extension du header landing actuel) avec icônes + labels, utilisé sur la landing connectée
- Frontière respectée : Supabase jamais appelé depuis composants — passer par `useAuth()` et services existants
- Gate qualité : `npx tsc --noEmit` + `npm run lint` + `npm run build` après chaque story
- Tests Vitest co-localisés (si logique métier nouvelle extraite en hook/service)

### UX Design Requirements

_Aucun document UX Design dédié fourni. Les indications visuelles (avatar centré, floating cards, inspiration GeoGuessr, palette `game-*`/`neon-*`) sont capturées dans le PRD et seront raffinées lors de l'implémentation des stories._

### FR Coverage Map

| FR | Epic | Description courte |
|---|---|---|
| FR1 | Epic 1 | Avatar générique centré (landing connectée) |
| FR2 | Epic 1 | Chargement progressif de l'avatar (placeholder → contenu) |
| FR3 | Epic 1 | Avatar accepte paramètres de personnalisation (props future-ready) |
| FR4 | Epic 1 | Landing avec avatar centré + floating cards autour |
| FR5 | Epic 1 | Bouton Play sous l'avatar |
| FR6 | Epic 1 | Bouton Play ouvre SettingsModal |
| FR7 | Epic 1 | Floating cards qui tournent/flottent autour de l'avatar |
| FR8 | Epic 2 | Page vitrine — section hero |
| FR9 | Epic 2 | Page vitrine — sections explicatives (quiz, compétition, achievements) |
| FR10 | Epic 2 | Page vitrine — CTA inscription/connexion |
| FR11 | Epic 2 | Blocage mode compétitif pour non-connectés |
| FR12 | Epic 2 | Mode normal accessible sans compte |
| FR13 | Epic 3 | Détection joueur anonyme existant (localStorage) |
| FR14 | Epic 3 | Message de transition dédié |
| FR15 | Epic 3 | Mode normal toujours jouable sans compte |
| FR16 | Epic 3 | Incitation inscription post-partie (écran résultat) |
| FR17 | Epic 1 | Header enrichi avec icônes + labels |
| FR18 | Epic 1 | Navigation Stats depuis le header |
| FR19 | Epic 1 | Navigation Profil depuis le header |
| FR20 | Epic 1 | Navigation Achievements depuis le header |
| FR21 | Epic 1 | Logo Pulse Quizz dans le header |
| FR22 | Epic 2 | Inscription depuis la page vitrine |
| FR23 | Epic 2 | Connexion depuis la page vitrine |
| FR24 | Epic 2 | Redirection landing connectée post-auth |

## Epic List

### Epic 1 : Landing Connectée — Avatar, Play & Navigation

Le joueur connecté ouvre l'app et voit son avatar générique centré entouré de floating cards de questions, accède immédiatement au jeu via un bouton Play sous l'avatar, et navigue vers Stats, Profil et Achievements depuis un header enrichi d'icônes et de labels texte.

**FRs couverts :** FR1, FR2, FR3, FR4, FR5, FR6, FR7, FR17, FR18, FR19, FR20, FR21
**NFRs associés :** NFR1, NFR2, NFR3, NFR4, NFR6, NFR7, NFR10

### Epic 2 : Page Vitrine Non-Connectée & Conversion

Le visiteur non-connecté découvre Pulse Quizz via une page vitrine convaincante (hero + sections explicatives), peut créer un compte ou se connecter via des CTA clairs, et arrive immédiatement sur la landing connectée après authentification. Le mode compétitif est réservé aux comptes (blocage client + RLS serveur), le mode normal reste accessible sans compte.

**FRs couverts :** FR8, FR9, FR10, FR11, FR12, FR22, FR23, FR24
**NFRs associés :** NFR5, NFR8, NFR9

### Epic 3 : Transition Joueurs Anonymes Existants

Le joueur qui utilisait l'app en anonyme avant cette itération est identifié (via données localStorage existantes) et accueilli par un message de transition dédié l'incitant à créer un compte. Il peut continuer à jouer en mode normal sans friction et reçoit des incitations douces à s'inscrire après chaque partie.

**FRs couverts :** FR13, FR14, FR15, FR16
**NFRs associés :** aucun spécifique

---

## Epic 1 : Landing Connectée — Avatar, Play & Navigation

**Goal :** Le joueur connecté ouvre l'app et voit son avatar générique centré entouré de floating cards de questions, accède immédiatement au jeu via un bouton Play sous l'avatar, et navigue vers Stats, Profil et Achievements depuis un header enrichi d'icônes et de labels texte.

### Story 1.1 : Composant Avatar découplé et lazy-loaded

As a développeur,
I want un composant `AvatarDisplay` découplé, lazy-loaded et props-driven,
So that l'avatar soit extensible pour la personnalisation future (Phase 2) sans refonte et que son chargement n'impacte pas le bundle initial.

**Acceptance Criteria :**

**Given** un projet sans composant avatar existant
**When** le développeur crée le composant
**Then** un nouveau dossier `src/components/avatar/` contient `AvatarDisplay.tsx`
**And** le composant accepte des props de customisation (ex: `accessories?`, `colors?`) non exposées dans cette itération mais présentes dans le type des props

**Given** le composant `AvatarDisplay` existe
**When** il est importé dans l'application
**Then** il est chargé via `React.lazy()` + `Suspense` avec un fallback placeholder
**And** le bundle gzipped additionnel du composant avatar est < 200 KB (mesuré via `npm run build` + analyse du bundle)

**Given** le chargement de l'avatar échoue (réseau coupé, asset Spline manquant)
**When** le composant tente de se rendre
**Then** le fallback placeholder reste affiché sans casser la landing
**And** aucune erreur non-captée ne remonte à la console

**Given** le composant est rendu
**When** `npx tsc --noEmit` et `npm run lint` sont exécutés
**Then** zéro erreur TypeScript et zéro warning ESLint

### Story 1.2 : Landing connectée — Avatar centré + Bouton Play

As a joueur connecté,
I want voir mon avatar au centre de la landing avec un bouton Play juste en dessous,
So that mon identité de joueur soit immédiatement visible et je puisse lancer une partie sans friction.

**Acceptance Criteria :**

**Given** je suis connecté (user présent via `useAuth()`)
**When** j'arrive sur la landing
**Then** je vois l'`AvatarDisplay` centré horizontalement et verticalement dans la zone principale
**And** je vois un bouton Play positionné sous l'avatar

**Given** la landing connectée est en cours de rendu
**When** l'avatar est encore en train de charger
**Then** le bouton Play est déjà cliquable et le header est déjà visible
**And** le placeholder avatar est affiché à la place du contenu final

**Given** je suis connecté et sur la landing
**When** je clique sur le bouton Play
**Then** le `SettingsModal` s'ouvre (comportement actuel préservé)

**Given** la landing connectée est chargée
**When** je mesure le First Contentful Paint avec Lighthouse
**Then** FCP < 2 secondes

### Story 1.3 : Floating cards autour de l'avatar

As a joueur connecté,
I want voir des cards de questions qui flottent et tournent autour de mon avatar,
So that l'ambiance visuelle donne envie de jouer et crée un effet "wow" à l'ouverture.

**Acceptance Criteria :**

**Given** je suis sur la landing connectée avec l'avatar visible
**When** la page est rendue
**Then** plusieurs cards de questions sont affichées en positions radiales autour de l'avatar
**And** les cards animent en continu (rotation/flottement) via Framer Motion

**Given** les floating cards animent
**When** je mesure la performance sur desktop moderne
**Then** les animations tournent à 60 FPS sans jank perceptible
**And** aucune régression de perf n'est introduite sur le scroll ou le clic du bouton Play

**Given** l'avatar n'est pas encore chargé (fallback placeholder actif)
**When** les floating cards animent
**Then** les cards restent positionnées autour du placeholder sans clignotement ou saut visuel quand l'avatar final apparaît

### Story 1.4 : Header enrichi avec icônes + labels

As a joueur connecté,
I want un header avec icônes accompagnées de labels texte clairs pour Stats, Profil et Achievements,
So that je comprenne sans hésitation où cliquer pour accéder à chaque section.

**Acceptance Criteria :**

**Given** je suis connecté et sur la landing
**When** la page est rendue
**Then** le header affiche le logo Pulse Quizz à gauche
**And** le header affiche trois entrées de navigation, chacune avec icône + label texte : "Stats", "Profil", "Achievements"
**And** les entrées ont une taille visible supérieure au header actuel (à valider visuellement)

**Given** je suis sur la landing connectée
**When** je clique sur l'entrée "Stats"
**Then** l'application navigue vers l'écran Stats (`setScreen('stats')`)

**Given** je suis sur la landing connectée
**When** je clique sur l'entrée "Profil"
**Then** l'application navigue vers l'écran Profil (`setScreen('profile')`)

**Given** je suis sur la landing connectée
**When** je clique sur l'entrée "Achievements"
**Then** l'application navigue vers l'écran Achievements (`setScreen('achievements')`)

**Given** je navigue au clavier (Tab)
**When** je tabule à travers le header
**Then** chaque entrée du header est focusable et activable via Enter/Space

---

## Epic 2 : Page Vitrine Non-Connectée & Conversion

**Goal :** Le visiteur non-connecté découvre Pulse Quizz via une page vitrine convaincante (hero + sections explicatives), peut créer un compte ou se connecter via des CTA clairs, et arrive immédiatement sur la landing connectée après authentification. Le mode compétitif est réservé aux comptes (blocage client + RLS serveur), le mode normal reste accessible sans compte.

### Story 2.1 : Page vitrine — Hero + sections explicatives

As a visiteur non-connecté,
I want une page vitrine avec un hero présentant Pulse Quizz et des sections expliquant les fonctionnalités,
So that je comprenne le concept du jeu et aie envie de m'inscrire.

**Acceptance Criteria :**

**Given** je ne suis pas connecté (pas de user via `useAuth()`)
**When** j'arrive sur la landing
**Then** je vois une section hero avec le logo Pulse Quizz, une tagline et un visuel de fond cohérent avec la palette existante
**And** je vois en scrollant des sections explicatives dédiées au mode Quiz, au mode Compétition et aux Achievements

**Given** je suis sur la page vitrine
**When** un robot d'indexation (ou Lighthouse) analyse la page
**Then** le score Lighthouse SEO est = 100
**And** le contenu des sections est présent dans le HTML initial (pas de fetch dynamique)
**And** les balises meta (title, description), la structure h1/h2/h3 et les attributs sémantiques sont corrects

**Given** je suis sur la page vitrine
**When** je mesure la performance
**Then** la page reste fluide au scroll (pas de jank perceptible)

### Story 2.2 : CTA inscription & connexion depuis la vitrine

As a visiteur non-connecté,
I want des CTA visibles "S'inscrire" et "Se connecter" accessibles depuis la vitrine,
So that je puisse créer un compte ou me connecter sans chercher comment faire.

**Acceptance Criteria :**

**Given** je suis sur la page vitrine
**When** la page est rendue
**Then** je vois au moins un CTA "S'inscrire" et un CTA "Se connecter" visibles sans scroll (hero ou header)
**And** les CTA sont également accessibles après scroll (sticky, footer, ou répétés dans les sections)

**Given** je suis sur la page vitrine
**When** je clique sur le CTA "S'inscrire"
**Then** l'`AuthModal` existant s'ouvre sur l'onglet/mode "Inscription"

**Given** je suis sur la page vitrine
**When** je clique sur le CTA "Se connecter"
**Then** l'`AuthModal` existant s'ouvre sur l'onglet/mode "Connexion"

### Story 2.3 : Mode normal accessible aux visiteurs non-connectés

As a visiteur non-connecté,
I want pouvoir lancer une partie en mode normal directement depuis la vitrine,
So that j'essaie le jeu avant de décider de m'inscrire.

**Acceptance Criteria :**

**Given** je suis sur la page vitrine non-connecté
**When** la page est rendue
**Then** je vois un bouton Play accessible avec la mention explicite "Mode Normal uniquement"

**Given** je clique sur le bouton Play depuis la vitrine
**When** le `SettingsModal` s'ouvre
**Then** l'option mode normal est pré-sélectionnée et modifiable (difficulté, catégorie)
**And** l'option mode compétitif est désactivée ou masquée (traité dans Story 2.4)

**Given** je lance une partie en mode normal depuis la vitrine
**When** la partie démarre puis se termine
**Then** le flow complet du mode normal fonctionne (10 questions, timer, score final)
**And** mon score est persisté en localStorage (comportement anonyme existant préservé)

### Story 2.4 : Blocage mode compétitif pour non-connectés (client + RLS)

As a système,
I want bloquer l'accès au mode compétitif pour les visiteurs non-connectés côté client ET côté serveur,
So that le leaderboard reste intègre et que l'incitation à créer un compte soit effective.

**Acceptance Criteria :**

**Given** je ne suis pas connecté
**When** j'ouvre le `SettingsModal`
**Then** l'option mode compétitif est soit masquée, soit désactivée avec un indicateur clair (ex: icône cadenas + message "Connexion requise")

**Given** je ne suis pas connecté et j'essaie de sélectionner le mode compétitif
**When** je clique sur l'option compétitive désactivée
**Then** l'`AuthModal` s'ouvre sur "Inscription" avec un message explicatif
**And** la partie compétitive ne démarre pas

**Given** un client non-authentifié appelle directement `submitScore()` via le service `leaderboard.ts`
**When** Supabase reçoit la requête `INSERT` sur la table `leaderboard`
**Then** la policy RLS rejette la requête (car `auth.uid() IS NULL`)
**And** une `AppError` est levée côté client

**Given** la RLS est configurée
**When** le schéma Supabase est mis à jour
**Then** la policy est documentée dans `scripts/supabase_schema.sql`

### Story 2.5 : Redirection post-auth vers la landing connectée

As a nouveau compte (ou utilisateur qui se reconnecte),
I want arriver directement sur la landing connectée avec mon avatar après inscription ou connexion,
So that la transition ressente immédiate et que je comprenne que j'ai accès à l'expérience complète.

**Acceptance Criteria :**

**Given** je suis sur la page vitrine et l'`AuthModal` est ouvert
**When** je termine une inscription ou une connexion avec succès
**Then** l'`AuthModal` se ferme automatiquement
**And** la landing connectée (Epic 1) s'affiche avec l'avatar centré, les floating cards et le header enrichi

**Given** la transition de la vitrine à la landing connectée
**When** elle se produit
**Then** il n'y a pas de flash perceptible ni d'écran intermédiaire vide entre les deux états
**And** l'état de `user` dans `useAuth()` est mis à jour (via `onAuthStateChange`) avant le changement d'affichage

**Given** une erreur se produit lors de l'inscription ou de la connexion
**When** Supabase renvoie une erreur
**Then** la vitrine reste affichée et l'`AuthModal` affiche l'erreur sans rediriger vers la landing connectée

---

## Epic 3 : Transition Joueurs Anonymes Existants

**Goal :** Le joueur qui utilisait l'app en anonyme avant cette itération est identifié (via données localStorage existantes) et accueilli par un message de transition dédié l'incitant à créer un compte. Il peut continuer à jouer en mode normal sans friction et reçoit des incitations douces à s'inscrire après chaque partie.

### Story 3.1 : Détection d'un joueur anonyme existant

As a système,
I want détecter qu'un visiteur a déjà joué en anonyme avant cette itération,
So que je puisse lui proposer un message de transition dédié au lieu du hero générique.

**Acceptance Criteria :**

**Given** le localStorage contient au moins une clé commençant par `pulse_stats_`
**When** l'utilitaire de détection est appelé (ex: `isReturningAnonymous()`)
**Then** il retourne `true`

**Given** le localStorage ne contient aucune clé `pulse_stats_*`
**When** l'utilitaire de détection est appelé
**Then** il retourne `false`

**Given** l'utilitaire existe
**When** il est importé et utilisé depuis un composant
**Then** il n'effectue aucun appel réseau ni aucune écriture localStorage (lecture seule)
**And** son exécution est synchrone et négligeable (< 5 ms sur un localStorage standard)

**Given** le code est ajouté
**When** `npx tsc --noEmit` et `npm run lint` sont exécutés
**Then** zéro erreur TypeScript et zéro warning ESLint

### Story 3.2 : Message de transition dédié pour anonymes existants

As a joueur qui jouait déjà en anonyme,
I want voir un message d'accueil spécifique m'incitant à créer un compte tout en pouvant continuer à jouer,
So que la transition soit claire sans me bloquer l'accès à ce que je faisais déjà.

**Acceptance Criteria :**

**Given** je visite la vitrine non-connectée et `isReturningAnonymous()` retourne `true`
**When** la page est rendue
**Then** je vois une section ou bannière dédiée avec un texte du type : "Tu jouais déjà ? Crée un compte pour le compétitif, les stats et ton avatar."
**And** un CTA "Créer un compte" est présent dans cette section

**Given** je suis un joueur anonyme existant sur la vitrine
**When** je clique sur "Créer un compte" dans le message de transition
**Then** l'`AuthModal` s'ouvre sur l'onglet Inscription

**Given** je suis un joueur anonyme existant sur la vitrine
**When** je consulte la page
**Then** le bouton Play mode normal (Story 2.3) reste visible et fonctionnel
**And** le message de transition ne bloque pas l'accès à la partie normale

**Given** je suis un nouveau visiteur (`isReturningAnonymous()` retourne `false`)
**When** la vitrine est rendue
**Then** le message de transition n'est PAS affiché (seul le hero générique est visible)

### Story 3.3 : Incitation à l'inscription post-partie mode normal

As a joueur anonyme qui vient de terminer une partie en mode normal,
I want voir une incitation douce à créer un compte sur l'écran de résultat,
So que la sauvegarde cloud de mes scores et l'accès au compétitif soient mis en avant au bon moment.

**Acceptance Criteria :**

**Given** je viens de terminer une partie en mode normal et je ne suis pas connecté
**When** l'écran de résultat (`ResultScreen`) s'affiche
**Then** je vois un bloc d'incitation avec un message du type : "Crée un compte pour sauvegarder ton score et accéder au mode compétitif"
**And** un CTA "Créer un compte" est présent dans ce bloc

**Given** je suis sur l'écran de résultat avec l'incitation affichée
**When** je clique sur le CTA "Créer un compte"
**Then** l'`AuthModal` s'ouvre sur l'onglet Inscription

**Given** je viens de terminer une partie en mode normal et je suis connecté
**When** l'écran de résultat s'affiche
**Then** l'incitation à l'inscription n'est PAS affichée (comportement actuel préservé)

**Given** je viens de terminer une partie en mode compétitif
**When** l'écran de résultat (ou ranking reveal) s'affiche
**Then** l'incitation à l'inscription n'est PAS affichée (le compétitif n'est accessible qu'aux connectés)
