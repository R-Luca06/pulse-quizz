# Story 7.2 : Message de transition dédié pour anonymes existants

Status: review

> Cycle "Landing Avatar & Vitrine" — Epic 7 (ex-Epic 3). Dépend de **Story 7.1** (`isReturningAnonymous`) et **Story 6.1** (vitrine) et **Story 6.2** (AuthModal signup).

## Story

En tant que **joueur qui jouait déjà en anonyme**,
je veux voir un message d'accueil spécifique m'incitant à créer un compte tout en pouvant continuer à jouer,
afin que la transition soit claire sans me bloquer l'accès à ce que je faisais déjà.

## Acceptance Criteria

1. **Bannière de transition affichée si anonyme existant (FR14)** — Sur la vitrine (`GuestLanding.tsx`), si `isReturningAnonymous()` retourne `true`, une section/bannière dédiée s'affiche (au-dessus ou dans le hero) avec un message du type : *"Tu jouais déjà ? Crée un compte pour le compétitif, les stats cloud et ton avatar."*
2. **CTA "Créer un compte" dans la bannière** — Un bouton "Créer un compte" dans la bannière ouvre l'`AuthModal` sur l'onglet `signup` (via `onOpenSignUp` de Story 6.2).
3. **Secondary link "J'ai déjà un compte → Se connecter"** — Sous le CTA primary, lien texte vers `signin` (AuthModal).
4. **Mode normal toujours jouable (FR15)** — Le bouton Play mode normal (Story 6.3) reste visible et fonctionnel. La bannière **ne bloque pas** l'accès à la partie anonyme.
5. **Pas de bannière pour nouveau visiteur** — Si `isReturningAnonymous()` retourne `false`, la bannière n'est **pas** affichée. Le hero générique de Story 6.1 est seul visible.
6. **Pas de bannière pour connecté** — Si `user` est non-null (landing connectée, branche `ConnectedLanding`), la bannière n'est évidemment pas affichée (on n'est plus sur `GuestLanding`).
7. **Dismiss optionnel** — L'utilisateur peut fermer la bannière via un bouton "×" (persistance localStorage sous `pulse_transition_dismissed = 'true'` pour ne pas réafficher à chaque visite). Dismissable **recommandé** pour éviter la friction — à implémenter si temps disponible, sinon non bloquant.
8. **Design cohérent** — Style visuel aligné avec la vitrine : palette `game-*` / `neon-*`, gradient sur le CTA, pas de rupture.
9. **Accessibilité** — Bannière annoncée comme `role="region"` + `aria-labelledby` sur le titre. CTA focusable clavier.
10. **Qualité gates** — `npx tsc --noEmit`, `npm run lint`, `npm run build` passent.

## Tasks / Subtasks

- [x] **Tâche 1 — Composant `ReturningAnonymousBanner`** (AC: 1, 2, 3, 8, 9)
  - [x] 1.1 — Créer `src/components/landing/ReturningAnonymousBanner.tsx`. Props :
    ```tsx
    interface ReturningAnonymousBannerProps {
      onOpenSignUp: () => void
      onOpenSignIn: () => void
      onDismiss?: () => void
    }
    ```
  - [x] 1.2 — Contenu :
    ```tsx
    <section role="region" aria-labelledby="transition-title" className="...">
      <h2 id="transition-title">Tu jouais déjà ?</h2>
      <p>Crée un compte pour accéder au mode compétitif, à tes stats cloud et à ton avatar.</p>
      <button onClick={onOpenSignUp}>Créer un compte</button>
      <button onClick={onOpenSignIn}>J'ai déjà un compte</button>
      {onDismiss && <button onClick={onDismiss} aria-label="Fermer">×</button>}
    </section>
    ```
  - [x] 1.3 — Style : bannière en largeur limitée (max-w-2xl), fond `bg-neon-violet/10` + bordure subtile `border-neon-violet/30`, padding généreux, bouton "Créer un compte" gradient `from-neon-violet to-neon-blue`.

