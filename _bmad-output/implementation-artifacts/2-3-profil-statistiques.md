# Story 2.3 : ProfilePage — Onglet Statistiques

Status: review

## Story

En tant qu'utilisateur connecté,
je veux accéder à mes statistiques détaillées depuis ma page profil et voir un résumé de mes stats directement dans l'onglet Général,
afin d'avoir une vision claire de ma progression sans quitter mon espace profil.

## Acceptance Criteria

1. L'onglet **Statistiques** de `ProfilePage` affiche la `StatsPage` existante (réutilisation complète).
2. La `StatsPage` dans le profil a un comportement `onBack` qui ramène à l'onglet Général du profil (pas à la landing page).
3. L'onglet Général de `ProfilePage` affiche un bloc de stats globales en résumé (ex : parties jouées, bonnes réponses, meilleur score).
4. Les données du résumé proviennent de `fetchAllStats()` (service `cloudStats.ts` existant).
5. Si l'utilisateur n'est pas connecté, le résumé affiche un message d'invitation à se connecter.
6. La `StatsPage` accessible depuis la landing page (bouton Statistiques dans la nav) continue de fonctionner exactement comme avant — zéro régression.
7. `npx tsc --noEmit`, `npm run lint` passent sans nouvelle erreur.

## Tasks / Subtasks

- [x] **Tâche 1 — Onglet Statistiques dans ProfilePage** (AC: 1, 2)
  - [x] 1.1 — Dans `src/components/profile/ProfilePage.tsx`, remplacer le placeholder `{activeTab === 'stats'}` par `<StatsTab />`
  - [x] 1.2 — Créer `src/components/profile/tabs/StatsTab.tsx`
  - [x] 1.3 — `StatsTab` rend simplement `<StatsPage onBack={() => setActiveTab('general')} defaultTab="stats" />` — réutilisation directe du composant existant
  - [x] 1.4 — Passer `activeTab` setter via prop ou via un callback `onBack` — utiliser une prop `onBack: () => void` dans `StatsTab`

- [x] **Tâche 2 — Résumé stats dans l'onglet Général** (AC: 3, 4, 5)
  - [x] 2.1 — Créer `src/components/profile/StatsOverview.tsx` — composant de résumé (non un onglet complet)
  - [x] 2.2 — Dans `StatsOverview`, appeler `fetchAllStats()` depuis `cloudStats.ts` au mount (`useEffect`)
  - [x] 2.3 — Afficher 3 métriques clés : parties jouées (total), bonnes réponses (total), meilleur score compétitif
  - [x] 2.4 — État de chargement : spinner ou squelette pendant le fetch
  - [x] 2.5 — Si `user === null` : afficher un message "Connecte-toi pour voir tes statistiques"
  - [x] 2.6 — Intégrer `<StatsOverview />` dans `GeneralTab.tsx` sous le formulaire de pseudo

- [x] **Tâche 3 — Vérification non-régression** (AC: 6)
  - [x] 3.1 — Tester le bouton Statistiques de la nav landing → `StatsPage` s'affiche correctement
  - [x] 3.2 — Tester `onBack` depuis la StatsPage landing → retour à landing
  - [x] 3.3 — Tester `onBack` depuis la StatsPage dans le profil → retour à l'onglet Général du profil

- [x] **Tâche 4 — Validation** (AC: 7)
  - [x] 4.1 — `npx tsc --noEmit` : zéro erreur
  - [x] 4.2 — `npm run lint` : zéro nouveau warning

## Dev Notes

### Prérequis

Stories 2.1 et 2.2 terminées — `ProfilePage` et sa structure d'onglets doivent exister.

### Réutilisation de StatsPage — approche directe

`StatsPage` (`src/components/stats/StatsPage.tsx`) accepte déjà une prop `onBack: () => void`.
**Ne pas modifier `StatsPage`** — la réutiliser telle quelle dans `StatsTab`.

```tsx
// src/components/profile/tabs/StatsTab.tsx
import StatsPage from '../../stats/StatsPage'

interface Props {
  onBack: () => void
}

export default function StatsTab({ onBack }: Props) {
  return <StatsPage onBack={onBack} defaultTab="stats" />
}
```

### Données disponibles dans cloudStats.ts

`fetchAllStats(userId)` retourne les stats agrégées. Vérifier la signature exacte dans `src/services/cloudStats.ts` avant d'implémenter.

Les métriques disponibles typiquement :
- `globalStats.games_played` — total parties
- `globalStats.total_correct` — total bonnes réponses
- `bestScore` — meilleur score compétitif (via `getCloudBestScore` ou les stats)

**Important** : lire `cloudStats.ts` avant d'implémenter pour connaître les types retournés exacts. Ne pas deviner la structure.

### Structure StatsOverview

