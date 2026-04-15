import { supabase } from './supabase'
import { computeBestStreak } from '../utils/statsStorage'
import type { GameMode, Difficulty, Category, QuestionResult } from '../types/quiz'
import { NORMAL_MODE_QUESTIONS } from '../constants/game'

export interface CloudCategoryStatRow {
  user_id: string
  mode: string
  difficulty: string
  category: string
  games_played: number
  total_questions: number
  total_correct: number
  total_time: number
  best_score: number
  best_streak: number
  fastest_perfect: number | null
}

export interface CloudGlobalStatRow {
  user_id: string
  games_played: number
  comp_games_played: number
  total_questions: number
  total_correct: number
  best_streak: number
  fastest_perfect: number | null
  comp_total_score: number
}

export async function incrementCategoryStats(
  _userId: string,
  mode: GameMode,
  difficulty: Difficulty,
  category: Category,
  gameScore: number,
  results: QuestionResult[],
): Promise<void> {
  const streak = computeBestStreak(results)
  const totalTime = Math.round(results.reduce((s, r) => s + r.timeSpent, 0) * 10) / 10
  const isPerfect = mode === 'normal' && gameScore === results.length && results.length === NORMAL_MODE_QUESTIONS

  // RPC atomique : INSERT ... ON CONFLICT DO UPDATE SET col = col + delta.
  // Élimine la race condition du pattern précédent (SELECT → calcul → UPSERT).
  const { error } = await supabase.rpc('increment_category_stats', {
    p_mode:            mode,
    p_difficulty:      difficulty,
    p_category:        String(category),
    p_questions:       results.length,
    p_correct:         gameScore,
    p_time:            totalTime,
    p_score:           gameScore,
    p_streak:          streak,
    p_fastest_perfect: isPerfect ? totalTime : null,
  })
  if (error) throw new Error(error.message)
}

export async function incrementGlobalStats(
  _userId: string,
  results: QuestionResult[],
  gameScore: number,
  mode: GameMode,
): Promise<void> {
  const streak = computeBestStreak(results)
  const totalTime = Math.round(results.reduce((s, r) => s + r.timeSpent, 0) * 10) / 10
  const isPerfect = mode === 'normal' && gameScore === results.length && results.length === NORMAL_MODE_QUESTIONS
  const correctCount = results.filter(r => r.isCorrect).length

  // RPC atomique : même logique que increment_category_stats.
  const { error } = await supabase.rpc('increment_global_stats', {
    p_mode:            mode,
    p_questions:       results.length,
    p_correct:         correctCount,
    p_streak:          streak,
    p_comp_score:      mode === 'compétitif' ? gameScore : 0,
    p_fastest_perfect: isPerfect ? totalTime : null,
  })
  if (error) throw new Error(error.message)
}

export async function getCloudBestScore(
  userId: string,
  mode: GameMode,
  difficulty: Difficulty,
  category: Category,
): Promise<number> {
  const { data } = await supabase
    .from('user_stats')
    .select('best_score')
    .eq('user_id', userId)
    .eq('mode', mode)
    .eq('difficulty', difficulty)
    .eq('category', String(category))
    .maybeSingle()
  return (data as { best_score: number } | null)?.best_score ?? 0
}

export async function fetchAllStats(userId: string): Promise<{
  categories: CloudCategoryStatRow[]
  global: CloudGlobalStatRow | null
}> {
  const [catsResult, globalResult] = await Promise.all([
    supabase.from('user_stats').select('*').eq('user_id', userId),
    supabase.from('user_global_stats').select('*').eq('user_id', userId).maybeSingle(),
  ])
  return {
    categories: (catsResult.data ?? []) as CloudCategoryStatRow[],
    global: (globalResult.data ?? null) as CloudGlobalStatRow | null,
  }
}
