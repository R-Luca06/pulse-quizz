import type { GameMode, Difficulty, Category, QuestionResult } from '../types/quiz'
import { NORMAL_MODE_QUESTIONS } from '../constants/game'

// ─── Schema version ──────────────────────────────────────────────────────────
// Bump this number whenever the shape of CategoryStats or GlobalStats changes.
// Add a migration case in migrateCategory / migrateGlobal below.
const STATS_VERSION = 1

export interface CategoryStats {
  version: number
  gamesPlayed: number
  totalQuestions: number
  totalCorrect: number
  totalTime: number              // somme de tous les temps de réponse, en secondes
  bestScore: number
  bestStreak: number
  fastestPerfect: number | null  // secondes, null si jamais parfait en mode normal
}

export interface GlobalStats {
  version: number
  gamesPlayed: number
  totalQuestions: number
  totalCorrect: number
  bestStreak: number
  fastestPerfect: number | null
  comp_total_score: number
}

const EMPTY_CATEGORY_STATS: CategoryStats = {
  version: STATS_VERSION,
  gamesPlayed: 0,
  totalQuestions: 0,
  totalCorrect: 0,
  totalTime: 0,
  bestScore: 0,
  bestStreak: 0,
  fastestPerfect: null,
}

const EMPTY_GLOBAL_STATS: GlobalStats = {
  version: STATS_VERSION,
  gamesPlayed: 0,
  totalQuestions: 0,
  totalCorrect: 0,
  bestStreak: 0,
  fastestPerfect: null,
  comp_total_score: 0,
}

// ─── Migrations ───────────────────────────────────────────────────────────────
// Each case upgrades data from version N-1 to N.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function migrateCategory(raw: any): CategoryStats {
  const v = raw?.version ?? 0
  if (v === 0) {
    // v0 had no version field — fill defaults for any missing keys
    return {
      version: STATS_VERSION,
      gamesPlayed:    raw.gamesPlayed    ?? 0,
      totalQuestions: raw.totalQuestions ?? 0,
      totalCorrect:   raw.totalCorrect   ?? 0,
      totalTime:      raw.totalTime      ?? 0,
      bestScore:      raw.bestScore      ?? 0,
      bestStreak:     raw.bestStreak     ?? 0,
      fastestPerfect: raw.fastestPerfect ?? null,
    }
  }
  return { ...raw, totalTime: raw.totalTime ?? 0 } as CategoryStats
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function migrateGlobal(raw: any): GlobalStats {
  const v = raw?.version ?? 0
  if (v === 0) {
    return {
      version: STATS_VERSION,
      gamesPlayed:      raw.gamesPlayed    ?? 0,
      totalQuestions:   raw.totalQuestions ?? 0,
      totalCorrect:     raw.totalCorrect   ?? 0,
      bestStreak:       raw.bestStreak     ?? 0,
      fastestPerfect:   raw.fastestPerfect ?? null,
      comp_total_score: raw.comp_total_score ?? 0,
    }
  }
  return { ...raw, comp_total_score: raw.comp_total_score ?? 0 } as GlobalStats
}

// ─── Keys ─────────────────────────────────────────────────────────────────────
function categoryKey(mode: string, difficulty: string, category: string | number) {
  return `pulse_stats_${mode}_${difficulty}_${category}`
}

// ─── Readers ──────────────────────────────────────────────────────────────────
export function getCategoryStats(mode: string, difficulty: string, category: string | number): CategoryStats {
  try {
    const raw = localStorage.getItem(categoryKey(mode, difficulty, category))
    if (!raw) return { ...EMPTY_CATEGORY_STATS }
    return migrateCategory(JSON.parse(raw))
  } catch {
    return { ...EMPTY_CATEGORY_STATS }
  }
}

export function getGlobalStats(): GlobalStats {
  try {
    const raw = localStorage.getItem('pulse_stats_global')
    if (!raw) return { ...EMPTY_GLOBAL_STATS }
    return migrateGlobal(JSON.parse(raw))
  } catch {
    return { ...EMPTY_GLOBAL_STATS }
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
export function computeBestStreak(results: QuestionResult[]): number {
  let best = 0
  let current = 0
  for (const r of results) {
    if (r.isCorrect) { current++; best = Math.max(best, current) }
    else current = 0
  }
  return best
}

// ─── Writer ───────────────────────────────────────────────────────────────────
export function updateStats(
  mode: GameMode,
  difficulty: Difficulty,
  category: Category,
  score: number,
  results: QuestionResult[],
): void {
  const streak = computeBestStreak(results)
  const totalTime = Math.round(results.reduce((s, r) => s + r.timeSpent, 0) * 10) / 10
  const isPerfect = mode === 'normal' && score === results.length && score === NORMAL_MODE_QUESTIONS

  // --- Category stats ---
  const cat = getCategoryStats(mode, difficulty, category)
  const newCat: CategoryStats = {
    version:        STATS_VERSION,
    gamesPlayed:    cat.gamesPlayed + 1,
    totalQuestions: cat.totalQuestions + results.length,
    totalCorrect:   cat.totalCorrect + score,
    totalTime:      Math.round((cat.totalTime + totalTime) * 10) / 10,
    bestScore:      Math.max(cat.bestScore, score),
    bestStreak:     Math.max(cat.bestStreak, streak),
    fastestPerfect: isPerfect
      ? cat.fastestPerfect === null ? totalTime : Math.min(cat.fastestPerfect, totalTime)
      : cat.fastestPerfect,
  }
  localStorage.setItem(categoryKey(mode, difficulty, category), JSON.stringify(newCat))

  // --- Global stats ---
  const global = getGlobalStats()
  const newGlobal: GlobalStats = {
    version:          STATS_VERSION,
    gamesPlayed:      global.gamesPlayed + 1,
    totalQuestions:   global.totalQuestions + results.length,
    totalCorrect:     global.totalCorrect + score,
    bestStreak:       Math.max(global.bestStreak, streak),
    fastestPerfect:   isPerfect
      ? global.fastestPerfect === null ? totalTime : Math.min(global.fastestPerfect, totalTime)
      : global.fastestPerfect,
    comp_total_score: global.comp_total_score,
  }
  localStorage.setItem('pulse_stats_global', JSON.stringify(newGlobal))
}
