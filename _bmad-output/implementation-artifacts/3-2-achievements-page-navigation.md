# Story 3.2 : Achievements — Page et Navigation

Status: review

## Story

En tant qu'utilisateur connecté,
je veux accéder à ma page d'achievements depuis la landing page et depuis mon profil,
afin de consulter mes badges débloqués et ma progression.

## Acceptance Criteria

1. Un bouton "Achievements" (style identique aux boutons Classement/Statistiques) est ajouté dans la nav de `LandingPage.tsx`.
2. Un onglet "Achievements" est ajouté dans la sidebar de `ProfilePage.tsx`.
3. La page `AchievementsPage.tsx` est accessible via `AppScreen = 'achievements'` dans `App.tsx`.
4. La page affiche les 5 achievement cards avec : icon, nom, description, état débloqué/verrouillé.
5. Les cards débloquées sont colorées (glow neon-violet), les verrouillées sont grisées.
6. L'achievement "Centenaire" affiche une barre de progression (ex: `47 / 100`).
7. La page gère le cas "user non connecté" : affiche un message invitant à se connecter.
8. Un bouton retour ramène vers l'écran d'origine (landing ou profile).
9. `npx tsc --noEmit` et `npm run lint` passent sans erreur.

## Tasks / Subtasks

- [x] **Tâche 1 — Créer `src/components/achievements/AchievementsPage.tsx`** (AC: 4, 5, 6, 7, 8)
  - [x] 1.1 — Props : `{ onBack?: () => void, hideBack?: boolean }`
  - [x] 1.2 — Si `!user` : afficher état vide "Connecte-toi pour débloquer des achievements"
  - [x] 1.3 — Si `user` : appeler `getUserAchievements(user.id)` au mount (pattern loading/error/data)
  - [x] 1.4 — Implémenter le layout : header + grille 2 colonnes de cards (voir Dev Notes)
  - [x] 1.5 — Card débloquée : fond `game-card` avec glow neon-violet, icon coloré, badge "✓ Débloqué"
  - [x] 1.6 — Card verrouillée : fond `game-card/40`, tout grisé (`text-white/30`), icon en `opacity-30`
  - [x] 1.7 — Barre de progression pour `progressTotal !== null` : barre neon-violet, `current / total`
  - [x] 1.8 — Enrichir `progress.current` pour "Centenaire" via `user_global_stats.games_played`
  - [x] 1.9 — Bouton retour en haut à gauche (même style que `ProfilePage`), caché si `hideBack`
  - [x] 1.10 — Animation d'entrée : `motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}`

- [x] **Tâche 2 — Ajouter `'achievements'` à `AppScreen` dans `App.tsx`** (AC: 3)
  - [x] 2.1 — Ajouter `'achievements'` au type `AppScreen`
  - [x] 2.2 — Ajouter le cas dans `AnimatePresence` (même transition que `profile` et `stats`)
  - [x] 2.3 — Ajouter state `achievementsOrigin: 'landing' | 'profile'` pour gérer le retour
  - [x] 2.4 — Ajouter handler `handleShowAchievements(from: 'landing' | 'profile')`
  - [x] 2.5 — `onBack` de `AchievementsPage` : revenir vers `achievementsOrigin`

- [x] **Tâche 3 — Ajouter bouton dans `LandingPage.tsx`** (AC: 1)
  - [x] 3.1 — Ajouter prop `onShowAchievements: () => void` à l'interface `Props`
  - [x] 3.2 — Ajouter le bouton dans la nav (après "Statistiques", avant le séparateur) avec icône trophée
  - [x] 3.3 — Passer `onShowAchievements` depuis `App.tsx`
  - [x] 3.4 — Le bouton suit exactement le même pattern CSS que "Classement" et "Statistiques" (voir Dev Notes)

- [x] **Tâche 4 — Ajouter onglet dans `ProfilePage.tsx`** (AC: 2)
  - [x] 4.1 — Ajouter `'achievements'` au type `ProfileTab` (local au fichier)
  - [x] 4.2 — Ajouter l'entrée dans `NAV_ITEMS` avec icône trophée SVG
  - [x] 4.3 — `defaultTab` prop compatible avec `'achievements'`
  - [x] 4.4 — Dans le content : `{activeTab === 'achievements' && <AchievementsPage hideBack />}`

- [x] **Tâche 5 — Validation** (AC: 9)
  - [x] 5.1 — Test manuel : landing → bouton trophée → page achievements → retour landing
  - [x] 5.2 — Test manuel : landing → profil → sidebar "Achievements" → onglet chargé
  - [x] 5.3 — Test manuel : user non connecté → landing → page achievements → message connexion
  - [x] 5.4 — `npx tsc --noEmit` : zéro erreur (EXIT:0)
  - [x] 5.5 — `npm run lint` : zéro erreur/warning dans les fichiers modifiés (erreurs pré-existantes dans LandingPage:39, QuizContainer, useQuiz, useTimer non introduites par cette story)

