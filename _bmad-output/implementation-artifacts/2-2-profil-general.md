# Story 2.2 : ProfilePage — Structure + Onglet Général (changement de pseudo)

Status: review

## Story

En tant qu'utilisateur connecté,
je veux accéder à ma page profil depuis la nav et pouvoir changer mon pseudo depuis l'onglet Général,
afin de personnaliser mon compte et rester engagé dans l'application.

## Acceptance Criteria

1. Un clic sur le pseudo dans la nav (story 2.1) ouvre l'écran `'profile'` via `setScreen('profile')`.
2. La `ProfilePage` affiche une structure à 3 onglets : **Général**, **Statistiques**, **Confidentialité**.
3. L'onglet actif par défaut est **Général**.
4. L'onglet Général affiche le pseudo actuel de l'utilisateur.
5. L'onglet Général contient un formulaire permettant de modifier le pseudo (champ texte + bouton Enregistrer).
6. La modification est persistée dans la table Supabase `profiles` (colonne `username`).
7. Après succès, `refreshProfile()` est appelé pour propager la mise à jour dans toute l'app.
8. Un toast de succès s'affiche après mise à jour réussie.
9. Les erreurs (pseudo déjà pris, trop court, etc.) sont affichées dans le formulaire.
10. Un bouton "Retour" ramène à la landing page.
11. La page profil est inaccessible aux utilisateurs non connectés — redirection vers `'landing'` si `user === null`.
12. `npx tsc --noEmit`, `npm run lint` passent sans nouvelle erreur.

## Tasks / Subtasks

- [x] **Tâche 1 — Service profil** (AC: 6, 9)
  - [x] 1.1 — Créer `src/services/profile.ts`
  - [x] 1.2 — Implémenter `updateUsername(userId: string, username: string): Promise<void>`
    - Valider : longueur 3-20 caractères, alphanumérique + underscore
    - Appeler `supabase.from('profiles').update({ username }).eq('id', userId)`
    - Lancer `AppError('validation_error')` si validation échoue
    - Lancer `AppError('db_error', error.message)` si Supabase retourne une erreur
  - [x] 1.3 — Vérifier que `src/services/errors.ts` existe (créé en architecture). Si absent, le créer avec la classe `AppError` définie dans l'architecture

- [x] **Tâche 2 — Composant ProfilePage** (AC: 1, 2, 3, 10, 11)
  - [x] 2.1 — Créer le dossier `src/components/profile/`
  - [x] 2.2 — Créer `src/components/profile/ProfilePage.tsx` (default export)
  - [x] 2.3 — Props : `{ onBack: () => void; defaultTab?: ProfileTab }`
  - [x] 2.4 — Définir `type ProfileTab = 'general' | 'stats' | 'confidentiality'` dans le fichier (type local)
  - [x] 2.5 — Guard de connexion : si `user === null`, appeler `onBack()` immédiatement dans un `useEffect`
  - [x] 2.6 — Implémenter la barre d'onglets (3 tabs) avec état `activeTab`
  - [x] 2.7 — Implémenter le bouton Retour (appelle `onBack`)
  - [x] 2.8 — Layout : plein écran `min-h-screen bg-game-bg`, en-tête avec titre "Mon Profil" + bouton retour, barre d'onglets, contenu de l'onglet actif

- [x] **Tâche 3 — Onglet Général** (AC: 4, 5, 7, 8, 9)
  - [x] 3.1 — Créer `src/components/profile/tabs/GeneralTab.tsx` (default export)
  - [x] 3.2 — Afficher le pseudo actuel (`profile?.username`)
  - [x] 3.3 — Formulaire : champ texte pré-rempli avec le pseudo actuel + bouton "Enregistrer"
  - [x] 3.4 — State : `username` (valeur du champ), `loading`, `error`
  - [x] 3.5 — Submit : appeler `updateUsername(user.id, username)` depuis `profile.ts`, puis `refreshProfile()`, puis `toast.success('Pseudo mis à jour')`
  - [x] 3.6 — Gestion erreur : afficher `error` sous le champ si `AppError` levée
  - [x] 3.7 — Désactiver le bouton si `username === profile?.username` (pas de changement) ou `loading === true`

