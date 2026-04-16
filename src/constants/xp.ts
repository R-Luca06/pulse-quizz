import type { AchievementTier, GameMode, QuestionResult, XpBreakdown } from '../types/quiz'
import { NORMAL_MODE_QUESTIONS } from './game'

// ─── Barème XP ────────────────────────────────────────────────────────────────

export const XP_PER_GAME: Record<GameMode, number> = {
  'normal':     10,
  'compétitif': 15,
  'daily':      30,   // base XP participation, le vrai calcul est dans dailyChallenge.ts
}

export const XP_PER_CORRECT = 5

/** Bonus score parfait (10/10 en mode normal). */
export const XP_PERFECT_BONUS = 25

/** XP accordé lors du déblocage d'un achievement selon son tier. */
export const XP_PER_ACHIEVEMENT: Record<AchievementTier, number> = {
  common:    25,
  rare:      75,
  epic:      200,
  legendary: 500,
}

// ─── Calcul ───────────────────────────────────────────────────────────────────

export type { XpBreakdown }

export function computeXpGained(
  results: QuestionResult[],
  mode: GameMode,
  score: number,
): XpBreakdown {
  const base           = XP_PER_GAME[mode]
  const correctResults = results.filter(r => r.isCorrect)

  // En compétitif, le multiplicateur de vitesse s'applique au XP par réponse
  const correct = mode === 'compétitif'
    ? correctResults.reduce((sum, r) => sum + Math.round(XP_PER_CORRECT * (r.multiplier ?? 1)), 0)
    : correctResults.length * XP_PER_CORRECT

  const isPerfect = mode === 'normal'
    && score === NORMAL_MODE_QUESTIONS
    && results.length === NORMAL_MODE_QUESTIONS
  const bonus = isPerfect ? XP_PERFECT_BONUS : 0

  return { base, correct, bonus, total: base + correct + bonus }
}
