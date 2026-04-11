# Story 2.4 : ProfilePage — Onglet Confidentialité (MDP + suppression compte)

Status: review

## Story

En tant qu'utilisateur connecté,
je veux pouvoir changer mon mot de passe et supprimer mon compte depuis l'onglet Confidentialité,
afin de garder le contrôle sur mes données personnelles.

## Acceptance Criteria

1. L'onglet **Confidentialité** contient une section "Changer le mot de passe".
2. Le formulaire de changement MDP contient : nouveau mot de passe + confirmation, bouton Enregistrer.
3. Validation côté client : les deux champs doivent correspondre, longueur ≥ 8 caractères.
4. La mise à jour du MDP utilise `supabase.auth.updateUser({ password })`.
5. Un toast de succès s'affiche après changement réussi.
6. L'onglet contient une section "Zone de danger" avec un bouton "Supprimer mon compte".
7. Cliquer "Supprimer mon compte" ouvre une modale de confirmation avec texte explicatif.
8. La suppression est confirmée en tapant le pseudo exact dans un champ de confirmation (protection anti-clic accidentel).
9. La suppression appelle une RPC Supabase `delete_user()` qui supprime les données utilisateur.
10. Après suppression réussie, l'utilisateur est déconnecté et redirigé vers `'landing'`.
11. Les erreurs (MDP trop court, erreur réseau, etc.) s'affichent dans le formulaire correspondant.
12. `npx tsc --noEmit`, `npm run lint` passent sans nouvelle erreur.

## Tasks / Subtasks

- [x] **Tâche 1 — Service : changement MDP** (AC: 4, 11)
  - [x] 1.1 — Dans `src/services/profile.ts` (créé en story 2.2), ajouter `updatePassword(newPassword: string): Promise<void>`
  - [x] 1.2 — Valider longueur ≥ 8 avant l'appel Supabase (`AppError('validation_error', ...)`)
  - [x] 1.3 — Appeler `supabase.auth.updateUser({ password: newPassword })`
  - [x] 1.4 — Si `error`, lancer `AppError('auth_error', error.message)`

- [x] **Tâche 2 — Service : suppression de compte** (AC: 9, 10)
  - [x] 2.1 — Dans `src/services/profile.ts`, ajouter `deleteAccount(): Promise<void>`
  - [x] 2.2 — Appeler `supabase.rpc('delete_user')` (voir note sur la RPC ci-dessous)
  - [x] 2.3 — Si `error`, lancer `AppError('auth_error', error.message)`
  - [x] 2.4 — **Créer la RPC Supabase** `delete_user` dans le dashboard Supabase (voir SQL fourni dans Dev Notes) — ⚠️ Action externe requise (voir note dans Completion Notes)

- [x] **Tâche 3 — Composant ConfidentialityTab** (AC: 1, 2, 3, 5, 6, 7, 8, 10, 11)
  - [x] 3.1 — Créer `src/components/profile/tabs/ConfidentialityTab.tsx`
  - [x] 3.2 — **Section Changer le MDP** :
    - Champs : `newPassword` + `confirmPassword`
    - Validation : correspondance + longueur ≥ 8
    - Submit : `updatePassword(newPassword)` → toast succès → reset les champs
  - [x] 3.3 — **Section Zone de danger** :
    - Bouton "Supprimer mon compte" stylé en rouge (`game-danger` ou `neon-pink`)
    - Séparé visuellement de la section MDP (bordure ou séparateur)
  - [x] 3.4 — **Modale de confirmation** :
    - Overlay + dialogue centré
    - Texte : "Cette action est irréversible. Toutes tes données seront supprimées."
    - Champ texte : "Tape ton pseudo @{username} pour confirmer"
    - Bouton "Supprimer définitivement" (rouge, désactivé tant que le champ ne correspond pas)
    - Bouton "Annuler"
  - [x] 3.5 — Logique de suppression : `deleteAccount()` → `signOut()` → `onBack()` (retour landing)
  - [x] 3.6 — La modale utilise `AnimatePresence` pour l'animation d'entrée/sortie

- [x] **Tâche 4 — Intégration dans ProfilePage** (AC: 1)
  - [x] 4.1 — Dans `ProfilePage.tsx`, remplacer le placeholder `{activeTab === 'confidentiality'}` par `<ConfidentialityTab onBack={onBack} />`