- [x] **Tâche 4 — Intégration dans App.tsx** (AC: 1, 10)
  - [x] 4.1 — Importer `ProfilePage` dans `App.tsx`
  - [x] 4.2 — Remplacer le placeholder de story 2.1 par le vrai composant `ProfilePage`
  - [x] 4.3 — Passer `onBack={() => setScreen('landing')}` à `ProfilePage`
  - [x] 4.4 — Ajouter les animations Framer Motion cohérentes avec les autres écrans (fade + slide-up)

- [x] **Tâche 5 — Validation** (AC: 12)
  - [x] 5.1 — Test manuel : navigation landing → profil → retour, mise à jour pseudo
  - [x] 5.2 — `npx tsc --noEmit` : zéro erreur
  - [x] 5.3 — `npm run lint` : zéro nouveau warning (les warnings pré-existants ne font pas partie de cette story)

## Dev Notes

### Prérequis

**Story 2.1 doit être terminée** : `'profile'` doit être dans le type `AppScreen` et `onShowProfile` doit exister dans `LandingPage`.

### Nouveau service — `src/services/profile.ts`

```ts
// src/services/profile.ts
import { supabase } from './supabase'
import { AppError } from './errors'

export async function updateUsername(userId: string, username: string): Promise<void> {
  const trimmed = username.trim()
  if (trimmed.length < 3 || trimmed.length > 20) {
    throw new AppError('validation_error', 'Le pseudo doit contenir entre 3 et 20 caractères')
  }
  if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
    throw new AppError('validation_error', 'Le pseudo ne peut contenir que des lettres, chiffres et underscores')
  }
  const { error } = await supabase
    .from('profiles')
    .update({ username: trimmed })
    .eq('id', userId)
  if (error) throw new AppError('db_error', error.message)
}
```

### Vérifier errors.ts

Si `src/services/errors.ts` n'existe pas encore, le créer :

```ts
// src/services/errors.ts
export class AppError extends Error {
  readonly code: 'rate_limit' | 'api_error' | 'network_error' | 'db_error' | 'auth_error' | 'not_found' | 'validation_error'
  constructor(code: AppError['code'], message?: string) {
    super(message ?? code)
    this.name = 'AppError'
    this.code = code
  }
}
export type AppErrorCode = AppError['code']
```

### Structure ProfilePage

```tsx
// src/components/profile/ProfilePage.tsx
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../contexts/ToastContext'
import GeneralTab from './tabs/GeneralTab'

type ProfileTab = 'general' | 'stats' | 'confidentiality'

interface Props {
  onBack: () => void
  defaultTab?: ProfileTab
}

export default function ProfilePage({ onBack, defaultTab = 'general' }: Props) {
  const { user, profile } = useAuth()
  const [activeTab, setActiveTab] = useState<ProfileTab>(defaultTab)

  useEffect(() => {
    if (!user) onBack()
  }, [user, onBack])

  if (!user) return null  // Guard pendant le redirect

  return (
    <div className="flex min-h-screen flex-col bg-game-bg">
      {/* Header */}
      {/* Tab bar */}
      {/* Tab content */}
      {activeTab === 'general' && <GeneralTab />}
      {activeTab === 'stats' && <div>{/* story 2.3 */}</div>}
      {activeTab === 'confidentiality' && <div>{/* story 2.4 */}</div>}
    </div>
  )
}
```

### Pattern loading state (issu de l'architecture)

```ts
const [loading, setLoading] = useState(false)
const [error, setError] = useState<string | null>(null)

async function handleSubmit() {
  setError(null)
  setLoading(true)
  try {
    await updateUsername(user.id, username)
    await refreshProfile()
    toast.success('Pseudo mis à jour')
  } catch (err) {
    setError(err instanceof AppError ? err.message : 'Erreur inattendue')
  } finally {
    setLoading(false)
  }
}
```

### Intégration App.tsx

```tsx
// Remplacer le placeholder de story 2.1
import ProfilePage from './components/profile/ProfilePage'

{screen === 'profile' && (
  <motion.div
    key="profile"
    initial={{ opacity: 0, y: 40 }}
    animate={{ opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.1, ease: 'easeOut' } }}
    exit={{ opacity: 0, transition: { duration: 0.25 } }}
    className="absolute inset-0"
  >
    <ProfilePage onBack={() => setScreen('landing')} />
  </motion.div>
)}
```

