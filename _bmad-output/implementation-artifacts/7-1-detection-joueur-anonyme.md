# Story 7.1 : Détection d'un joueur anonyme existant

Status: review

> Cycle "Landing Avatar & Vitrine" — Epic 7 (ex-Epic 3). Indépendante. Prérequis utilitaire pour Stories 7.2 et 7.3.

## Story

En tant que **système**,
je veux détecter qu'un visiteur a déjà joué en anonyme avant cette itération,
afin de pouvoir lui proposer un message de transition dédié au lieu du hero générique.

## Acceptance Criteria

1. **Utilitaire `isReturningAnonymous()` disponible** — Une fonction pure exportée depuis [src/utils/statsStorage.ts](src/utils/statsStorage.ts) (ou un nouveau fichier `src/utils/anonymousDetection.ts`) avec signature `export function isReturningAnonymous(): boolean`.
2. **Détection via `pulse_stats_*`** — La fonction scanne `localStorage` et retourne `true` si au moins une clé commence par `pulse_stats_` (préfixe utilisé par `updateStats` et `getCategoryStats` — voir [statsStorage.ts:90-92](src/utils/statsStorage.ts#L90-L92)).
3. **`false` si localStorage vide** — Aucune clé `pulse_stats_*` → retourne `false`.
4. **Lecture seule** — La fonction ne fait aucune écriture dans localStorage ni aucun appel réseau.
5. **Synchrone, rapide** — Exécution synchrone, durée < 5 ms sur un localStorage standard (≤ 100 clés).
6. **Exclusion des anonymes récents** — La fonction doit détecter les anonymes **préexistants à cette itération** (2026-04-12). Comme il n'existe pas de timestamp fiable dans les clés `pulse_stats_*`, considérer **toute** clé `pulse_stats_*` comme signe de "joueur déjà passé" — OK car le PRD n'exige pas de distinction temporelle fine (tout joueur avec historique = candidat au message de transition).
7. **Exclusion du cas connecté** — Si un joueur est connecté, l'appel à `isReturningAnonymous()` ne doit pas être déclenché côté UI (géré par le consommateur — Story 7.2 — pas par la fonction elle-même). La fonction peut retourner `true` pour un connecté avec historique ; c'est au code appelant de gater sur `!user`.
8. **Test unitaire Vitest** — Un test co-localisé `src/utils/statsStorage.test.ts` (ou `anonymousDetection.test.ts`) qui couvre : (a) aucune clé → false, (b) une clé `pulse_stats_normal_easy_all` → true, (c) une clé non liée `other_key` → false (même si présente), (d) plusieurs clés mélangées.
9. **TypeScript strict** — Aucun `any`, typage strict, compatible `verbatimModuleSyntax`.
10. **Qualité gates** — `npx tsc --noEmit`, `npm run lint`, `npm run build` passent. Nouveau test passe.

## Tasks / Subtasks

- [x] **Tâche 1 — Implémenter `isReturningAnonymous`** (AC: 1, 2, 3, 4, 5)
  - [x] 1.1 — Ajouter dans [src/utils/statsStorage.ts](src/utils/statsStorage.ts) (fichier naturel puisque le préfixe `pulse_stats_*` y vit déjà) :
    ```ts
    export function isReturningAnonymous(): boolean {
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && key.startsWith('pulse_stats_')) return true
        }
        return false
      } catch {
        return false
      }
    }
    ```
  - [x] 1.2 — Le `try/catch` gère le cas (rare) où `localStorage` est inaccessible (mode privé Safari, quotas).

- [x] **Tâche 2 — Tests unitaires** (AC: 8, 9)
  - [x] 2.1 — Créer `src/utils/statsStorage.test.ts` (ou étendre si déjà présent).
  - [x] 2.2 — Utiliser `beforeEach(() => localStorage.clear())` pour isoler les tests.
  - [x] 2.3 — Cas testés :
    ```ts
    it('returns false when localStorage is empty', () => {
      expect(isReturningAnonymous()).toBe(false)
    })
    it('returns true when at least one pulse_stats_ key exists', () => {
      localStorage.setItem('pulse_stats_normal_easy_all', JSON.stringify({ version: 1 }))
      expect(isReturningAnonymous()).toBe(true)
    })
    it('returns false when only unrelated keys exist', () => {
      localStorage.setItem('pulse_last_normal_diff', 'medium')
      localStorage.setItem('other_key', 'value')
      expect(isReturningAnonymous()).toBe(false)
    })
    it('returns true when multiple pulse_stats keys exist', () => {
      localStorage.setItem('pulse_stats_global', '{}')
      localStorage.setItem('pulse_stats_normal_easy_all', '{}')
      expect(isReturningAnonymous()).toBe(true)
    })
    ```
  - [x] 2.4 — Vitest + jsdom configurent `localStorage` automatiquement ([vite.config.ts](vite.config.ts) après Story 1.1) — pas de mock nécessaire.

- [x] **Tâche 3 — Validation** (AC: 10)
  - [x] 3.1 — `npx tsc --noEmit`, `npm run lint`, `npm run build` → OK.
  - [x] 3.2 — `npm run test` : nouveaux tests passent + tests existants OK.

## Dev Notes

### Contraintes critiques

- **Pas d'écriture localStorage** : la fonction est en lecture seule stricte. AC 4.
- **Pas de régression** : la fonction est nouvelle, elle ne modifie aucun code existant.
- **Convention de placement** : `src/utils/statsStorage.ts` est le bon fichier (préfixe `pulse_stats_*` y est défini). Pas besoin de créer un nouveau fichier sauf préférence d'isolation — auquel cas `src/utils/anonymousDetection.ts`.

### Patterns à réutiliser

- **Pattern try/catch autour de localStorage** : déjà utilisé dans [statsStorage.ts:95-103](src/utils/statsStorage.ts#L95-L103). Respecter le même pattern.
- **Pattern tests Vitest** : établi en Story 1.1 ([src/hooks/useGameOrchestration.test.ts](src/hooks/useGameOrchestration.test.ts)).

### Attention — `pulse_stats_global` et `pulse_last_normal_diff`

- `pulse_stats_global` (préfixe `pulse_stats_`) : **compte comme signal de joueur existant** (AC OK).
- `pulse_last_normal_diff` (pas préfixé `pulse_stats_`) : **ne compte pas** — OK, c'est juste une préférence UI.

### Project Structure Notes

```
src/utils/
├── statsStorage.ts         # modifié — ajout isReturningAnonymous
├── statsStorage.test.ts    # nouveau — tests
```

### References

- Epic Story 3.1 : [_bmad-output/planning-artifacts/epics.md](_bmad-output/planning-artifacts/epics.md)
- PRD FR13
- statsStorage.ts : [src/utils/statsStorage.ts](src/utils/statsStorage.ts)
- Pattern Vitest : [src/hooks/useGameOrchestration.test.ts](src/hooks/useGameOrchestration.test.ts) (Story 1.1)

## Dev Agent Record

### Agent Model Used

claude-opus-4-6

### Completion Notes List

- [x] 4 tests unitaires passent : **oui** (4/4)
- Utilitaire `isReturningAnonymous()` ajouté dans `statsStorage.ts` (lecture seule, `try/catch` pour mode privé Safari / quotas, parcours `localStorage` via index).
- Tests co-localisés dans `src/utils/statsStorage.test.ts` couvrant les 4 cas prévus (empty, key présente, clés non liées, plusieurs clés).
- Gates qualité : `npx tsc --noEmit` OK, `npm run lint` OK, `npx vitest run` 44/44 OK, `npm run build` OK.

### File List

**Modifiés :**
- `src/utils/statsStorage.ts` (+ `isReturningAnonymous`)

**Créés :**
- `src/utils/statsStorage.test.ts`

### Change Log

- 2026-04-13 — Ajout utilitaire `isReturningAnonymous()` + tests Vitest (Story 7.1).
