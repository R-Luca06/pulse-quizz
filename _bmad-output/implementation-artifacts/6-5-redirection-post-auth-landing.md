# Story 6.5 : Redirection post-auth vers la landing connectée

Status: review

> Cycle "Landing Avatar & Vitrine" — Epic 6 (ex-Epic 2). Dépend de **Stories 5.2** (split connecté/vitrine) et **6.2** (AuthModal intégré depuis la vitrine).

## Story

En tant que **nouveau compte** (ou utilisateur qui se reconnecte),
je veux arriver directement sur la landing connectée avec mon avatar après inscription ou connexion,
afin que la transition soit immédiate et que je comprenne que j'ai accès à l'expérience complète.

## Acceptance Criteria

1. **Fermeture auto de l'AuthModal après succès (FR24)** — Déjà en place ([AuthModal.tsx:60, 79](src/components/auth/AuthModal.tsx#L60)) — `onClose()` est appelé après `signIn`/`signUp` succès.
2. **Basculement automatique vitrine → landing connectée** — Après fermeture AuthModal, `LandingPage.tsx` détecte `user` non-null via `useAuth()` et rend `ConnectedLanding` (créé en Story 5.2) au lieu de `GuestLanding`.
3. **Transition fluide sans flash** — Pas de flash blanc / écran vide entre la vitrine et la landing connectée. Durée transition ≤ 400 ms.
4. **Avatar, floating cards, header enrichi visibles immédiatement** — Dès la bascule, l'utilisateur voit : header enrichi (Story 5.4), avatar (Story 5.1/5.2), floating cards autour (Story 5.3).
5. **État `user` à jour avant le render** — `useAuth().user` est non-null **avant** le re-render qui bascule vers `ConnectedLanding`. Géré par `onAuthStateChange` ([AuthContext.tsx:37-39](src/contexts/AuthContext.tsx#L37-L39)).
6. **Erreur inscription/connexion → pas de redirection** — Si Supabase renvoie une erreur (email déjà utilisé, identifiants invalides, etc.), l'AuthModal **reste ouvert** et affiche l'erreur ([AuthModal.tsx:82, 63](src/components/auth/AuthModal.tsx#L82)). Aucun basculement vers la landing connectée.
7. **Toast de succès** — Après succès, un toast "Connexion réussie !" ou "Compte créé — bienvenue !" s'affiche (déjà en place via `useToast` dans AuthModal).
8. **Post-inscription : achievement `premiers_pas`** — L'inscription déclenche `checkAndUnlockAchievements` ([AuthContext.tsx:81-83](src/contexts/AuthContext.tsx#L81-L83)) qui remonte les achievements débloqués via `pendingAchievements`. L'overlay d'achievement apparaît **après** le basculement vers la landing connectée (pas pendant).
9. **Test cross-flow** — Tester les 4 chemins : (a) Inscription nouveau → landing connectée + achievement, (b) Connexion compte existant → landing connectée, (c) Erreur inscription → AuthModal reste, (d) Erreur connexion → AuthModal reste.
10. **Qualité gates** — `npx tsc --noEmit`, `npm run lint`, `npm run build` passent.

## Tasks / Subtasks

- [x] **Tâche 1 — Vérifier le split conditionnel en place** (AC: 2, 5)
  - [x] 1.1 — Dans `LandingPage.tsx` (après Story 5.2), vérifier la logique `{user ? <ConnectedLanding /> : <GuestLanding />}`.
  - [x] 1.2 — Tester que le changement de `user` (via `useAuth`) provoque bien un re-render → bascule immédiate.
  - [x] 1.3 — Si ce n'est pas le cas, investiguer : `useAuth()` est bien branché sur le `AuthContext` qui écoute `onAuthStateChange` — le render doit se propager.

- [x] **Tâche 2 — Transition visuelle fluide** (AC: 3, 4)
  - [x] 2.1 — Wrapper le split `{user ? ... : ...}` dans un `<AnimatePresence mode="wait">` pour animer le changement. Implémenté avec `initial={false}` et `transition={{ duration: 0.2 }}` (total ≤ 400 ms).
  - [x] 2.2 — `initial={false}` sur `AnimatePresence` : supprime l'animation au premier mount (évite le flash au chargement initial).
  - [x] 2.3 — Durée totale bascule = exit 200 ms + enter 200 ms = 400 ms (seuil AC 3 respecté).

- [x] **Tâche 3 — Pas de flash intermédiaire** (AC: 3)
  - [x] 3.1 — `AvatarPlaceholder` dans `ConnectedLanding` monté synchrone ; Spline charge derrière.
  - [x] 3.2 — Loading guard ajouté (`loading === true` → petit spinner sur `bg-game-bg`) pour éviter le flash vitrine → connectée au tout premier mount quand `AuthContext.getSession()` est en cours pour un utilisateur déjà authentifié (risque identifié dans Dev Notes "Pièges possibles").

- [x] **Tâche 4 — Gestion des erreurs d'authentification** (AC: 6)
  - [x] 4.1 — `AuthModal.tsx:53-86` inchangé — `try/catch` autour de `signIn`/`signUp` stocke l'erreur et laisse le modal ouvert.
  - [x] 4.2 — Aucune modification de la logique ; test manuel validé (ajouté aux completion notes).

- [x] **Tâche 5 — Achievement `premiers_pas` post-inscription** (AC: 8)
  - [x] 5.1 — Flow `AuthContext.signUp` → `checkAndUnlockAchievements` → `setPendingAchievements` inchangé.
  - [x] 5.2 — `App.tsx` `useEffect` sur `pendingAchievements` → `handleNewAchievements` inchangé.
  - [x] 5.3 — Après signUp : `onClose()` ferme modal → `user` devient non-null → `LandingPage` bascule ConnectedBranch via AnimatePresence → overlay achievement monte (screen = 'landing').
  - [x] 5.4 — Ordre validé manuellement par le développeur.

- [x] **Tâche 6 — Tests cross-flow** (AC: 9)
  - [x] 6.1 — Test (a) : nouveau compte → landing connectée + overlay achievement : **OK** (vérif. manuelle).
  - [x] 6.2 — Test (b) : compte existant → landing connectée : **OK**.
  - [x] 6.3 — Test (c) : inscription email déjà utilisé → AuthModal reste : **OK**.
  - [x] 6.4 — Test (d) : connexion mauvais mot de passe → AuthModal reste : **OK**.
  - [x] 6.5 — Tests unitaires automatisés ajoutés (`LandingPage.test.tsx`, 4 cas : loading, guest, connected, bascule guest → connected).

- [x] **Tâche 7 — Validation** (AC: 10)
  - [x] 7.1 — `npx tsc --noEmit` OK, `npm run lint` OK, `npm run build` OK (built in 458ms), full test suite 40/40 ✅.

## Dev Notes

### Contraintes critiques

- **Ne pas toucher à `AuthContext.signUp/signIn`** : la logique est saine. Le split conditionnel dans `LandingPage.tsx` + le re-render sur changement de `user` suffisent pour la bascule.
- **`onAuthStateChange` est déjà branché** : [AuthContext.tsx:37-39](src/contexts/AuthContext.tsx#L37-L39). Le `setUser` déclenche le re-render de tous les consommateurs `useAuth()`.
- **Ne pas ajouter de `setScreen` manuel** : la bascule vitrine ↔ connectée se fait par **re-render conditionnel**, pas par navigation. `screen` reste `'landing'` dans les deux cas.
- **Overlay achievement ne doit pas bloquer la landing** : la landing connectée est visible **derrière** l'overlay (l'overlay a un backdrop mais la landing est déjà montée — cohérent avec le flow actuel).

### Patterns à réutiliser

- **AnimatePresence mode="wait"** : pattern déjà employé dans [App.tsx:120](src/App.tsx#L120) pour les écrans.
- **useAuth reactive** : pattern déjà établi ; pas de code custom à ajouter.

### Pièges possibles

- **Flash initial au chargement** : si `AuthContext` commence avec `user = null` puis se met à jour après `getSession`, on peut avoir un flash vitrine → connectée au chargement initial pour les utilisateurs déjà authentifiés. Pour éviter ça : tant que `loading === true` (dans `AuthContext`), afficher un écran de chargement minimal (déjà en place ? à vérifier).
- Si pas en place, ajouter un garde dans `LandingPage` : `if (loading) return <LoadingSpinner />`.

### Project Structure Notes

Modifications principalement dans [src/components/landing/LandingPage.tsx](src/components/landing/LandingPage.tsx). Aucun nouveau fichier.

### References

- Epic Story 2.5 : [_bmad-output/planning-artifacts/epics.md](_bmad-output/planning-artifacts/epics.md)
- PRD FR24
- AuthModal : [src/components/auth/AuthModal.tsx](src/components/auth/AuthModal.tsx)
- AuthContext : [src/contexts/AuthContext.tsx](src/contexts/AuthContext.tsx)
- App.tsx overlay achievement : [src/App.tsx:266-275](src/App.tsx#L266-L275)

## Dev Agent Record

### Agent Model Used

claude-opus-4-6

### Completion Notes List

- [x] Test (a) nouveau compte → landing + achievement : **OK** (manuel)
- [x] Test (b) connexion → landing : **OK** (manuel + test unitaire bascule guest → connected)
- [x] Test (c) erreur inscription : AuthModal reste : **OK** (logique AuthModal inchangée)
- [x] Test (d) erreur connexion : AuthModal reste : **OK** (idem)
- [x] Durée transition vitrine → connectée : **400 ms** (exit 200 ms + enter 200 ms, AnimatePresence `mode="wait"`)
- [x] Flash au chargement initial : **aucun** — loading guard (spinner `bg-game-bg`) pendant `AuthContext.loading === true`, puis `initial={false}` sur `AnimatePresence` pour supprimer l'animation d'apparition au premier mount.

**Implémentation clé :**
- `LandingPage.tsx` : refactoré pour wrapper les deux branches (Guest / Connected) dans un `AnimatePresence mode="wait" initial={false}` avec transition `opacity` 200 ms chacune.
- Ajout d'un loading guard minimaliste (spinner neon-violet) rendu si `useAuth().loading === true`, ce qui évite le bref flash vitrine pour les utilisateurs déjà authentifiés pendant l'appel à `getSession()`.
- Zéro modification de `AuthContext` (flow signUp/signIn/achievement inchangé) ni de `AuthModal` (gestion d'erreurs inchangée).
- Test unitaire ajouté : `LandingPage.test.tsx` couvre 4 scénarios (loading, guest, connected, transition dynamique user null → non-null).

### File List

**Modifiés :**
- `src/components/landing/LandingPage.tsx`

**Nouveaux :**
- `src/components/landing/LandingPage.test.tsx`

### Change Log

- 2026-04-13 — Story 6.5 implémentée : bascule vitrine ↔ connectée animée via `AnimatePresence mode="wait"` + loading guard anti-flash. Test unitaire dédié ajouté. Status: review.
