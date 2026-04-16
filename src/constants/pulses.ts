import type { AchievementTier, GameMode, PulsesBreakdown, QuestionResult } from '../types/quiz'

// ─── Barème Pulses ────────────────────────────────────────────────────────────
// Clause : les Pulses sont gagnées uniquement en jouant. Pas d'achat possible.

export type { PulsesBreakdown }

/** Pulses fixes accordées pour avoir joué une partie, par mode. */
export const PULSES_PER_GAME: Record<GameMode, number> = {
  'normal':     10,
  'compétitif': 15,
  'daily':      20,
}

/** Pulses par bonne réponse — modes normal et daily. */
export const PULSES_PER_CORRECT_NORMAL = 3
export const PULSES_PER_CORRECT_DAILY  = 3

/** Compétitif : diviseur du score final → pulses (1 480 pts ≈ 45 pulses). */
export const PULSES_COMP_SCORE_DIVISOR = 33

/** Pulses accordées lors du déblocage d'un achievement selon son tier. */
export const PULSES_PER_ACHIEVEMENT: Record<AchievementTier, number> = {
  common:    10,
  rare:      30,
  epic:      80,
  legendary: 200,
}

/** Bonus de Pulses selon la meilleure série atteinte pendant la partie. */
export function getPulsesStreakBonus(maxStreak: number): number {
  if (maxStreak >= 10) return 20
  if (maxStreak >= 8)  return 14
  if (maxStreak >= 5)  return 8
  if (maxStreak >= 3)  return 4
  return 0
}

// ─── Sources (labels alignés sur la colonne `source` de wallet_transactions) ──

export type PulsesSource =
  | 'game_normal'
  | 'game_competitif'
  | 'game_daily'
  | 'achievement_common'
  | 'achievement_rare'
  | 'achievement_epic'
  | 'achievement_legendary'

export function gameSource(mode: GameMode): PulsesSource {
  if (mode === 'compétitif') return 'game_competitif'
  if (mode === 'daily')      return 'game_daily'
  return 'game_normal'
}

export function achievementSource(tier: AchievementTier): PulsesSource {
  return `achievement_${tier}` as PulsesSource
}

// ─── Calcul ───────────────────────────────────────────────────────────────────

/**
 * Calcule le gain de Pulses d'une partie.
 * - normal      : base + correct*PULSES_PER_CORRECT_NORMAL + streak
 * - compétitif  : base + floor(score / PULSES_COMP_SCORE_DIVISOR) + streak
 * - daily       : (base + correct*PULSES_PER_CORRECT_DAILY + streak) × multiplicateur
 */
export function computePulsesGained(
  mode: GameMode,
  score: number,
  results: QuestionResult[],
  maxStreak: number,
  dailyMultiplier = 1,
): PulsesBreakdown {
  const base         = PULSES_PER_GAME[mode]
  const correctCount = results.filter(r => r.isCorrect).length
  const streak       = getPulsesStreakBonus(maxStreak)

  let correct: number
  if (mode === 'compétitif') {
    correct = Math.floor(Math.max(0, score) / PULSES_COMP_SCORE_DIVISOR)
  } else {
    correct = correctCount * (mode === 'daily' ? PULSES_PER_CORRECT_DAILY : PULSES_PER_CORRECT_NORMAL)
  }

  if (mode === 'daily' && dailyMultiplier > 1) {
    const raw = base + correct + streak
    const multiplied = Math.round(raw * dailyMultiplier)
    // On reverse la répartition proprement : le surplus est distribué proportionnellement
    const ratio = multiplied / Math.max(1, raw)
    const nBase    = Math.round(base    * ratio)
    const nStreak  = Math.round(streak  * ratio)
    const nCorrect = multiplied - nBase - nStreak
    return { base: nBase, correct: nCorrect, streak: nStreak, total: multiplied }
  }

  return { base, correct, streak, total: base + correct + streak }
}