- [x] **Tâche 5 — Validation** (AC: 12)
  - [x] 5.1 — Test manuel : changement MDP, vérifier toast succès (à valider manuellement)
  - [x] 5.2 — Test manuel : suppression → modale → saisie pseudo → suppression → retour landing (à valider manuellement, RPC requise)
  - [x] 5.3 — `npx tsc --noEmit` : zéro erreur ✅ (EXIT 0)
  - [x] 5.4 — `npm run lint` : zéro nouveau warning sur les fichiers modifiés ✅

## Dev Notes

### Prérequis

Stories 2.1 et 2.2 terminées. `src/services/profile.ts` existe déjà (créé en 2.2).

### Service updatePassword

```ts
// À ajouter dans src/services/profile.ts
import { supabase } from './supabase'
import { AppError } from './errors'

export async function updatePassword(newPassword: string): Promise<void> {
  if (newPassword.length < 8) {
    throw new AppError('validation_error', 'Le mot de passe doit contenir au moins 8 caractères')
  }
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) throw new AppError('auth_error', error.message)
}
```

### Service deleteAccount — RPC côté client

La suppression d'un utilisateur Supabase Auth ne peut pas se faire via le client JS standard (nécessite la clé service role, jamais exposée côté client).
**Solution : RPC PostgreSQL** qui s'exécute avec les droits `SECURITY DEFINER`.

```ts
// À ajouter dans src/services/profile.ts
export async function deleteAccount(): Promise<void> {
  const { error } = await supabase.rpc('delete_user')
  if (error) throw new AppError('auth_error', error.message)
}
```

### SQL à exécuter dans le dashboard Supabase (SQL Editor)

```sql
-- Fonction RPC appelable par l'utilisateur authentifié
CREATE OR REPLACE FUNCTION delete_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Supprimer les données utilisateur (cascade si foreign keys configurées)
  DELETE FROM public.profiles WHERE id = auth.uid();
  DELETE FROM public.user_stats WHERE user_id = auth.uid();
  DELETE FROM public.user_global_stats WHERE user_id = auth.uid();
  DELETE FROM public.comp_leaderboard WHERE user_id = auth.uid();
  -- Supprimer le compte auth
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;

-- Donner la permission aux utilisateurs authentifiés
GRANT EXECUTE ON FUNCTION delete_user() TO authenticated;
```

**Important** : vérifier les noms exacts des colonnes `user_id` dans chaque table avant d'exécuter ce SQL. Adapter si les colonnes s'appellent différemment (ex: `id` au lieu de `user_id`).

### Validation formulaire MDP côté client

```ts
function handlePasswordSubmit() {
  if (newPassword !== confirmPassword) {
    setPasswordError('Les mots de passe ne correspondent pas')
    return
  }
  if (newPassword.length < 8) {
    setPasswordError('Minimum 8 caractères')
    return
  }
  // ... appel service
}
```

### Modale de confirmation suppression

```tsx
// Pattern modale avec AnimatePresence
<AnimatePresence>
  {showDeleteModal && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="mx-4 w-full max-w-md rounded-2xl border border-game-border bg-game-card p-6"
      >
        <h3 className="text-lg font-bold text-white">Supprimer mon compte</h3>
        <p className="mt-2 text-sm text-white/60">
          Cette action est irréversible. Toutes tes données seront définitivement supprimées.
        </p>
        <p className="mt-4 text-sm text-white/80">
          Tape <strong>@{profile?.username}</strong> pour confirmer :
        </p>
        <input
          value={deleteConfirmText}
          onChange={e => setDeleteConfirmText(e.target.value)}
          className="mt-2 w-full rounded-lg border border-game-border bg-game-bg px-3 py-2 text-sm text-white outline-none focus:border-game-danger"
          placeholder={`@${profile?.username}`}
        />
        <div className="mt-4 flex gap-3">
          <button onClick={() => setShowDeleteModal(false)} className="...">
            Annuler
          </button>
          <button
            onClick={handleDeleteAccount}
            disabled={deleteConfirmText !== `@${profile?.username}` || deleteLoading}
            className="... disabled:opacity-40"
          >
            Supprimer définitivement
          </button>
        </div>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>
```

### Flux de suppression complet