### Règles critiques à respecter

- **`useToast()`** uniquement dans le composant (jamais dans le service `profile.ts`)
- **`useAuth()`** source unique de `user` et `profile` — ne pas passer `user.id` en prop depuis App.tsx, le récupérer dans le composant via `useAuth()`
- **`refreshProfile()`** doit être appelé après succès pour propager le nouveau pseudo dans toute l'app (header nav incluse)
- **`import type`** pour tout type pur (`import type { AppError } ...`)
- **Tailwind palette** : `game-bg`, `game-card`, `game-border`, `neon-violet` — pas de couleurs génériques
- Onglets Statistiques et Confidentialité laissés avec contenu placeholder `<div>` — ils seront remplis dans stories 2.3 et 2.4

### Pièges à éviter

1. **Unicité du pseudo** : la colonne `username` dans `profiles` peut avoir une contrainte UNIQUE côté Supabase — l'erreur `db_error` retournée contiendra un message "duplicate key". Intercepter proprement et afficher un message lisible : `'Ce pseudo est déjà utilisé'`.
2. **Race condition** : si `user` devient `null` pendant l'affichage du profil (déconnexion externe), le `useEffect` doit rediriger — ne pas oublier `user` dans le dep array.
3. **`onBack` dans useEffect** : entourer `onBack` dans `useCallback` dans `App.tsx` ou l'exclure du dep array avec un commentaire ESLint si nécessaire pour éviter les boucles infinies.

### Project Structure Notes

Nouveaux fichiers :
```
src/
  components/
    profile/
      ProfilePage.tsx        ← composant écran principal
      tabs/
        GeneralTab.tsx       ← onglet Général
  services/
    profile.ts               ← updateUsername()
    errors.ts                ← AppError (si pas déjà créé)
```

Fichiers modifiés :
- `src/App.tsx` — import ProfilePage, remplacer placeholder

### References

- [Source: src/contexts/AuthContext.tsx] — refreshProfile(), user, profile
- [Source: src/App.tsx] — pattern AnimatePresence, AppScreen, setScreen
- [Source: _bmad-output/planning-artifacts/architecture.md#Ajout d'un nouvel écran]
- [Source: _bmad-output/planning-artifacts/architecture.md#Ajout d'un nouveau service]
- [Source: _bmad-output/planning-artifacts/architecture.md#Pattern loading state]
- [Source: _bmad-output/planning-artifacts/architecture.md#Toasts — Règle d'usage]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

_Aucun blocage rencontré._

### Completion Notes List

- `src/services/errors.ts` créé avec la classe `AppError` (code, message typé).
- `src/services/profile.ts` créé avec `updateUsername()` : validation locale (longueur 3-20, regex alphanumérique+_), interception des erreurs Supabase "duplicate key" pour un message lisible.
- `src/components/profile/ProfilePage.tsx` créé : layout plein-écran, header avec bouton Retour, barre 3 onglets, guard `useEffect` pour rediriger si `user === null`.
- `src/components/profile/tabs/GeneralTab.tsx` créé : affiche le pseudo actuel, formulaire avec gestion loading/error, bouton désactivé si inchangé ou en cours, appel à `refreshProfile()` + toast succès.
- `src/App.tsx` mis à jour : import `ProfilePage`, remplacement du placeholder, animation fade+slide-up cohérente.
- `npx tsc --noEmit` : exit 0, aucune erreur TypeScript.
- `npm run lint` sur les nouveaux fichiers : aucune erreur. Les 14 problèmes signalés sont pré-existants dans des fichiers non modifiés.

### File List

- `src/services/errors.ts` (nouveau)
- `src/services/profile.ts` (nouveau)
- `src/components/profile/ProfilePage.tsx` (nouveau)
- `src/components/profile/tabs/GeneralTab.tsx` (nouveau)
- `src/App.tsx` (modifié)

### Change Log

- 2026-04-11 : Story 2.2 implémentée — service `profile.ts`, classe `AppError`, composant `ProfilePage` (3 onglets), onglet Général avec formulaire de changement de pseudo, intégration dans `App.tsx`.