- [x] **Tâche 2 — Intégration conditionnelle dans GuestLanding** (AC: 1, 4, 5)
  - [x] 2.1 — Dans `GuestLanding.tsx`, importer `isReturningAnonymous` (Story 7.1) et `ReturningAnonymousBanner`.
  - [x] 2.2 — État local (si dismiss) : `const [showBanner, setShowBanner] = useState(() => isReturningAnonymous() && localStorage.getItem('pulse_transition_dismissed') !== 'true')`.
  - [x] 2.3 — Si pas de dismiss : `const showBanner = isReturningAnonymous()` (simple, recalculé à chaque render — OK, c'est rapide).
  - [x] 2.4 — Rendu conditionnel :
    ```tsx
    {showBanner && (
      <ReturningAnonymousBanner
        onOpenSignUp={onOpenSignUp}
        onOpenSignIn={onOpenSignIn}
        onDismiss={() => { localStorage.setItem('pulse_transition_dismissed', 'true'); setShowBanner(false) }}
      />
    )}
    ```
  - [x] 2.5 — Position : au-dessus du hero ou dans la zone haute du hero (entre header et titre), visible sans scroll.

- [ ] **Tâche 3 — Tests manuels** (AC: 5, 6) — *à exécuter par l'utilisateur dans le navigateur*
  - [ ] 3.1 — Test 1 : DevTools > Application > LocalStorage, effacer tout. Recharger. **Attendu** : pas de bannière (nouveau visiteur).
  - [ ] 3.2 — Test 2 : lancer une partie en mode normal (crée `pulse_stats_normal_easy_all`). Revenir à la vitrine. **Attendu** : bannière affichée.
  - [ ] 3.3 — Test 3 (si dismiss) : fermer la bannière. Recharger. **Attendu** : bannière non affichée (dismiss persistant).
  - [ ] 3.4 — Test 4 : se connecter. **Attendu** : bascule vers `ConnectedLanding`, pas de bannière.

- [x] **Tâche 4 — Validation** (AC: 10)
  - [x] 4.1 — `npx tsc --noEmit`, `npm run lint`, `npm run build` → OK.

## Dev Notes

### Contraintes critiques

- **Pas d'appel direct à `localStorage` dans la bannière** : passer par `isReturningAnonymous()` pour la détection et gérer le `pulse_transition_dismissed` dans `GuestLanding` (ou extraire un hook `useTransitionBanner` si logique devient complexe).
- **Pas de blocage de l'UX** : AC 4 — le Play reste accessible. La bannière est **additive**, pas intrusive.
- **Message ton** : "Tu" (tutoiement cohérent avec le PRD / ResultScreen qui tutoie).

### Patterns à réutiliser

- **Framer Motion entrée** : `initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}` pour l'apparition douce de la bannière.
- **CTA gradient + border-pattern** : cohérent avec les CTA de Story 6.2.

### Project Structure Notes

```
src/components/landing/
├── ReturningAnonymousBanner.tsx    # nouveau
├── GuestLanding.tsx                # modifié — intègre la bannière conditionnelle
src/utils/
└── statsStorage.ts                 # déjà modifié (Story 7.1)
```

### References

- Epic Story 3.2 : [_bmad-output/planning-artifacts/epics.md](_bmad-output/planning-artifacts/epics.md)
- PRD FR14, FR15 / Journey 3 (Lucas)
- Story 7.1 (dépendance) : [7-1-detection-joueur-anonyme.md](_bmad-output/implementation-artifacts/7-1-detection-joueur-anonyme.md)
- Story 6.2 (AuthModal signup) : [6-2-cta-inscription-connexion-vitrine.md](_bmad-output/implementation-artifacts/6-2-cta-inscription-connexion-vitrine.md)

## Dev Agent Record

### Agent Model Used

claude-opus-4-6

### Completion Notes List

**Implémentation :**
- Composant `ReturningAnonymousBanner` créé avec `role="region"` + `aria-labelledby="transition-title"`, CTA gradient `from-neon-violet to-neon-blue`, bouton secondaire "J'ai déjà un compte" → `onOpenSignIn`, bouton dismiss "×" optionnel.
- Dismiss persistant implémenté via `localStorage.setItem('pulse_transition_dismissed', 'true')` géré côté `GuestLanding` (pas dans la bannière, conformément aux contraintes Dev Notes).
- Bannière positionnée entre `GuestHeader` et `Hero`, largeur contrainte `max-w-2xl`, animation Framer Motion `opacity + y` douce.
- AC 6 (pas de bannière pour connecté) : couvert naturellement — `GuestLanding` n'est pas rendu si `user` est non-null (App.tsx bascule sur `ConnectedLanding`).
- AC 4 (Play reste jouable) : la bannière est additive, n'affecte ni le header (bouton Play Guest) ni le CTA hero.

**Validation (Tâche 4) :**
- ✅ `npx tsc --noEmit` : 0 erreur
- ✅ `npm run lint` : 0 warning
- ✅ `npm run build` : succès (build 536ms)

**Tests manuels (Tâche 3) — à exécuter par l'utilisateur :**
- [ ] Test 1 : nouveau visiteur (localStorage vide) → pas de bannière
- [ ] Test 2 : anonyme avec historique (`pulse_stats_*` présent) → bannière affichée
- [ ] Test 3 : dismiss persistant → fermeture + reload → bannière non affichée
- [ ] Test 4 : connecté → `ConnectedLanding`, pas de bannière

### File List

**Créés :**
- `src/components/landing/ReturningAnonymousBanner.tsx`

**Modifiés :**
- `src/components/landing/GuestLanding.tsx`

### Change Log

- 2026-04-13 — Implémentation Story 7.2 : bannière de transition pour joueurs anonymes existants (composant + intégration conditionnelle dans `GuestLanding`, dismiss persistant via localStorage).
