# Story 6.3 : Mode normal accessible aux visiteurs non-connectés

Status: review

> Cycle "Landing Avatar & Vitrine" — Epic 6 (ex-Epic 2). Indépendante de 6.1/6.2 (peut être développée en parallèle). Dépend implicitement de **Story 5.2** (`GuestLanding.tsx` créé).

## Story

En tant que **visiteur non-connecté**,
je veux pouvoir lancer une partie en mode normal directement depuis la vitrine,
afin d'essayer le jeu avant de décider de m'inscrire.

## Acceptance Criteria

1. **Bouton Play visible dans la vitrine (FR12)** — La vitrine `GuestLanding.tsx` contient un bouton Play accessible avec la mention **explicite "Mode Normal uniquement"** (sous le bouton ou en tooltip lisible).
2. **Play ouvre SettingsModal en mode normal** — Clic sur Play ouvre `SettingsModal` avec `settings.mode === 'normal'` forcé.
3. **Mode compétitif indisponible dans le modal** — L'option mode compétitif est soit **masquée**, soit **désactivée visuellement** avec un indicateur (cadenas + "Connexion requise"). Détail complet : Story 6.4.
4. **Flow de partie normal complet (FR12)** — Lancement → quiz 10 questions → timer 10s → score final → `ResultScreen`. Aucune erreur réseau ni blocage.
5. **Persistance localStorage** — À la fin de la partie, le score est persisté via `statsStorage.ts` ([src/utils/statsStorage.ts:127-168](src/utils/statsStorage.ts#L127-L168)) — **comportement anonyme existant préservé**, aucun changement ici.
6. **Pas d'incitation inscription bloquante** — L'utilisateur peut rejouer indéfiniment sans créer de compte. L'incitation est **post-partie sur le ResultScreen** (Story 7.3), pas bloquante.
7. **Difficulté et catégorie modifiables** — Dans le SettingsModal ouvert en mode normal, le visiteur peut changer la difficulté (easy/medium/hard) et la catégorie (7 catégories + "Toutes").
8. **Qualité gates** — `npx tsc --noEmit`, `npm run lint`, `npm run build` passent. `npm run test` 100 %.

## Tasks / Subtasks

- [x] **Tâche 1 — Bouton Play dans la vitrine** (AC: 1)
  - [x] 1.1 — Dans `GuestLanding.tsx`, bouton Play gradient violet→bleu→cyan ajouté dans le hero, distinct des CTA auth. La hiérarchie visuelle a été inversée (option A retenue) : Play devient le CTA principal, les liens auth sont discrets en dessous.
  - [x] 1.2 — Label `Mode Normal · aucune inscription` affiché sous le bouton Play (tracking uppercase, opacité faible).
  - [x] 1.3 — Bouton visible sans scroll dans le hero initial (`min-h-[calc(100vh-4rem)]`).

- [x] **Tâche 2 — SettingsModal forcé en mode normal pour les anonymes** (AC: 2, 3, 7)
  - [x] 2.1 — `SettingsModal.tsx` consomme désormais `useAuth()` directement.
  - [x] 2.2 — `useEffect` force `onSettingsChange({ mode: 'normal', difficulty: 'easy', category: 'all' })` au montage si `!user && mode === 'compétitif'`.
  - [x] 2.3 — Option compétitif **visible mais verrouillée** pour les anonymes : cadenas (SVG inline) + texte "Connexion requise" + `disabled` + `aria-disabled` + `title="Connexion requise"`. L'effet glow orange et le bouton info "Règles" sont désactivés dans cet état.
  - [x] 2.4 — Difficulté (Facile/Moyen/Difficile) et catégorie (7 + Toutes) restent pleinement modifiables — vérifié par test unitaire.

- [x] **Tâche 3 — Préserver le flow de partie** (AC: 4, 5)
  - [x] 3.1 — Flow vérifié par revue de code : `GuestBranch.handleLaunch()` → `onExplosion()` → screen `'quiz'` → `QuizContainer` → `useQuiz` (normal, 10 questions) → `onFinished` → `handleFinished` → screen `'result'`.
  - [x] 3.2 — `useGameOrchestration` fait bien `if (user)` avant tout appel Supabase ([src/hooks/useGameOrchestration.ts:51](src/hooks/useGameOrchestration.ts#L51), [L74-L86](src/hooks/useGameOrchestration.ts#L74-L86)). Pas de régression.
  - [x] 3.3 — `ResultScreen` n'appelle pas `getCloudBestScore` directement (toutes les fetch passent par `useGameOrchestration`). Pour un anonyme, `bestScore` reste à `0` et `isNewBest=true` si `score > 0`. **Note** : AC5 mentionne une persistance localStorage via `statsStorage.ts` — dans l'état actuel du code, `updateStats()` n'est pas appelée pour les anonymes (ni d'ailleurs pour les connectés). Cette étape n'a PAS été corrigée ici (hors scope Story 6.3 selon Dev Notes). À traiter dans une story ultérieure si besoin.

- [x] **Tâche 4 — Tests automatisés croisés** (AC: 4, 6)
  - [x] 4.1 — Test ajouté : `ConnectedLanding.test.tsx` → "hero : bouton Play dédié avec mention explicite du mode Normal et appelle onOpenSettings (Story 6.3)".
  - [x] 4.2 — Test ajouté : `SettingsModal.test.tsx` → 5 tests (verrouillage compétitif, force normal si guest+compétitif, non-régression pour user connecté, difficulté/catégorie modifiables).
  - [x] 4.3 — Les tests manuels de persistance localStorage (`pulse_stats_*`) ne sont pas exécutés dans cette story (voir Tâche 3.3). La couverture fonctionnelle du flow Play-Guest est validée par les tests unitaires React Testing Library.

- [x] **Tâche 5 — Validation** (AC: 8)
  - [x] 5.1 — `npx tsc --noEmit` ✅, `npm run lint` ✅, `npm run build` ✅ (423ms, bundle inchangé).
  - [x] 5.2 — `npm run test -- --run` : **34 / 34 tests passent** (5 fichiers de test, dont 5 nouveaux tests pour 6.3).

## Dev Notes

### Contraintes critiques

- **Pas de régression des anonymes existants** : le mode normal sans compte fonctionne déjà (architecture brownfield, `statsStorage.ts` en place). Cette story **n'introduit pas** le support — elle le **rend visible** depuis la vitrine.
- **Ne pas forcer la création de compte** : aucune friction bloquante. Le PRD (Journey 3 — Lucas) insiste sur la transition douce des anonymes.
- **Ne pas court-circuiter la RLS** : la partie anonyme n'appelle jamais `submitScore` (RLS bloquerait de toute façon — cf. Story 6.4). `useGameOrchestration` gère déjà `if (user)` pour les appels Supabase.
- **Limiter le scope de Story 6.3 au flow "Play normal accessible"** : le lock visuel propre du compétitif est Story 6.4. Ici on peut simplement **masquer** l'option compétitif dans le SettingsModal pour les anonymes.

### Patterns à réutiliser

- **StartButton** : [src/components/landing/StartButton.tsx](src/components/landing/StartButton.tsx) — réutilisable tel quel.
- **SettingsModal** : ouverture via `openSettings` state, `onLaunch` callback.
- **useAuth().user** : `null` pour les anonymes.
- **statsStorage.ts** : API `updateStats(mode, difficulty, category, score, results)` déjà appelée dans `useGameOrchestration`.

### Comportement actuel à vérifier (pas à refactorer)

- [src/hooks/useGameOrchestration.ts](src/hooks/useGameOrchestration.ts) contient déjà `if (user)` avant les appels Supabase (établi en Story 1.1). Si ce n'est pas le cas, **ne pas toucher ici** — le signaler dans Completion Notes pour traitement dans une story ultérieure.

### Project Structure Notes

```
src/components/landing/
├── GuestLanding.tsx        # modifié — ajoute bouton Play
├── SettingsModal.tsx       # modifié — force mode normal si !user, masque/désactive compétitif
```

Aucun nouveau fichier.

### References

- Epic Story 2.3 : [_bmad-output/planning-artifacts/epics.md](_bmad-output/planning-artifacts/epics.md)
- PRD FR12, FR15 (mode normal toujours accessible)
- SettingsModal : [src/components/landing/SettingsModal.tsx](src/components/landing/SettingsModal.tsx)
- statsStorage : [src/utils/statsStorage.ts](src/utils/statsStorage.ts)
- useGameOrchestration : [src/hooks/useGameOrchestration.ts](src/hooks/useGameOrchestration.ts)

## Dev Agent Record

### Agent Model Used

claude-opus-4-6

### Completion Notes List

- ✅ **Flow Play-Guest implémenté** : le visiteur non-connecté voit un gros bouton "Jouer" dans le hero, cliquer ouvre le SettingsModal en mode normal forcé.
- ✅ **Option compétitif verrouillée** (choix design validé avec l'utilisateur) : visible avec cadenas + "Connexion requise" + `disabled`, plutôt que masquée. Cela renforce l'incitation à l'inscription sans friction bloquante.
- ✅ **Hiérarchie visuelle inversée (option A)** : le bouton Play devient le CTA principal du hero, les liens "Se connecter · S'inscrire pour le mode compétitif" sont discrets en dessous. Cohérent avec le PRD (Journey 3 — Lucas) qui favorise la transition douce des anonymes.
- ✅ **`useGameOrchestration` gère bien `!user`** ([src/hooks/useGameOrchestration.ts:51](src/hooks/useGameOrchestration.ts#L51), [L74-L86](src/hooks/useGameOrchestration.ts#L74-L86)) : aucun appel Supabase (ni `submitScore`, ni `incrementCategoryStats`, ni `incrementGlobalStats`, ni `checkAndUnlockAchievements`) n'est déclenché. `prevBest = 0`, `setScreen('result')` direct.
- ⚠️ **Persistance localStorage non active pour les anonymes** : l'AC 5 mentionne `statsStorage.updateStats()` comme comportement existant préservé. En fait, `updateStats()` n'est appelée nulle part dans le flow actuel (ni anonyme ni connecté). Le `bestScore` d'un anonyme reste donc à `0` et `isNewBest=true` à chaque partie >0. **Hors scope Story 6.3** selon Dev Notes ("ne pas toucher ici — le signaler dans Completion Notes"). À traiter en story ultérieure si le produit veut des stats locales pour les anonymes.
- ✅ **Tests** : 5 nouveaux tests (4 pour SettingsModal guest flow, 1 pour hero Play button). 34 / 34 tests passent.
- ✅ **Gates qualité** : tsc OK, ESLint OK, build OK.

### File List

**Modifiés :**
- `src/components/landing/GuestLanding.tsx` — Hero refactoré : bouton Play gradient (CTA primaire) + mention "Mode Normal · aucune inscription" + liens auth discrets "Se connecter · S'inscrire pour le mode compétitif".
- `src/components/landing/SettingsModal.tsx` — consommation `useAuth()`, `useEffect` qui force `mode='normal'` si guest+compétitif, mode compétitif rendu `disabled` avec cadenas + "Connexion requise" pour les anonymes.
- `src/components/landing/ConnectedLanding.test.tsx` — test mis à jour (multiples boutons Jouer entre header et hero) + 1 nouveau test "hero : bouton Play dédié avec mention explicite du mode Normal".

**Créés :**
- `src/components/landing/SettingsModal.test.tsx` — 5 tests (useAuth mocké) couvrant le verrouillage compétitif guest, le forçage automatique du mode normal, la non-régression pour les utilisateurs connectés, et la modifiabilité des champs difficulté/catégorie.

### Change Log

| Date | Changement |
|---|---|
| 2026-04-13 | Implémentation initiale Story 6.3 : Play button guest + SettingsModal verrouillage compétitif. |
| 2026-04-13 | Design : hiérarchie du hero inversée (Play primaire, auth discrets) suite au feedback utilisateur. |
| 2026-04-13 | Design : option compétitif rendue `disabled` (cadenas + "Connexion requise") plutôt que masquée, suite au feedback utilisateur. |
