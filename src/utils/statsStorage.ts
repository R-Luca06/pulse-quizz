import type { GameMode, Difficulty, Category, QuestionResult } from '../types/quiz'
import { NORMAL_MODE_QUESTIONS } from '../constants/game'

export interface CategoryStats {
  gamesPlayed: number
  totalQuestions: number
  totalCorrect: number
  bestScore: number
  bestStreak: number
  fastestPerfect: number | null  // secondes, null si jamais 10/10 en mode normal
}

export interface GlobalStats {
  gamesPlayed: number
  totalQuestions: number
  totalCorrect: number
  bestStreak: number
  fastestPerfect: number | null
}

const EMPTY_CATEGORY_STATS: CategoryStats = {
  gamesPlayed: 0,
  totalQuestions: 0,
  totalCorrect: 0,
  bestScore: 0,
  bestStreak: 0,
  fastestPerfect: null,
}

const EMPTY_GLOBAL_STATS: GlobalStats = {
  gamesPlayed: 0,
  totalQuestions: 0,
  totalCorrect: 0,
  bestStreak: 0,
  fastestPerfect: null,
}

function categoryKey(mode: string, difficulty: string, category: string | number) {
  return `pulse_stats_${mode}_${difficulty}_${category}`
}

export function getCategoryStats(mode: string, difficulty: string, category: string | number): CategoryStats {
  try {
    const raw = localStorage.getItem(categoryKey(mode, difficulty, category))
    return raw ? (JSON.parse(raw) as CategoryStats) : { ...EMPTY_CATEGORY_STATS }
  } catch {
    return { ...EMPTY_CATEGORY_STATS }
  }
}

export function getGlobalStats(): GlobalStats {
  try {
    const raw = localStorage.getItem('pulse_stats_global')
    return raw ? (JSON.parse(raw) as GlobalStats) : { ...EMPTY_GLOBAL_STATS }
  } catch {
    return { ...EMPTY_GLOBAL_STATS }
  }
}

export function computeBestStreak(results: QuestionResult[]): number {
  let best = 0
  let current = 0
  for (const r of results) {
    if (r.isCorrect) { current++; best = Math.max(best, current) }
    else current = 0
  }
  return best
}

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
    gamesPlayed:   cat.gamesPlayed + 1,
    totalQuestions: cat.totalQuestions + results.length,
    totalCorrect:  cat.totalCorrect + score,
    bestScore:     Math.max(cat.bestScore, score),
    bestStreak:    Math.max(cat.bestStreak, streak),
    fastestPerfect: isPerfect
      ? cat.fastestPerfect === null ? totalTime : Math.min(cat.fastestPerfect, totalTime)
      : cat.fastestPerfect,
  }
  localStorage.setItem(categoryKey(mode, difficulty, category), JSON.stringify(newCat))

  // --- Global stats ---
  const global = getGlobalStats()
  const newGlobal: GlobalStats = {
    gamesPlayed:   global.gamesPlayed + 1,
    totalQuestions: global.totalQuestions + results.length,
    totalCorrect:  global.totalCorrect + score,
    bestStreak:    Math.max(global.bestStreak, streak),
    fastestPerfect: isPerfect
      ? global.fastestPerfect === null ? totalTime : Math.min(global.fastestPerfect, totalTime)
      : global.fastestPerfect,
  }
  localStorage.setItem('pulse_stats_global', JSON.stringify(newGlobal))
}
