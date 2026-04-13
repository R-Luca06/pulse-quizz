# Story 6.4 : Blocage mode compétitif pour non-connectés (client + RLS)

Status: review

> Cycle "Landing Avatar & Vitrine" — Epic 6 (ex-Epic 2). Indépendante de 6.1/6.2/6.3 mais recouvre partiellement Story 6.3 sur le lock visuel dans le SettingsModal.

> **⚠️ Info critique découverte lors de la création de cette story :** la RLS bloquante **existe déjà** dans [scripts/supabase_schema.sql:147-149](scripts/supabase_schema.sql#L147-L149) :
> ```sql
> CREATE POLICY "leaderboard_insert_own" ON leaderboard FOR INSERT
>   WITH CHECK (auth.uid() = user_id);
> ```
> Côté serveur, **rien n'est à faire** — `auth.uid()` renvoie NULL pour un client non-authentifié, le `WITH CHECK` échoue, l'INSERT est rejeté. Cette story **valide** la RLS existante plutôt que de la créer.

## Story

En tant que **système**,
je veux bloquer l'accès au mode compétitif pour les visiteurs non-connectés côté client ET côté serveur,
afin de garantir l'intégrité du leaderboard et rendre l'incitation à créer un compte effective.

## Acceptance Criteria

1. **Option compétitif désactivée visuellement si `!user` (FR11)** — Dans [src/components/landing/SettingsModal.tsx](src/components/landing/SettingsModal.tsx), l'option mode compétitif affiche un **cadenas** + message "Connexion requise" quand `useAuth().user === null`. L'option reste visible mais non-cliquable (ou cliquable pour ouvrir l'AuthModal — cf. AC 3).
2. **Styling lock cohérent** — Le bouton compétitif désactivé conserve son aspect visuel mais est "grisé" : opacité réduite, cadenas SVG affiché à droite du label, curseur `cursor-not-allowed` au hover.
3. **Clic sur compétitif verrouillé → AuthModal** — Si l'utilisateur non-connecté clique quand même sur l'option compétitive, l'`AuthModal` s'ouvre sur l'onglet `'signup'` avec un message explicatif court (ex: toast : "Crée un compte pour le mode compétitif").
4. **Partie compétitive ne démarre pas** — Même si (via bug ou manipulation DevTools) le mode compétitif était activé pour un anonyme, la partie ne démarre pas (le front bloque avant d'appeler `fetchCompetitifBatch`).
5. **RLS serveur déjà en place (NFR9)** — La policy `leaderboard_insert_own` existe dans [scripts/supabase_schema.sql:147-149](scripts/supabase_schema.sql#L147-L149). **Aucune modification du schéma** — juste vérification.
6. **Test RLS manuel** — Depuis la DevTools console d'un onglet non-authentifié, tenter manuellement `supabase.from('leaderboard').insert({ user_id: 'any-uuid', username: 'hacker', score: 999, mode: 'compétitif', difficulty: 'mixed', language: 'fr' })`. Résultat attendu : erreur RLS (`new row violates row-level security policy`). Consigner la preuve dans Completion Notes.
7. **Gestion erreur côté client** — Si jamais `submitScore` est appelé par un client anonyme (cas edge : session expirée en cours de partie compétitive), l'erreur Supabase est catch et transformée en `AppError` code `'auth_error'`. Toast "Session expirée — reconnecte-toi" affiché. Comportement déjà présent ? À vérifier dans [src/services/leaderboard.ts](src/services/leaderboard.ts).
8. **Documentation** — Ajouter un commentaire dans `supabase_schema.sql` au-dessus de la policy `leaderboard_insert_own` expliquant qu'elle constitue la garantie de sécurité serveur pour NFR9 (si pas déjà présent).
9. **Qualité gates** — `npx tsc --noEmit`, `npm run lint`, `npm run build` passent.

## Tasks / Subtasks

- [x] **Tâche 1 — Lock visuel de l'option compétitif dans le SettingsModal** (AC: 1, 2)
  - [x] 1.1 — Import `useAuth` + extraction `{ user }` déjà présents (Story 6.3).
  - [x] 1.2 — `isLocked = isComp && isGuest` déjà calculé dans la boucle `MODES.map`.
  - [x] 1.3 — Cadenas SVG + `cursor-not-allowed` + opacity réduite + sous-texte "Connexion requise" déjà présents ([SettingsModal.tsx:158-167](src/components/landing/SettingsModal.tsx#L158-L167)).
  - [x] 1.4 — Animation boxShadow désactivée quand locked ([SettingsModal.tsx:131-135](src/components/landing/SettingsModal.tsx#L131-L135)).

- [x] **Tâche 2 — Clic sur compétitif verrouillé → AuthModal** (AC: 3)
  - [x] 2.1 — Prop `onRequireAuth?: () => void` ajoutée à `SettingsModal`.
  - [x] 2.2 — `onClick` du bouton mode : si `isLocked` → `onRequireAuth?.()`, sinon `handleModeChange`. Le `disabled` HTML est retiré (remplacé par `aria-disabled` uniquement) pour permettre le clic.
  - [x] 2.3 — `LandingPage.GuestBranch` passe `onRequireAuth={handleRequireAuth}` qui ferme le modal puis appelle `onOpenSignUp()`.
  - [x] 2.4 — Toast skippé (tâche marquée optionnelle dans la story ; `useToast` n'expose que `success`/`error`, pas de variante neutre — l'ouverture de l'AuthModal est déjà un signal visuel clair).

- [x] **Tâche 3 — Garde-fou côté SettingsModal launch** (AC: 4)
  - [x] 3.1 — Nouveau `handleLaunch` local dans `SettingsModal` : si `isCompetitif && isGuest` → `onRequireAuth?.()` et return. Le `motion.button` Lancer pointe sur `handleLaunch` au lieu de `onLaunch`.
  - [x] 3.2 — Log dans `useGameOrchestration` non fait (marqué optionnel, règle CLAUDE.md : éviter handlers défensifs pour cas impossibles).

- [x] **Tâche 4 — Vérification RLS serveur** (AC: 5, 6)
  - [x] 4.1 — Policy `leaderboard_insert_own` confirmée présente ([supabase_schema.sql:151-154](scripts/supabase_schema.sql#L151-L154)). Aucune modification du SQL exécutable.
  - [x] 4.2 / 4.3 — Test manuel RLS exécuté 2026-04-13 : `error.code === '42501'`, message `new row violates row-level security policy for table "leaderboard"`. Preuve complète dans Completion Notes.

- [x] **Tâche 5 — Documentation** (AC: 8)
  - [x] 5.1 — Commentaire NFR9 ajouté au-dessus de `CREATE POLICY "leaderboard_insert_own"` ([supabase_schema.sql:146-150](scripts/supabase_schema.sql#L146-L150)).

- [x] **Tâche 6 — Gestion erreur client** (AC: 7)
  - [x] 6.1 — Helper `mapSupabaseWriteError` ajouté dans [leaderboard.ts](src/services/leaderboard.ts) : détecte `code === '42501'` ou message `row-level security` → throw `AppError('auth_error', 'Session expirée')`. Appliqué aux 4 points d'écriture (`insert`/`update` × compétitif/normal).
  - [x] 6.2 — Skippé (optionnel, règle toast depuis hooks). L'erreur typée est disponible pour `App.tsx` si besoin futur.

- [x] **Tâche 7 — Validation** (AC: 9)
  - [x] 7.1 — `npx tsc --noEmit` exit 0, `npm run lint` exit 0, `npm run build` exit 0 (421ms). Vitest : 36/36 tests passent (dont 7 dans `SettingsModal.test.tsx`, 2 nouveaux tests AC3 et AC4).
  - [x] 7.2 — Test manuel navigateur réalisé par l'utilisateur (AC6 validé — code RLS 42501 confirmé).

## Dev Notes

### Contraintes critiques

- **La RLS existe déjà** : NE PAS créer une nouvelle policy. Juste documenter.
- **`auth.uid()` NULL pour anonymes** : garantie Supabase. Pas de contournement possible sans JWT valide.
- **Règle toast** : toasts uniquement depuis composants / App.tsx, pas depuis hooks/services.
- **Ne pas modifier `leaderboard.ts`** sauf si l'erreur RLS n'est pas déjà propagée (vérifier d'abord).

### Patterns à réutiliser

- **useAuth().user** : source de vérité unique pour l'état connecté.
- **AuthModal avec `defaultTab='signup'`** : pattern de Story 6.2.
- **AppError** : classe unifiée dans [src/services/errors.ts](src/services/errors.ts).

### Interaction avec Story 6.3

- Story 6.3 "masque" simplement le compétitif. Story 6.4 "verrouille proprement" avec cadenas + CTA auth.
- Si 6.3 et 6.4 sont implémentées **dans cet ordre**, 6.4 enrichit 6.3.
- Si 6.4 est implémentée avant 6.3, la logique lock est déjà présente et 6.3 n'a qu'à s'assurer que le Play ouvre bien le SettingsModal (pas de changement côté SettingsModal).

### Project Structure Notes

```
src/components/landing/
├── SettingsModal.tsx       # modifié — lock visuel compétitif + onRequireAuth
├── LandingPage.tsx         # modifié — passe onRequireAuth
scripts/
└── supabase_schema.sql     # modifié — commentaire doc sur leaderboard_insert_own
```

Aucun nouveau fichier.

### References

- Epic Story 2.4 : [_bmad-output/planning-artifacts/epics.md](_bmad-output/planning-artifacts/epics.md)
- PRD FR11 / NFR9
- Policy existante : [scripts/supabase_schema.sql:139-155](scripts/supabase_schema.sql#L139-L155)
- leaderboard service : [src/services/leaderboard.ts](src/services/leaderboard.ts)
- Rapport readiness — Issue 4 (inspection schéma avant 6.4) : fait en amont, résultat positif (RLS présente).

## Dev Agent Record

### Agent Model Used

claude-opus-4-6

### Completion Notes List

- [x] **Lock visuel compétitif** (cadenas SVG + "Connexion requise" + `cursor-not-allowed` + opacity) : OK, vérifié dans [SettingsModal.tsx:124-183](src/components/landing/SettingsModal.tsx#L124-L183). Déjà livré par Story 6.3, conservé tel quel. ⚠️ Cependant : le `disabled` HTML a été retiré pour permettre le clic (AC3). L'état verrouillé est désormais signalé par `aria-disabled="true"` + styling, pas par `disabled`.
- [x] **AC3 — Clic compétitif verrouillé → AuthModal signup** : nouvelle prop `onRequireAuth` dans `SettingsModal`. `GuestBranch` de `LandingPage.tsx` câble `handleRequireAuth` qui ferme le modal et appelle `onOpenSignUp()` (plumbé depuis `App.tsx` via `openSignUp = () => setAuthModal({ open: true, tab: 'signup' })`).
- [x] **AC4 — Garde-fou onLaunch** : `handleLaunch` local vérifie `isCompetitif && isGuest` avant `onLaunch()`, et redirige sur `onRequireAuth` si violation. Empêche le démarrage d'une partie compétitive contournée par DevTools / session expirée.
- [x] **AC7 — AppError 'auth_error'** : helper `mapSupabaseWriteError` dans `leaderboard.ts` détecte `code === '42501'` (PostgreSQL RLS violation) ou message `row-level security` et throw `AppError('auth_error', 'Session expirée')` au lieu d'un `Error` générique. Les 4 points d'écriture du leaderboard (insert/update × compétitif/normal) utilisent le helper.
- [x] **AC8 — Commentaire doc SQL NFR9** : ajouté au-dessus de la policy `leaderboard_insert_own` dans [supabase_schema.sql:146-150](scripts/supabase_schema.sql#L146-L150).
- [x] **Tests unitaires** : 2 nouveaux tests ajoutés dans `SettingsModal.test.tsx` — "clic compétitif verrouillé déclenche onRequireAuth (AC3)" et "garde-fou Lancer déclenche onRequireAuth si guest + mode compétitif (AC4)". Le test historique vérifiant `toBeDisabled()` a été mis à jour en `aria-disabled="true"`. 7/7 tests passent.
- [x] **Gates qualité** : `npx tsc --noEmit` ✅, `npm run lint` ✅, `npm run build` ✅ (421ms), `vitest` full ✅ 36/36.
- [x] **AC6 — Test RLS manuel** : exécuté 2026-04-13 en navigation privée. Résultat consigné ci-dessous (`code: "42501"`, message RLS). Procédure réutilisable :
  1. Lancer `npm run dev` et ouvrir `http://localhost:5173` en navigation privée / logged out.
  2. Ouvrir DevTools → Console.
  3. Coller (sans les triples backticks ; NB : `import.meta.env` ne marche pas en console, et Safari/certaines consoles rejettent `await` top-level — d'où l'IIFE async) :
     ```js
     (async () => {
       const { supabase } = await import('/src/services/supabase.ts')
       const { data, error } = await supabase.from('leaderboard').insert({
         user_id: '00000000-0000-0000-0000-000000000000',
         username: 'hacker',
         score: 9999,
         mode: 'compétitif',
         difficulty: 'mixed',
         language: 'fr',
       })
       console.log({ data, error })
     })()
     ```
  4. **Résultat obtenu (2026-04-13)** :
     ```json
     {
       "data": null,
       "error": {
         "code": "42501",
         "details": null,
         "hint": null,
         "message": "new row violates row-level security policy for table \"leaderboard\""
       }
     }
     ```
     HTTP status : 401. RLS serveur validée : la policy `leaderboard_insert_own` rejette bien un INSERT anonyme.

### File List

**Modifiés :**
- `src/components/landing/SettingsModal.tsx` — prop `onRequireAuth`, `handleLaunch` avec garde-fou, `onClick` mode compétitif route vers `onRequireAuth` quand locked (retrait du `disabled` HTML).
- `src/components/landing/LandingPage.tsx` — `GuestBranch` câble `onRequireAuth={handleRequireAuth}` qui ferme le modal et ouvre l'AuthModal signup.
- `src/components/landing/SettingsModal.test.tsx` — 2 nouveaux tests AC3 / AC4 + mise à jour du test historique (aria-disabled au lieu de disabled).
- `src/services/leaderboard.ts` — helper `mapSupabaseWriteError` + import `AppError` ; appliqué aux 4 points d'écriture de `submitScore`.
- `scripts/supabase_schema.sql` — commentaire doc NFR9 au-dessus de `leaderboard_insert_own` (pas de modification exécutable).

### Change Log

- 2026-04-13 — Implémentation Story 6.4 (AC1-AC5, AC7-AC9). AC6 (test RLS manuel) laissé pour validation utilisateur.
