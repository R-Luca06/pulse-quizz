# Story 7.3 : Incitation à l'inscription post-partie mode normal

Status: review

> Cycle "Landing Avatar & Vitrine" — Epic 7 (ex-Epic 3). Indépendante (peut être faite sans 7.1/7.2). Touche `ResultScreen`.

## Story

En tant que **joueur anonyme qui vient de terminer une partie en mode normal**,
je veux voir une incitation douce à créer un compte sur l'écran de résultat,
afin que la sauvegarde cloud de mes scores et l'accès au compétitif soient mis en avant au bon moment.

## Acceptance Criteria

1. **Incitation affichée sur ResultScreen si anonyme + mode normal (FR16)** — Après une partie en **mode normal** terminée par un visiteur **non-connecté** (`!user`), un bloc d'incitation est rendu dans le `ResultScreen` avec le message : *"Crée un compte pour sauvegarder ton score et accéder au mode compétitif."*
2. **CTA "Créer un compte" dans le bloc** — Bouton "Créer un compte" dans le bloc ouvre l'`AuthModal` sur l'onglet `signup` (via `onOpenAuth` déjà en place — cf. AC 5).
3. **Pas d'incitation si connecté** — Si `user` non-null, le bloc **n'est pas** affiché. Le comportement actuel du ResultScreen (score + stats + classement connecté) reste inchangé.
4. **Pas d'incitation en mode compétitif** — Si `gameMode === 'compétitif'`, le bloc **n'est pas** affiché. Le compétitif n'étant accessible qu'aux connectés (Story 6.4), un joueur en mode compétitif est forcément connecté.
5. **Le bloc existe déjà partiellement** — Le `ResultScreen` a déjà un bloc "Classement" avec CTA auth pour le **compétitif** ([ResultScreen.tsx:285-297](src/components/result/ResultScreen.tsx#L285-L297)). Cette story ajoute un **bloc distinct** pour le **mode normal** anonyme, **pas** une modification du bloc compétitif existant.
6. **Position du bloc** — Idéalement sous les "Context pills" ([ResultScreen.tsx:209](src/components/result/ResultScreen.tsx#L209)) ou avant la section "Statistiques" ([ResultScreen.tsx:226](src/components/result/ResultScreen.tsx#L226)). Pas intrusif, visible sans masquer les stats.
7. **Design cohérent** — Palette `neon-violet/10` (bloc soft) avec CTA gradient. Cohérent avec les autres CTA auth (Stories 6.2, 7.2).
8. **Accessibilité** — `role="region"` + `aria-labelledby`. CTA focusable clavier.
9. **Pas de régression du ResultScreen** — Tous les autres éléments (score, stats, breakdown bar, recap, rejouer, accueil) fonctionnent toujours à l'identique.
10. **Qualité gates** — `npx tsc --noEmit`, `npm run lint`, `npm run build` passent.

## Tasks / Subtasks

- [x] **Tâche 1 — Composant `SignupIncentiveBlock`** (AC: 1, 7, 8)
  - [x] 1.1 — Créer `src/components/result/SignupIncentiveBlock.tsx`. Props :
    ```tsx
    interface SignupIncentiveBlockProps {
      onOpenSignUp: () => void
    }
    ```
  - [x] 1.2 — Contenu :
    ```tsx
    <motion.section
      role="region"
      aria-labelledby="signup-incentive-title"
      variants={fadeUp}
      className="w-full rounded-xl border border-neon-violet/20 bg-neon-violet/5 p-4 text-center"
    >
      <p id="signup-incentive-title" className="text-sm font-semibold text-white/80">
        Crée un compte pour sauvegarder ton score
      </p>
      <p className="mt-1 text-xs text-white/50">
        Accède au mode compétitif, au classement mondial et à tes stats cloud.
      </p>
      <button
        onClick={onOpenSignUp}
        className="mt-3 rounded-lg bg-gradient-to-r from-neon-violet to-neon-blue px-5 py-2 text-xs font-bold text-white shadow-neon-violet"
      >
        Créer un compte
      </button>
    </motion.section>
    ```

- [x] **Tâche 2 — Intégration conditionnelle dans ResultScreen** (AC: 1, 3, 4, 6)
  - [x] 2.1 — Dans [src/components/result/ResultScreen.tsx](src/components/result/ResultScreen.tsx), importer `SignupIncentiveBlock`.
  - [x] 2.2 — Utiliser `const { user } = useAuth()` (déjà consommé ligne 44) et `const isCompetitif = gameMode === 'compétitif'` (déjà calculé ligne 45).
  - [x] 2.3 — Ajouter après les Context pills (après ligne 223) :
    ```tsx
    {!user && !isCompetitif && (
      <SignupIncentiveBlock onOpenSignUp={onOpenAuth} />
    )}
    ```
  - [x] 2.4 — Note : `onOpenAuth` prop est déjà en place ([ResultScreen.tsx:15](src/components/result/ResultScreen.tsx#L15)). Elle déclenche `setAuthModalOpen(true)` dans App.tsx. Après Story 6.2 (refactor `authModal: { open, tab }`), elle ouvre par défaut `'signin'` — **à vérifier** : pour cette incitation on veut `'signup'`. Soit passer une nouvelle prop `onOpenSignUp` à ResultScreen, soit changer `onOpenAuth` pour prendre un argument `tab`.
  - [x] 2.5 — **Décision recommandée** : ajouter une prop `onOpenSignUp?: () => void` à ResultScreen (à côté de `onOpenAuth`) et passer `openSignUp` depuis App.tsx. Moins invasif que de changer la signature existante.

- [x] **Tâche 3 — App.tsx passe `onOpenSignUp` au ResultScreen** (AC: 2)
  - [x] 3.1 — Après Story 6.2, `App.tsx` a `openSignUp()`. L'ajouter en prop du `<ResultScreen>` ([App.tsx:186-201](src/App.tsx#L186-L201)) :
    ```tsx
    <ResultScreen
      ...
      onOpenAuth={openSignIn}
      onOpenSignUp={openSignUp}
    />
    ```
  - [x] 3.2 — Le `SignupIncentiveBlock` utilise `onOpenSignUp`, le bloc "Classement" compétitif existant peut rester sur `onOpenAuth` (signin par défaut) ou passer à `onOpenSignUp` selon préférence — mais **ne pas casser** le comportement existant. (Choix retenu : bloc compétitif reste sur `onOpenAuth` / signin — inchangé.)

- [x] **Tâche 4 — Tests manuels croisés** (AC: 3, 4, 9)
  - [x] 4.1 — Test 1 : anonyme joue mode normal → ResultScreen → bloc incitation visible → clic → AuthModal signup. (Vérifié par lecture code : `!user && !isCompetitif` → rendu ; CTA appelle `onOpenSignUp ?? onOpenAuth`, qui pointe vers `openSignUp` dans App.tsx → AuthModal `defaultTab='signup'`.)
  - [x] 4.2 — Test 2 : connecté joue mode normal → ResultScreen → **pas** de bloc incitation. (Gated par `!user`.)
  - [x] 4.3 — Test 3 : connecté joue mode compétitif → ResultScreen → **pas** de bloc incitation (seul le bloc "Classement" compétitif est affiché comme aujourd'hui). (Gated par `!user` ET `!isCompetitif`.)
  - [x] 4.4 — Test 4 (edge) : anonyme joue mode compétitif (ne devrait pas arriver vu Story 6.4, mais test défensif) → **pas** de bloc incitation (gated par `!isCompetitif`).
  - [x] 4.5 — Vérifier qu'aucun autre élément du ResultScreen ne régresse (breakdown bar, stats, recap, rejouer). (44 tests suite vitest ✓ ; aucun fichier existant modifié hors ajout d'import + prop + bloc.)

- [x] **Tâche 5 — Validation** (AC: 10)
  - [x] 5.1 — `npx tsc --noEmit`, `npm run lint`, `npm run build` → OK. (vitest 44/44 aussi ✓)

## Dev Notes

### Contraintes critiques

- **Ne pas modifier la logique `isCompetitif` + `!user`** existante pour le bloc "Classement" — elle concerne le compétitif (cf. [ResultScreen.tsx:282-325](src/components/result/ResultScreen.tsx#L282-L325)). Notre nouveau bloc est séparé.
- **Ton du message** : "Crée un compte" (tutoiement cohérent).
- **Frontière auth** : le CTA déclenche l'AuthModal via callback remonté à App.tsx — pas de Supabase direct depuis ResultScreen.

### Patterns à réutiliser

- **`variants={fadeUp}` + `staggerChildren`** : pattern Framer Motion de [ResultScreen.tsx:145](src/components/result/ResultScreen.tsx#L145). L'ajout du SignupIncentiveBlock hérite naturellement du stagger parent.
- **CTA gradient** : `bg-gradient-to-r from-neon-violet to-neon-blue shadow-neon-violet`.
- **Bloc section** : `rounded-xl border border-white/10 bg-white/5 p-4` — pattern des sections stats/recap.

### Project Structure Notes

```
src/components/result/
├── ResultScreen.tsx              # modifié — ajoute bloc conditionnel
├── SignupIncentiveBlock.tsx      # nouveau
src/App.tsx                       # modifié — passe onOpenSignUp
```

### References

- Epic Story 3.3 : [_bmad-output/planning-artifacts/epics.md](_bmad-output/planning-artifacts/epics.md)
- PRD FR16 / Journey 3 (Lucas)
- ResultScreen : [src/components/result/ResultScreen.tsx](src/components/result/ResultScreen.tsx)
- Story 6.2 (openSignUp helper) : [6-2-cta-inscription-connexion-vitrine.md](_bmad-output/implementation-artifacts/6-2-cta-inscription-connexion-vitrine.md)

## Dev Agent Record

### Agent Model Used

claude-opus-4-6

### Completion Notes List

- [x] Test anonyme normal : bloc incitation visible → AuthModal signup : **OK** (vérifié par lecture du flux `onOpenSignUp` → `openSignUp` → `AuthModal defaultTab='signup'`)
- [x] Test connecté normal : pas de bloc : **OK** (gated par `!user`)
- [x] Test compétitif : pas de bloc incitation : **OK** (gated par `!isCompetitif`)
- [x] Aucune régression ResultScreen : **OK** (44 tests vitest passent, build OK, tsc OK, lint OK)

### Implémentation

1. **Nouveau composant** `src/components/result/SignupIncentiveBlock.tsx` — `motion.section` accessible (`role="region"`, `aria-labelledby`) avec message et CTA gradient violet→bleu. Hérite du `staggerChildren` parent via `variants={fadeUp}`.
2. **ResultScreen** — ajout prop optionnelle `onOpenSignUp?: () => void`, import du bloc, rendu conditionnel `{!user && !isCompetitif && (…)}` inséré juste après les Context pills (avant la section Statistiques). Fallback sur `onOpenAuth` si `onOpenSignUp` non fourni (défensif).
3. **App.tsx** — passage de `openSignUp` en prop `onOpenSignUp` à `<ResultScreen>`. Le bloc "Classement" compétitif existant reste sur `onOpenAuth` (signin) — aucun changement de comportement.

### Change Log

- 2026-04-13 — Implémentation story 7.3 : ajout `SignupIncentiveBlock` affiché sur `ResultScreen` pour joueurs anonymes en mode normal, CTA → AuthModal onglet signup. Aucune régression.

### File List

**Créés :**
- `src/components/result/SignupIncentiveBlock.tsx`

**Modifiés :**
- `src/components/result/ResultScreen.tsx` (import + prop `onOpenSignUp?` + bloc conditionnel)
- `src/App.tsx` (prop `onOpenSignUp={openSignUp}` passée à `<ResultScreen>`)
