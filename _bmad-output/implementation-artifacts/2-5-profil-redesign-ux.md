# Story 2.5 : ProfilePage — Redesign UX (hero, pill tabs, inline-edit)

Status: review

## Story

En tant qu'utilisateur connecté,
je veux que ma page profil reflète l'univers visuel gaming de l'app (néon, glow, cartes sombres),
afin d'avoir une expérience cohérente avec le reste de Pulse Quizz.

## Acceptance Criteria

1. La page profil affiche un hero header avec : bandeau de couverture néon, avatar circulaire avec initiale du pseudo, pseudo + email, et les 3 métriques (parties, bonnes rép., classement).
2. Les 3 métriques du hero sont chargées depuis Supabase (même logique que l'ancien `StatsOverview`).
3. La tab bar est redesignée en style pill (container arrondi, onglet actif surligné néon-violet).
4. L'onglet Général n'affiche plus de formulaire par défaut — il montre le pseudo en mode lecture, avec un bouton "Changer le pseudo" qui révèle le formulaire en inline-edit animé.
5. Le bouton "Modifier" dans le hero déclenche directement le mode édition de l'onglet Général.
6. Après sauvegarde réussie du pseudo, le formulaire se referme et repasse en mode lecture.
7. L'onglet Confidentialité conserve sa logique actuelle, avec ses deux sections wrappées dans des cards visuellement distinctes.
8. `StatsOverview.tsx` est supprimé — sa logique est absorbée dans `ProfileHero.tsx`.
9. L'interface externe de `ProfilePage` reste inchangée : `{ onBack: () => void; defaultTab?: ProfileTab }`.
10. L'onglet Statistiques (`StatsTab`) n'est pas modifié.
11. `npx tsc --noEmit`, `npm run lint` passent sans nouvelle erreur.

## Tasks / Subtasks

- [x] **Tâche 1 — Créer `ProfileHero.tsx`** (AC: 1, 2, 8)
  - [x] 1.1 — Créer `src/components/profile/ProfileHero.tsx` (default export)
  - [x] 1.2 — Props : `{ onEditUsername: () => void }`
  - [x] 1.3 — Absorber la logique de fetch de `StatsOverview` : `Promise.all([fetchAllStats(user.id), getUserRank(user.id, 'fr')])`, mêmes états `result`, `loading`, `error`
  - [x] 1.4 — Implémenter le cover banner (voir Dev Notes)
  - [x] 1.5 — Implémenter l'avatar circulaire avec initiale (première lettre de `profile?.username`, fallback `?`)
  - [x] 1.6 — Afficher pseudo + email + bouton "Modifier" (icône crayon, appelle `onEditUsername`)
  - [x] 1.7 — Implémenter les 3 metric cards en grille 3 colonnes (pattern `StatTile` de StatsPage)
  - [x] 1.8 — Animer le hero avec `motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}`

- [x] **Tâche 2 — Mettre à jour `ProfilePage.tsx`** (AC: 3, 4, 5, 9)
  - [x] 2.1 — Importer `ProfileHero` et l'insérer entre le header minimal et la tab bar
  - [x] 2.2 — Ajouter state interne `editMode: boolean` (défaut `false`)
  - [x] 2.3 — Passer `onEditUsername={() => { setActiveTab('general'); setEditMode(true) }}` à `ProfileHero`
  - [x] 2.4 — Passer `editMode` et `onEditDone={() => setEditMode(false)}` à `GeneralTab`
  - [x] 2.5 — Redesigner la tab bar en pill style (voir Dev Notes)
  - [x] 2.6 — Quand `setActiveTab` est appelé avec une valeur ≠ `'general'`, réinitialiser `editMode` à `false`

- [x] **Tâche 3 — Mettre à jour `GeneralTab.tsx`** (AC: 4, 6, 8)
  - [x] 3.1 — Ajouter props `editMode: boolean` et `onEditDone: () => void`
  - [x] 3.2 — Mode lecture (défaut) : afficher le pseudo actuel en `text-2xl font-black text-white`, sous-texte en `text-white/30`
  - [x] 3.3 — Bouton "Changer le pseudo" en mode lecture → passe en mode édition (si `editMode` est contrôlé par le parent, ce bouton appelle `onEditUsername` via un callback ou un setter local — voir Dev Notes)
  - [x] 3.4 — Mode édition : formulaire animé avec `motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}`
  - [x] 3.5 — Après `toast.success`, appeler `onEditDone()` pour repasser en mode lecture
  - [x] 3.6 — Supprimer `<StatsOverview />` et son import

- [x] **Tâche 4 — Mettre à jour `ConfidentialityTab.tsx`** (AC: 7)
  - [x] 4.1 — Wrapper la section "Changer le mot de passe" dans un container card : `rounded-2xl border border-game-border bg-game-card/40 p-5`
  - [x] 4.2 — Wrapper la section "Zone de danger" dans un container card : `rounded-2xl border border-game-danger/20 bg-game-danger/5 p-5`
  - [x] 4.3 — Aucun changement de logique

- [x] **Tâche 5 — Supprimer `StatsOverview.tsx`** (AC: 8)
  - [x] 5.1 — Supprimer `src/components/profile/StatsOverview.tsx`
  - [x] 5.2 — S'assurer qu'aucun autre fichier ne l'importe (vérifier avec grep)

- [x] **Tâche 6 — Validation** (AC: 11)
  - [x] 6.1 — Test manuel : navigation landing → profil, hero visible avec métriques chargées
  - [x] 6.2 — Test manuel : bouton "Modifier" dans le hero → onglet Général en mode édition → save → retour mode lecture
  - [x] 6.3 — Test manuel : onglet Confidentialité — cards visuelles OK, logique password + suppression inchangée
  - [x] 6.4 — `npx tsc --noEmit` : zéro erreur
  - [x] 6.5 — `npm run lint` : zéro nouveau warning

## Dev Notes

### Contraintes absolues

- **Tailwind uniquement** — pas de style inline
- **Palette** : `game-bg` (#0A0A0F), `game-card` (#13131F), `game-border` (#1E1E2E), `neon-violet` (#8B5CF6), `neon-blue` (#3B82F6)
- **Animations** : Framer Motion uniquement
- **Logique métier inchangée** : `updateUsername`, `fetchAllStats`, `getUserRank`, `updatePassword`, `deleteAccount` — ne rien modifier dans les services
- **`StatsTab`** : zéro modification

---

### Structure cible des fichiers

```
src/components/profile/
  ProfilePage.tsx           ← modifié (hero + pill tabs + editMode state)
  ProfileHero.tsx           ← nouveau
  StatsOverview.tsx         ← SUPPRIMÉ
  tabs/
    GeneralTab.tsx          ← modifié (editMode props, inline-edit, sans StatsOverview)
    StatsTab.tsx            ← inchangé
    ConfidentialityTab.tsx  ← modifié (cards visuelles seulement)
```

---

### ProfileHero — implémentation

```tsx
// src/components/profile/ProfileHero.tsx
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../../hooks/useAuth'
import { fetchAllStats } from '../../services/cloudStats'
import type { CloudGlobalStatRow } from '../../services/cloudStats'
import { getUserRank } from '../../services/leaderboard'
import { AppError } from '../../services/errors'

interface Props {
  onEditUsername: () => void
}

interface HeroStats {
  global: CloudGlobalStatRow | null
  rank: number | null
}

export default function ProfileHero({ onEditUsername }: Props) {
  const { user, profile } = useAuth()
  const [result, setResult] = useState<HeroStats | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loading = user !== null && result === null && error === null
  const initial = (profile?.username?.[0] ?? '?').toUpperCase()

  useEffect(() => {
    if (!user) return
    Promise.all([
      fetchAllStats(user.id),
      getUserRank(user.id, 'fr'),
    ])
      .then(([{ global: g }, rank]) => setResult({ global: g, rank }))
      .catch(err => setError(err instanceof AppError ? err.message : 'Erreur'))
  }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {/* Cover banner */}
      <div className="relative h-28 overflow-hidden bg-gradient-to-br from-neon-violet/20 via-neon-blue/10 to-game-bg">
        <div className="pointer-events-none absolute -left-8 -top-8 h-48 w-48 rounded-full bg-neon-violet/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-8 -right-8 h-48 w-48 rounded-full bg-neon-blue/15 blur-3xl" />
      </div>

      {/* Identité */}
      <div className="-mt-8 px-5 pb-2">
        <div className="flex items-end justify-between">
          {/* Avatar */}
          <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-neon-violet bg-game-card text-2xl font-black text-neon-violet shadow-neon-violet">
            {initial}
          </div>
          {/* Bouton Modifier */}
          <button
            onClick={onEditUsername}
            className="mb-1 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white/50 transition-colors hover:bg-white/5 hover:text-white"
          >
            {/* Icône crayon */}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Modifier
          </button>
        </div>

        <div className="mt-2">
          <p className="text-lg font-bold text-white">@{profile?.username ?? '—'}</p>
          <p className="text-xs text-white/40">{user?.email}</p>
        </div>
      </div>

      {/* Métriques */}
      <div className="grid grid-cols-3 gap-2 px-5 pb-5 pt-3">
        {loading ? (
          <>
            {[0, 1, 2].map(i => (
              <div key={i} className="h-14 animate-pulse rounded-xl border border-white/[0.06] bg-white/[0.02]" />
            ))}
          </>
        ) : (
          <>
            <div className="flex flex-col items-center gap-1 rounded-xl border border-white/[0.08] bg-white/[0.03] py-3">
              <span className="text-lg font-black tabular-nums text-white">
                {result?.global?.games_played ?? 0}
              </span>
              <span className="text-center text-[10px] font-semibold uppercase tracking-wider text-white/30">
                Parties
              </span>
            </div>

            <div className="flex flex-col items-center gap-1 rounded-xl border border-white/[0.08] bg-white/[0.03] py-3">
              <span className="text-lg font-black tabular-nums text-neon-violet">
                {result?.global?.total_correct ?? 0}
              </span>
              <span className="text-center text-[10px] font-semibold uppercase tracking-wider text-white/30">
                Bonnes rép.
              </span>
            </div>

            {result?.rank !== null && result?.rank !== undefined ? (
              <div className="flex flex-col items-center gap-1 rounded-xl border border-orange-500/25 bg-orange-500/10 py-3">
                <span className="text-lg font-black tabular-nums text-orange-400">
                  #{result.rank}
                </span>
                <span className="text-center text-[10px] font-semibold uppercase tracking-wider text-orange-400/50">
                  Rang
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-1 rounded-xl border border-white/[0.06] bg-white/[0.02] py-3">
                <span className="text-base text-white/20">🏆</span>
                <span className="text-center text-[10px] font-semibold uppercase tracking-wider text-white/20">
                  Non classé
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  )
}
```

---

### ProfilePage — pill tabs + editMode

```tsx
// Remplacer le header + tab bar dans ProfilePage.tsx

import ProfileHero from './ProfileHero'
// ... imports existants

export default function ProfilePage({ onBack, defaultTab = 'general' }: Props) {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<ProfileTab>(defaultTab)
  const [editMode, setEditMode] = useState(false)

  const handleBack = useCallback(() => onBack(), [onBack])

  useEffect(() => {
    if (!user) handleBack()
  }, [user, handleBack])

  if (!user) return null

  function handleTabChange(tab: ProfileTab) {
    setActiveTab(tab)
    if (tab !== 'general') setEditMode(false)
  }

  function handleEditUsername() {
    setActiveTab('general')
    setEditMode(true)
  }

  return (
    <div className="flex min-h-screen flex-col bg-game-bg">
      {/* Header minimal */}
      <div className="flex items-center border-b border-game-border px-4 py-2.5">
        <button
          onClick={handleBack}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-white/60 transition-colors hover:bg-white/5 hover:text-white"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Retour
        </button>
      </div>

      {/* Hero */}
      <ProfileHero onEditUsername={handleEditUsername} />

      {/* Pill tab bar */}
      <div className="mx-4 mb-4 flex rounded-2xl border border-game-border bg-game-card/60 p-1">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => handleTabChange(tab.key)}
            className={[
              'flex-1 rounded-xl py-2 text-xs font-semibold transition-all',
              activeTab === tab.key
                ? 'bg-neon-violet/15 text-neon-violet shadow-[0_0_12px_rgba(139,92,246,0.2)]'
                : 'text-white/40 hover:text-white/70',
            ].join(' ')}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1">
        {activeTab === 'general' && (
          <GeneralTab editMode={editMode} onEditDone={() => setEditMode(false)} />
        )}
        {activeTab === 'stats' && (
          <StatsTab onBack={() => handleTabChange('general')} />
        )}
        {activeTab === 'confidentiality' && (
          <ConfidentialityTab onBack={onBack} />
        )}
      </div>
    </div>
  )
}
```

---

### GeneralTab — inline-edit

```tsx
// src/components/profile/tabs/GeneralTab.tsx
// Supprimer import StatsOverview
// Ajouter props

interface Props {
  editMode: boolean
  onEditDone: () => void
}

export default function GeneralTab({ editMode, onEditDone }: Props) {
  const { user, profile, refreshProfile } = useAuth()
  const toast = useToast()
  const [username, setUsername] = useState(profile?.username ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Sync champ si profile change (ex: après refreshProfile)
  useEffect(() => {
    setUsername(profile?.username ?? '')
  }, [profile?.username])

  const isUnchanged = username === profile?.username
  const isDisabled = isUnchanged || loading

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    setError(null)
    setLoading(true)
    try {
      await updateUsername(user.id, username)
      await refreshProfile()
      toast.success('Pseudo mis à jour')
      onEditDone()
    } catch (err) {
      setError(err instanceof AppError ? err.message : 'Erreur inattendue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-md px-4 py-6">

      {/* Mode lecture */}
      {!editMode && (
        <div className="flex flex-col items-center gap-1 py-4 text-center">
          <p className="text-2xl font-black text-white">@{profile?.username ?? '—'}</p>
          <p className="text-xs text-white/30">3-20 caractères, lettres, chiffres ou _</p>
        </div>
      )}

      {/* Mode édition (inline-animated) */}
      <AnimatePresence>
        {editMode && (
          <motion.div
            key="edit-form"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-2">
              <div>
                <label htmlFor="username" className="mb-1.5 block text-sm font-medium text-white/70">
                  Nouveau pseudo
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  maxLength={20}
                  className="w-full rounded-xl border border-game-border bg-game-card px-4 py-2.5 text-white placeholder-white/30 outline-none focus:border-neon-violet focus:ring-1 focus:ring-neon-violet"
                  placeholder="3–20 caractères, lettres, chiffres ou _"
                  autoComplete="off"
                  // eslint-disable-next-line jsx-a11y/no-autofocus
                  autoFocus
                />
                {error && (
                  <p className="mt-1.5 text-xs text-game-danger">{error}</p>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onEditDone}
                  disabled={loading}
                  className="flex-1 rounded-xl border border-game-border px-4 py-2.5 text-sm text-white/60 transition-colors hover:bg-white/5 disabled:opacity-40"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isDisabled}
                  className="flex-1 rounded-xl bg-neon-violet px-6 py-2.5 text-sm font-semibold text-white shadow-neon-violet transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {loading ? 'Enregistrement…' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
```

**Note** : `import { AnimatePresence } from 'framer-motion'` à ajouter dans `GeneralTab.tsx`.

---

### ConfidentialityTab — cards visuelles

Wrapper section mot de passe :
```tsx
<section className="rounded-2xl border border-game-border bg-game-card/40 p-5">
  <h2 className="mb-4 text-base font-semibold text-white">Changer le mot de passe</h2>
  {/* ... formulaire inchangé */}
</section>
```

Wrapper zone de danger :
```tsx
<section className="rounded-2xl border border-game-danger/20 bg-game-danger/5 p-5">
  <h2 className="mb-1 text-base font-semibold text-game-danger">Zone de danger</h2>
  {/* ... contenu inchangé */}
</section>
```

Supprimer le `<div className="border-t border-game-border" />` séparateur entre les deux sections — remplacé par le gap naturel du container `space-y-8`.

---

### Supprimer StatsOverview.tsx

```bash
# Vérifier que personne ne l'importe encore
grep -r "StatsOverview" src/
# Si seul GeneralTab l'importait → supprimer le fichier
```

---

### Pièges à éviter

1. **`editMode` reset** : quand l'utilisateur change d'onglet, `editMode` doit repasser à `false`. Géré dans `handleTabChange` de `ProfilePage`.
2. **Sync du champ** : après `refreshProfile()`, `profile?.username` change. Ajouter un `useEffect` dans `GeneralTab` qui re-sync le state `username` sur `profile?.username`.
3. **`user?.id` dans le dep array de `useEffect`** : utiliser `user?.id` (pas `user`) pour éviter les re-fetch inutiles si l'objet user est recréé — même pattern que l'ancien `StatsOverview`.
4. **Import `AnimatePresence`** dans `GeneralTab` : ne pas oublier.
5. **Header sans titre** : le titre "Mon Profil" disparaît du header — c'est intentionnel, le hero joue ce rôle. Ne pas le rajouter.

### References

- [Source: src/components/stats/StatsPage.tsx] — pattern `StatTile`, `fadeUp`, palette Tailwind
- [Source: src/components/landing/LandingPage.tsx] — background blobs pattern
- [Source: src/components/profile/StatsOverview.tsx] — logique fetch à migrer dans ProfileHero
- [Source: src/components/profile/ProfilePage.tsx] — structure actuelle à modifier
- [Source: src/components/profile/tabs/GeneralTab.tsx] — logique formulaire à conserver
- [Source: src/components/profile/tabs/ConfidentialityTab.tsx] — logique inchangée
- [Source: tailwind.config.js] — palette complète

## Dev Agent Record

### Implementation Plan

Implémentation linéaire des 6 tâches dans l'ordre défini par la story. Aucune dépendance externe nouvelle — toutes les APIs existantes (`fetchAllStats`, `getUserRank`, `updateUsername`, etc.) ont été réutilisées sans modification.

### File List

- `src/components/profile/ProfileHero.tsx` — **créé** (hero avec cover banner, avatar, métriques)
- `src/components/profile/ProfilePage.tsx` — **modifié** (hero intégré, pill tabs, state `editMode`)
- `src/components/profile/tabs/GeneralTab.tsx` — **modifié** (props `editMode`/`onEditDone`, inline-edit animé, suppression `StatsOverview`)
- `src/components/profile/tabs/ConfidentialityTab.tsx` — **modifié** (cards visuelles sur les deux sections)
- `src/components/profile/StatsOverview.tsx` — **supprimé**

### Completion Notes

- `ProfileHero` absorbe entièrement la logique de `StatsOverview` (même pattern `Promise.all` + dépendance `user?.id`)
- `editMode` géré dans `ProfilePage` : activé par le bouton "Modifier" du hero ou le bouton "Changer le pseudo" (via `handleEditUsername`), réinitialisé lors d'un changement d'onglet
- `GeneralTab` : mode lecture par défaut (pseudo + sous-texte), mode édition révélé avec `AnimatePresence` + `motion.div`. Appel `onEditDone()` après `toast.success` pour fermer le formulaire
- `ConfidentialityTab` : logique entièrement inchangée, seul l'habillage visuel (cards) a été ajouté ; le séparateur `<div className="border-t…" />` supprimé au profit du `space-y-8` naturel
- `tsc --noEmit` : 0 erreur ; `eslint src/components/profile/` : 0 erreur, 0 warning

### Change Log

- 2026-04-11 : Implémentation story 2.5 — ProfileHero créé, ProfilePage redesigné (pill tabs + editMode), GeneralTab inline-edit, ConfidentialityTab cards visuelles, StatsOverview supprimé