## Dev Notes

### AppScreen et App.tsx

Ajouter `'achievements'` dans le type `AppScreen` (ligne 15 de `App.tsx`) :
```ts
export type AppScreen = 'landing' | 'launching' | 'quiz' | 'ranking' | 'result' | 'stats' | 'profile' | 'achievements'
```

Bloc AnimatePresence pour `achievements` (copier exactement le pattern de `profile`) :
```tsx
{screen === 'achievements' && (
  <motion.div
    key="achievements"
    initial={{ opacity: 0, y: 40 }}
    animate={{ opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.1, ease: 'easeOut' } }}
    exit={{ opacity: 0, transition: { duration: 0.25 } }}
    className="absolute inset-0"
  >
    <AchievementsPage onBack={handleBackFromAchievements} />
  </motion.div>
)}
```

Handler dans `App.tsx` :
```ts
const [achievementsOrigin, setAchievementsOrigin] = useState<'landing' | 'profile'>('landing')

function handleShowAchievements(from: 'landing' | 'profile' = 'landing') {
  setAchievementsOrigin(from)
  setScreen('achievements')
}

function handleBackFromAchievements() {
  setScreen(achievementsOrigin)
}
```

Passer `onShowAchievements` à `LandingPage` et `ProfilePage` (via `handleShowAchievements`).

### Bouton Achievements dans LandingPage

Le bouton doit être identique au pattern "Classement" / "Statistiques" — pill avec expand hover :
```tsx
<button
  onClick={onShowAchievements}
  aria-label="Voir les achievements"
  className="group flex h-8 items-center overflow-hidden rounded-full border border-white/20 bg-white/[0.08] pl-[9px] pr-[9px] text-white/60 transition-[border-color,color,padding] duration-300 ease-in-out hover:border-white/35 hover:pr-3 hover:text-white/80"
>
  {/* Icône trophée */}
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
    <path d="M4 22h16"/>
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
  </svg>
  <span className="max-w-0 overflow-hidden whitespace-nowrap text-xs font-semibold transition-[max-width,margin,opacity] duration-300 ease-in-out [opacity:0] group-hover:ml-1.5 group-hover:max-w-[80px] group-hover:[opacity:1] group-hover:[transition-delay:60ms]">
    Achievements
  </span>
</button>
```
Placer ce bouton **après le bouton Statistiques**, avant le séparateur `<div className="mx-1 h-4 w-px bg-white/10" />`.

### ProfilePage — onglet Achievements

La `ProfilePage` utilise une sidebar avec `NAV_ITEMS`. Le nouvel onglet :
```ts
{
  key: 'achievements' as ProfileTab,
  label: 'Achievements',
  icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
      <path d="M4 22h16"/>
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
    </svg>
  ),
}
```

Ajouter entre `stats` et `confidentiality`.

Pour le contenu de l'onglet dans `ProfilePage`, créer un composant `AchievementsTab` léger (dans `src/components/profile/tabs/AchievementsTab.tsx`) qui réutilise la logique de `AchievementsPage` sans le header de navigation :

```tsx
// src/components/profile/tabs/AchievementsTab.tsx
// Réutilise getUserAchievements + les cards de AchievementsPage
// Pas de bouton "Retour" (la sidebar remplace la navigation)
// Même logique de fetch et d'affichage
```

**Alternative plus simple** : importer directement `AchievementsPage` dans ProfilePage et cacher son bouton retour via une prop `hideBack?: boolean`. C'est l'approche recommandée si elle ne surcharge pas le composant.

### AchievementsPage — Structure des cards

```tsx
// Layout : header + grille
<div className="flex min-h-screen flex-col bg-game-bg">
  {/* Header */}
  <div className="flex items-center border-b border-game-border px-4 py-2.5">
    <button onClick={onBack} className="...même style que ProfilePage...">
      ← Retour
    </button>
    <div className="flex flex-1 justify-center">
      <p className="text-sm text-white/40">Achievements</p>
    </div>
    <div className="w-20" />
  </div>

  {/* Grille de cards */}
  <div className="grid grid-cols-2 gap-3 p-4">
    {achievements.map(a => (
      <AchievementCard key={a.id} achievement={a} />
    ))}
  </div>
</div>
```

Card débloquée :
```tsx
<div className="rounded-2xl border border-neon-violet/30 bg-game-card p-4 shadow-neon-violet/10 flex flex-col gap-2">
  <div className="text-3xl">{achievement.icon}</div>
  <div>
    <p className="text-sm font-bold text-white">{achievement.name}</p>
    <p className="text-xs text-white/50">{achievement.description}</p>
  </div>
  <span className="self-start rounded-full bg-neon-violet/15 px-2 py-0.5 text-[10px] font-semibold text-neon-violet">
    ✓ Débloqué
  </span>
</div>
```