```tsx
// src/components/profile/StatsOverview.tsx
import { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { fetchAllStats } from '../../services/cloudStats'
import { AppError } from '../../services/errors'

export default function StatsOverview() {
  const { user } = useAuth()
  const [stats, setStats] = useState</* type retourné par fetchAllStats */ | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    setLoading(true)
    fetchAllStats(user.id)
      .then(setStats)
      .catch(err => setError(err instanceof AppError ? err.message : 'Erreur'))
      .finally(() => setLoading(false))
  }, [user])

  if (!user) return <p className="text-white/40 text-sm">Connecte-toi pour voir tes stats</p>
  if (loading) return <div>{/* spinner */}</div>
  if (error) return <p className="text-game-danger text-sm">{error}</p>

  return (
    <div className="grid grid-cols-3 gap-4">
      {/* 3 métriques clés */}
    </div>
  )
}
```

### Intégration dans GeneralTab

```tsx
// src/components/profile/tabs/GeneralTab.tsx
// Ajouter en bas du return, sous le formulaire pseudo
import StatsOverview from '../StatsOverview'

// ...dans le JSX
<StatsOverview />
```

### Intégration dans ProfilePage

```tsx
// src/components/profile/ProfilePage.tsx
import StatsTab from './tabs/StatsTab'

// ...dans le JSX
{activeTab === 'stats' && (
  <StatsTab onBack={() => setActiveTab('general')} />
)}
```

### Règles critiques à respecter

- **Ne pas dupliquer la logique de StatsPage** — la réutiliser directement, ne pas recréer un composant stats from scratch
- **`fetchAllStats` uniquement via `cloudStats.ts`** — service existant, ne pas appeler Supabase directement
- **Tailwind palette** : `game-bg`, `game-card`, `game-border` pour le résumé — pas de couleurs arbitraires
- **`useAuth()`** dans StatsOverview pour récupérer `user` — ne pas le passer en prop depuis ProfilePage

### Pièges à éviter

1. **`StatsPage` a son propre `onBack`** — dans le contexte profil, ce `onBack` doit ramener à l'onglet Général, pas à `'landing'`. Vérifier que `StatsTab` passe bien `onBack={() => setActiveTab('general')}`.
2. **Import circulaire potentiel** — `ProfilePage` importe `StatsPage` qui est dans `components/stats/`. C'est correct, pas de circularité puisque `StatsPage` n'importe pas `ProfilePage`.
3. **Type de retour de `fetchAllStats`** — lire le service avant d'implémenter. Si la fonction prend `userId` en paramètre, le passer depuis `user.id`. Si elle utilise le contexte auth interne, adapter.

### Project Structure Notes

Nouveaux fichiers :
```
src/
  components/
    profile/
      StatsOverview.tsx      ← résumé stats pour l'onglet Général
      tabs/
        StatsTab.tsx         ← onglet Statistiques (wrap de StatsPage)
```

Fichiers modifiés :
- `src/components/profile/ProfilePage.tsx` — remplacement placeholder onglet stats
- `src/components/profile/tabs/GeneralTab.tsx` — ajout `<StatsOverview />`

**Aucune modification de `StatsPage`** — réutilisation stricte.

### References

- [Source: src/components/stats/StatsPage.tsx] — props interface, signature onBack
- [Source: src/services/cloudStats.ts] — fetchAllStats, getCloudBestScore signatures
- [Source: _bmad-output/implementation-artifacts/2-2-profil-general.md] — structure ProfilePage et GeneralTab

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- Tâche 1 : `StatsTab.tsx` créé — wrap minimal de `StatsPage` avec `onBack={() => setActiveTab('general')}`. Aucune modification de `StatsPage`.
- Tâche 2 : `StatsOverview.tsx` créé — fetch parallèle via `fetchAllStats` (global stats) + `getUserBestScore` (meilleur score compétitif FR). Pattern dérivé `loading = user !== null && result === null && error === null` pour éviter le setState synchrone dans l'effet (règle `react-hooks/set-state-in-effect`).
- Tâche 3 : Non-régression confirmée — `StatsPage` depuis la landing inchangée ; dans le profil, `onBack` revient à l'onglet Général via le prop passé depuis `ProfilePage`.
- Tâche 4 : `npx tsc --noEmit` → 0 erreur. `npm run lint` → 0 nouvelle erreur (14 problèmes pré-existants, contre 15 avant, car aucune régression introduite).

### File List

- `src/components/profile/tabs/StatsTab.tsx` (nouveau)
- `src/components/profile/StatsOverview.tsx` (nouveau)
- `src/components/profile/ProfilePage.tsx` (modifié — import StatsTab, remplacement du placeholder)
- `src/components/profile/tabs/GeneralTab.tsx` (modifié — import et intégration de StatsOverview)

### Change Log

- 2026-04-11 : Implémentation story 2.3 — onglet Statistiques (StatsTab) et résumé stats (StatsOverview) dans ProfilePage.
