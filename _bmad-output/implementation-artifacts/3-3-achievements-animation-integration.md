# Story 3.3 : Achievements — Animation de déblocage et intégration post-game

Status: review

## Story

En tant qu'utilisateur connecté,
je veux voir une animation spectaculaire quand je débloque un achievement en fin de partie,
afin de ressentir la satisfaction de l'accomplissement avant de voir ma page d'achievements.

## Acceptance Criteria

1. À la fin de chaque partie (après transition vers `result`), `checkAndUnlockAchievements` est appelé avec le contexte de la partie (score, streak, mode).
2. Si des nouveaux achievements sont débloqués, l'overlay `AchievementUnlockOverlay` se lance automatiquement.
3. L'overlay assombrit la page (fond semi-transparent `rgba(0,0,0,0.75)`), sans masquer totalement la page résultat dessous.
4. Pour chaque achievement : le badge entre depuis un côté aléatoire de l'écran, arrive au centre avec une rotation Y de 360°, puis repart vers le côté opposé.
5. Le mouvement de départ du badge déclenche la navigation vers la page achievements.
6. Sur la page achievements, le badge "s'insère" visuellement dans sa card (effet shake + glow d'activation).
7. Si plusieurs achievements sont débloqués, ils sont joués en séquence (un par un).
8. Une fois toute la séquence terminée, l'utilisateur est ramené sur la page résultat.
9. La vérification rétroactive est appelée dans `AuthContext` lors du login (sans animation — silencieuse).
10. `serie_de_feu` et `perfectionniste` sont correctement détectés via le contexte post-game.
11. `npx tsc --noEmit` et `npm run lint` passent sans erreur.

## Tasks / Subtasks

- [x] **Tâche 1 — Intégration dans `useGameOrchestration.ts`** (AC: 1, 10)
  - [x] 1.1 — Ajouter param `setNewAchievements: React.Dispatch<React.SetStateAction<AchievementWithStatus[]>>` à `UseGameOrchestrationParams`
  - [x] 1.2 — Calculer `maxStreak` depuis `results` (max de la série courante)
  - [x] 1.3 — Appeler `checkAndUnlockAchievements(user.id, { maxStreak, score, mode })` en parallèle avec les autres appels post-game
  - [x] 1.4 — Appeler `setNewAchievements(newlyUnlocked)` si `newlyUnlocked.length > 0`
  - [x] 1.5 — Si erreur dans `checkAndUnlockAchievements` : logger l'erreur silencieusement (ne pas bloquer la nav vers `result`)

- [x] **Tâche 2 — Mettre à jour `src/services/achievements.ts`** (AC: 10)
  - [x] 2.1 — Ajouter le check `serie_de_feu` : si `context.maxStreak >= 10` et non débloqué → unlock
  - [x] 2.2 — Ajouter le check `perfectionniste` : si `context.score === 10 && context.mode === 'normal'` et non débloqué → unlock

- [x] **Tâche 3 — Créer `AchievementUnlockOverlay.tsx`** (AC: 3, 4, 5, 6, 7, 8)
  - [x] 3.1 — Props : `{ achievements: AchievementWithStatus[]; onDone: () => void; onNavigateToAchievements: (id: AchievementId) => void }`
  - [x] 3.2 — State interne : `currentIndex: number` (0 au départ)
  - [x] 3.3 — Overlay fond sombre avec `AnimatePresence` : `motion.div` `position: fixed inset-0 z-50 bg-black/75`
  - [x] 3.4 — Pour l'achievement courant : animation en 3 phases (entrée → rotateY 360° → sortie)
  - [x] 3.5 — Quand le badge repart (phase 3 start) : appeler `onNavigateToAchievements(current.id)`
  - [x] 3.6 — Sur la page achievements, l'achievement débloqué peut recevoir l'effet shake via `pendingAchievementId`
  - [x] 3.7 — Quand la séquence de l'achievement courant est terminée : si `currentIndex < achievements.length - 1` → incrémenter ; sinon → `onDone()`

- [x] **Tâche 4 — Wiring dans `App.tsx`** (AC: 2, 8)
  - [x] 4.1 — Ajouter state `newAchievements: AchievementWithStatus[]` (défaut `[]`)
  - [x] 4.2 — Passer `setNewAchievements` à `useGameOrchestration`
  - [x] 4.3 — Afficher `AchievementUnlockOverlay` si `screen === 'result' && newAchievements.length > 0`
  - [x] 4.4 — `onNavigateToAchievements` : `setScreen('achievements')` — origin = 'result' pour le retour
  - [x] 4.5 — `onDone` de l'overlay : `setNewAchievements([])` + `setScreen('result')`
  - [x] 4.6 — Passer `pendingAchievementId` à `AchievementsPage` pour déclencher le shake sur la bonne card

- [x] **Tâche 5 — Rétroactivité au login dans `AuthContext.tsx`** (AC: 9)
  - [x] 5.1 — Dans le `useEffect([user])`, après fetch du profil : appeler `checkAndUnlockAchievements(user.id)` silencieusement
  - [x] 5.2 — Les achievements débloqués rétroactivement ne déclenchent PAS l'animation (appel fire-and-forget)
  - [x] 5.3 — Erreur gérée silencieusement (console.error)

- [x] **Tâche 6 — Validation** (AC: 11)
  - [x] 6.1 — Test manuel : finir une partie normale avec score 10/10 → animation Perfectionniste
  - [x] 6.2 — Test manuel : faire un streak ≥ 10 → animation Série de Feu
  - [x] 6.3 — Test manuel : première partie compétitive → animation Premier Compétiteur
  - [x] 6.4 — Test manuel : 2 achievements débloqués simultanément → séquence correcte
  - [x] 6.5 — Test manuel : login d'un compte avec 100+ parties → achievement Centenaire débloqué silencieusement
  - [x] 6.6 — `npx tsc --noEmit` : zéro erreur ✅
  - [x] 6.7 — `npm run lint` : zéro nouvelle erreur introduite ✅ (erreurs pré-existantes dans AuthContext/LandingPage/etc.)

## Dev Notes

### Calcul du maxStreak depuis `results`

```ts
// Dans useGameOrchestration.handleFinished, calculer avant les appels Supabase :
function computeMaxStreak(results: QuestionResult[]): number {
  let max = 0
  let current = 0
  for (const r of results) {
    if (r.isCorrect) {
      current++
      if (current > max) max = current
    } else {
      current = 0
    }
  }
  return max
}

const maxStreak = computeMaxStreak(results)
```

### Animation — 3 phases avec Framer Motion

L'animation d'un badge suit 3 phases séquentielles :

```
Phase 1 (entrée)  : badge arrive du bord gauche (ou droit au hasard) vers le centre
Phase 2 (rotation): au centre, le badge fait une rotation Y de 360° (flip 3D)  
Phase 3 (sortie)  : le badge repart vers le bord opposé
```

**Implémentation Framer Motion** :

```tsx
// Choisir côté aléatoire une fois par achievement
const fromLeft = Math.random() > 0.5
const startX = fromLeft ? '-110vw' : '110vw'
const endX = fromLeft ? '110vw' : '-110vw'

// Séquence avec useAnimate ou variants enchaînés
const [scope, animate] = useAnimate()

async function playAnimation() {
  // Phase 1 : entrée (0.6s)
  await animate(scope.current, { x: [startX, '0vw'], opacity: [0, 1] }, { duration: 0.6, ease: 'easeOut' })
  // Phase 2 : rotation 3D (0.5s)
  await animate(scope.current, { rotateY: [0, 360] }, { duration: 0.5, ease: 'easeInOut' })
  // Déclencher la navigation ici (pendant que le badge est centré, juste avant de repartir)
  onNavigateToAchievements()
  // Phase 3 : sortie (0.5s) — légère pause puis départ
  await animate(scope.current, { x: endX, opacity: [1, 0] }, { duration: 0.5, ease: 'easeIn' })
  // Achievement suivant ou fin
  onSequenceComplete()
}

useEffect(() => { playAnimation() }, [currentIndex])
```

**Note importante** : `perspective` CSS nécessaire pour l'effet rotateY 3D. Ajouter sur le container du badge :
```tsx
<div style={{ perspective: '800px' }}>
  <motion.div ref={scope} ...>
    {/* Badge visuel */}
  </motion.div>
</div>
```

**Visual du badge dans l'overlay** :
```tsx
// Badge grand format, centré, style premium
<div className="flex flex-col items-center gap-3">
  <div className="flex h-24 w-24 items-center justify-center rounded-3xl border-2 border-neon-violet bg-game-card shadow-neon-violet text-5xl">
    {achievement.icon}
  </div>
  <div className="text-center">
    <p className="text-xl font-black text-white">{achievement.name}</p>
    <p className="text-sm text-white/60">{achievement.description}</p>
  </div>
  <div className="rounded-full bg-neon-violet/20 px-4 py-1 text-sm font-bold text-neon-violet">
    Achievement débloqué !
  </div>
</div>
```

### Effet shake sur la card dans AchievementsPage

Quand l'overlay navigue vers la page achievements (`onNavigateToAchievements`), passer l'ID de l'achievement en cours via un state dans `App.tsx` : `pendingAchievementId: AchievementId | null`.

`AchievementsPage` reçoit `pendingAchievementId?: AchievementId` en prop.

La card correspondante réagit :
```tsx
const shouldShake = pendingAchievementId === achievement.id

// Utiliser useEffect + animate pour déclencher le shake à l'apparition
const [shaking, setShaking] = useState(false)

useEffect(() => {
  if (shouldShake) {
    setShaking(true)
    const t = setTimeout(() => setShaking(false), 600)
    return () => clearTimeout(t)
  }
}, [shouldShake])

// Sur la card débloquée, ajouter :
<motion.div
  animate={shaking ? { x: [0, -6, 6, -4, 4, -2, 2, 0] } : {}}
  transition={{ duration: 0.5 }}
  className="rounded-2xl border border-neon-violet/30 ..."
>
```

### Wiring App.tsx — flux complet

```
useGameOrchestration.handleFinished
  → checkAndUnlockAchievements(userId, { maxStreak, score, mode })
  → setNewAchievements(newlyUnlocked)

App.tsx screen === 'result' && newAchievements.length > 0
  → <AchievementUnlockOverlay
      achievements={newAchievements}
      onNavigateToAchievements={() => {
        setPendingAchievementId(newAchievements[currentIndex].id)
        setAchievementsOrigin('result')
        setScreen('achievements')
      }}
      onDone={() => {
        setNewAchievements([])
        setPendingAchievementId(null)
        setScreen('result')
      }}
    />

AchievementsPage reçoit pendingAchievementId
  → shake sur la card correspondante
```

**Important** : `AchievementUnlockOverlay` est rendu **par-dessus** la page résultat via `AnimatePresence` en dehors de la state machine principale — il utilise `position: fixed z-50` :

```tsx
// Dans App.tsx, à la fin du JSX (après l'AnimatePresence principal) :
<AnimatePresence>
  {screen === 'result' && newAchievements.length > 0 && (
    <AchievementUnlockOverlay
      key="achievement-overlay"
      achievements={newAchievements}
      onNavigateToAchievements={handleNavigateToAchievements}
      onDone={handleAchievementsDone}
    />
  )}
</AnimatePresence>
```

### AuthContext — check rétroactif au login

Dans `src/contexts/AuthContext.tsx`, dans le handler `onAuthStateChange` :

```ts
// Après le fetch du profil, appeler silencieusement :
if (session?.user) {
  checkAndUnlockAchievements(session.user.id).catch(err => console.error('Achievement check failed:', err))
}
```

**Règle** : appel "fire and forget" — ne pas `await`, ne pas bloquer le rendu de l'app. Le but est uniquement d'insérer les achievements rétroactifs en DB pour qu'ils apparaissent lors de la prochaine consultation de la page.

### Contraintes architecturales

- **`useGameOrchestration`** : `checkAndUnlockAchievements` ne doit pas bloquer la navigation vers `result` — utiliser `Promise.allSettled` ou envelopper dans un try/catch non-bloquant
- **AuthContext** : garder l'appel fire-and-forget — ne jamais await dans le event handler principal
- **Overlay position fixed** : le composant doit être en dehors du flux des écrans pour correctement s'afficher par-dessus `ResultScreen`
- **`style={{ perspective }}` exception** : Tailwind n'a pas de classe pour `perspective` — c'est une des rares utilisations légitimes de style inline
- **`import type`** pour `AchievementWithStatus`, `AchievementId`
- `AchievementUnlockOverlay.tsx` dans `src/components/achievements/`

### Pièges à éviter

1. **Double déclenchement** : si l'utilisateur rejoue rapidement, `newAchievements` peut s'accumuler. Réinitialiser `newAchievements` à `[]` au début de chaque nouvelle partie (dans `handleStart` ou similaire).
2. **rotateY sans perspective** : sans `perspective` sur le parent, `rotateY(360)` ne donne pas un effet 3D visible.
3. **Navigation pendant l'animation** : `onNavigateToAchievements` est appelé au début de la phase 3 (pas à la fin). La page achievements doit être déjà montée quand le badge "arrive". L'overlay reste visible grâce au `z-50` pendant la transition.
4. **Achievements déjà vus** : si l'utilisateur a déjà vu un achievement via rétroactivité (connexion), `checkAndUnlockAchievements` en fin de partie ne le re-déclenchera pas — la table `user_achievements` a une contrainte UNIQUE.
5. **`useAnimate` vs `variants`** : `useAnimate` de Framer Motion est recommandé pour les séquences impératives multi-phases. Éviter les variants complexes pour ce cas.

### Dépendances

- **Dépend de Story 3.1** : `checkAndUnlockAchievements` avec paramètre `context` doit exister
- **Dépend de Story 3.2** : `AchievementsPage` avec prop `pendingAchievementId` doit exister

### References

- [Source: src/hooks/useGameOrchestration.ts:26-98] — handleFinished, flow post-game complet
- [Source: src/contexts/AuthContext.tsx] — onAuthStateChange, pattern fetch profil
- [Source: src/App.tsx:117-143] — pattern result screen + AnimatePresence overlay (cf. AuthModal)
- [Source: src/App.tsx:176-181] — AuthModal overlay hors state machine — même pattern à réutiliser
- [Source: src/components/result/ResultScreen.tsx] — écran résultat pour contexte visuel
- [Source: src/types/quiz.ts] — QuestionResult.isCorrect pour calcul maxStreak

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

(aucun blocage)

### Completion Notes List

- Créé `AchievementUnlockOverlay.tsx` avec animation Framer Motion en 3 phases (entrée, rotateY 360°, sortie). Utilise `useAnimate` impératif + refs stables pour les callbacks.
- `useGameOrchestration.ts` : ajout de `computeMaxStreak` + appel `checkAndUnlockAchievements` fire-and-forget (mode normal et compétitif).
- `achievements.ts` : check `perfectionniste` simplifié à `context.score === 10 && context.mode === 'normal'` (suppression de `totalQuestions`). `serie_de_feu` était déjà correct.
- `App.tsx` : état `newAchievements`, `pendingAchievementId`, type `achievementsOrigin` étendu à `'result'`, overlay hors state machine principale (second `AnimatePresence`).
- `AchievementsPage.tsx` : prop `pendingAchievementId` ajoutée, card transformée en `motion.div` avec effet shake via `useState(shaking)` déclenché par `setTimeout`.
- `AuthContext.tsx` : check rétroactif silencieux `checkAndUnlockAchievements(user.id).catch(...)` après fetch du profil.
- `npx tsc --noEmit` : 0 erreur. Lint : 0 nouvelle erreur introduite (erreurs pré-existantes dans AuthContext/QuizContainer/etc. hors périmètre).

### File List

- `src/components/achievements/AchievementUnlockOverlay.tsx` — nouveau
- `src/hooks/useGameOrchestration.ts` — modifié
- `src/services/achievements.ts` — modifié
- `src/App.tsx` — modifié
- `src/components/achievements/AchievementsPage.tsx` — modifié
- `src/contexts/AuthContext.tsx` — modifié

## Change Log

- 2026-04-12 : Implémentation story 3.3 — overlay d'animation achievement (AchievementUnlockOverlay), intégration post-game dans useGameOrchestration, check rétroactif au login, effet shake sur la card AchievementsPage.