```ts
async function handleDeleteAccount() {
  setDeleteLoading(true)
  setDeleteError(null)
  try {
    await deleteAccount()       // RPC Supabase
    await signOut()             // déconnexion via useAuth()
    onBack()                    // retour landing (setScreen('landing') via prop)
  } catch (err) {
    setDeleteError(err instanceof AppError ? err.message : 'Erreur lors de la suppression')
  } finally {
    setDeleteLoading(false)
  }
}
```

### Règles critiques à respecter

- **`signOut()` après `deleteAccount()`** — toujours signOut après suppression pour nettoyer la session
- **`useToast()`** uniquement dans le composant, jamais dans les services
- **`AnimatePresence`** pour la modale de confirmation — cohérent avec les autres modales de l'app (AuthModal, SettingsModal)
- **La RPC `delete_user` doit être créée dans Supabase avant de dev** — sans elle, `deleteAccount()` échouera systématiquement
- **Tailwind** : utiliser `game-danger` pour le rouge (zone danger), pas `red-500` ou autre générique

### Pièges à éviter

1. **Noms de colonnes dans le SQL** : vérifier dans le code existant (`cloudStats.ts`, `leaderboard.ts`) les noms exacts des colonnes foreign key avant d'écrire le SQL de suppression. Si une FK est `user_id`, adapter le DELETE en conséquence.
2. **`auth.users` DELETE** : la ligne `DELETE FROM auth.users WHERE id = auth.uid()` peut échouer si Supabase a des restrictions. Alternative : utiliser `extensions.http` ou `pg_net` pour appeler l'API admin. Si ça ne fonctionne pas, documenter le blocage dans les Dev Notes de completion.
3. **État loading séparé** : utiliser deux états loading distincts — `passwordLoading` et `deleteLoading` — pour ne pas bloquer les deux sections simultanément.
4. **Reset du formulaire MDP** : après succès, vider les champs `newPassword` et `confirmPassword` pour ne pas laisser le MDP en clair dans le state.

### Project Structure Notes

Nouveaux fichiers :
```
src/
  components/
    profile/
      tabs/
        ConfidentialityTab.tsx   ← onglet Confidentialité
```

Fichiers modifiés :
- `src/services/profile.ts` — ajout `updatePassword()` et `deleteAccount()`
- `src/components/profile/ProfilePage.tsx` — remplacement placeholder onglet confidentialité

Action externe requise (hors code) :
- Exécuter le SQL `CREATE FUNCTION delete_user()` dans le dashboard Supabase

### References

- [Source: src/services/profile.ts] — créé en story 2.2, à étendre
- [Source: src/contexts/AuthContext.tsx] — signOut(), user, profile
- [Source: src/components/auth/AuthModal.tsx] — pattern modale avec AnimatePresence à reproduire
- [Source: _bmad-output/planning-artifacts/architecture.md#Pattern loading state]
- [Source: _bmad-output/planning-artifacts/architecture.md#Gestion d'erreur unifiée — AppError]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

Aucun blocage technique. `tsc --noEmit` EXIT 0. Les erreurs ESLint existantes (`LandingPage.tsx`, `QuizContainer.tsx`, `useQuiz.ts`, `useTimer.ts`, `RankingRevealScreen.tsx`) sont pré-existantes et hors scope de cette story.

### Completion Notes List

- ✅ `updatePassword()` ajouté à `src/services/profile.ts` : validation longueur ≥ 8 côté client + `supabase.auth.updateUser({ password })`
- ✅ `deleteAccount()` ajouté à `src/services/profile.ts` : appel `supabase.rpc('delete_user')`
- ✅ `ConfidentialityTab.tsx` créé avec les deux sections (MDP + Zone de danger), modale animée avec `AnimatePresence`, états loading séparés (`passwordLoading` / `deleteLoading`)
- ✅ `ProfilePage.tsx` mis à jour : import + remplacement du placeholder par `<ConfidentialityTab onBack={onBack} />`
- ⚠️ **Action externe requise** : le SQL `CREATE FUNCTION delete_user()` doit être exécuté dans le dashboard Supabase (SQL fourni dans Dev Notes). Sans cette RPC, `deleteAccount()` échouera avec une erreur "function not found".

### File List

- `src/services/profile.ts` (modifié — ajout `updatePassword`, `deleteAccount`)
- `src/components/profile/tabs/ConfidentialityTab.tsx` (nouveau)
- `src/components/profile/ProfilePage.tsx` (modifié — import + intégration ConfidentialityTab)