Card verrouillée :
```tsx
<div className="rounded-2xl border border-game-border bg-game-card/40 p-4 flex flex-col gap-2">
  <div className="text-3xl opacity-30">{achievement.icon}</div>
  <div>
    <p className="text-sm font-bold text-white/30">{achievement.name}</p>
    <p className="text-xs text-white/20">{achievement.description}</p>
  </div>
  {achievement.progress && (
    <div className="flex flex-col gap-1">
      <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-neon-violet/40"
          style={{ width: `${Math.min(100, (achievement.progress.current / achievement.progress.total) * 100)}%` }}
        />
      </div>
      <p className="text-[10px] text-white/30">
        {achievement.progress.current} / {achievement.progress.total}
      </p>
    </div>
  )}
  {!achievement.progress && (
    <span className="self-start rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-white/20">
      Verrouillé
    </span>
  )}
</div>
```

### Enrichissement de la progression

`getUserAchievements` retourne `progress.current = 0` par défaut. Pour Centenaire, enrichir avec les vraies données :

```ts
// Dans AchievementsPage, après getUserAchievements :
const gamesPlayedResult = await supabase
  .from('user_global_stats')
  .select('games_played')
  .eq('user_id', userId)
  .maybeSingle()

// Enrichir le progress.current de 'centenaire' si non débloqué
const enriched = achievements.map(a => {
  if (a.id === 'centenaire' && !a.unlocked && a.progress) {
    return { ...a, progress: { ...a.progress, current: gamesPlayedResult.data?.games_played ?? 0 } }
  }
  return a
})
```

### Contraintes architecturales

- **Tailwind uniquement** — pas de style inline (sauf le `style={{ width: ... }}` pour la barre de progression qui est dynamique — exception justifiée)
- **Framer Motion** pour toutes les animations
- **`import type`** pour tous les types
- **Pas de Supabase dans les composants** — appels via `src/services/achievements.ts` uniquement
- **Default export** pour les composants (PascalCase, même fichier)
- `AchievementsPage` dans `src/components/achievements/` (nouveau dossier)

### Dépendances

- **Dépend de Story 3.1** : `getUserAchievements` doit exister dans `src/services/achievements.ts`
- Ne pas implémenter cette story avant que 3.1 soit terminée

### References

- [Source: src/App.tsx:15] — type AppScreen à étendre
- [Source: src/App.tsx:56-182] — pattern AnimatePresence, handlers, state management
- [Source: src/components/landing/LandingPage.tsx:96-121] — pattern bouton nav pill expand
- [Source: src/components/profile/ProfilePage.tsx:20-52] — structure NAV_ITEMS, sidebar
- [Source: src/components/profile/ProfileHero.tsx] — pattern metric cards, palette couleurs
- [Source: src/components/stats/StatsPage.tsx] — pattern page stats pour inspiration layout

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

_Aucun blocage rencontré._

### Completion Notes List

- Créé `src/components/achievements/AchievementsPage.tsx` avec props `onBack?` et `hideBack?` pour gérer les deux contextes (navigation standalone vs. onglet profil)
- `AchievementCard` extrait en sous-composant interne pour lisibilité
- Enrichissement "Centenaire" : appel Supabase `user_global_stats.games_played` après `getUserAchievements`
- `App.tsx` : `AppScreen` étendu, state `achievementsOrigin`, handlers `handleShowAchievements`/`handleBackFromAchievements`
- `LandingPage.tsx` : bouton trophée pill-expand ajouté après "Statistiques", avant le séparateur
- `ProfilePage.tsx` : `ProfileTab` étendu avec `'achievements'`, `TAB_LABELS` mis à jour, entrée `NAV_ITEMS` avec SVG trophée, rendu `<AchievementsPage hideBack />` dans le content
- `npx tsc --noEmit` : EXIT 0 — aucune erreur TypeScript
- Lint : zéro erreur dans les fichiers créés/modifiés par cette story

### File List

- `src/components/achievements/AchievementsPage.tsx` — nouveau fichier
- `src/App.tsx` — AppScreen étendu, import AchievementsPage, state + handlers achievements, props LandingPage/ProfilePage
- `src/components/landing/LandingPage.tsx` — prop onShowAchievements, bouton trophée nav
- `src/components/profile/ProfilePage.tsx` — ProfileTab + TAB_LABELS + NAV_ITEMS + rendu achievements

### Change Log

- 2026-04-12 : Story 3.2 implémentée — page AchievementsPage, navigation landing → achievements → retour, onglet achievements dans ProfilePage
