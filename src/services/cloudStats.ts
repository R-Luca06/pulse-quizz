import { supabase } from './supabase'
import type { CategoryStats, GlobalStats } from '../utils/statsStorage'
import type { GameMode, Difficulty, Category } from '../types/quiz'

export interface CloudCategoryStatRow {
  user_id: string
  mode: string
  difficulty: string
  category: string
  games_played: number
  total_questions: number
  total_correct: number
  best_score: number
  best_streak: number
  fastest_perfect: number | null
}

export interface CloudGlobalStatRow {
  user_id: string
  games_played: number
  total_questions: number
  total_correct: number
  best_streak: number
  fastest_perfect: number | null
}

export async function syncCategoryStats(
  userId: string,
  mode: GameMode,
  difficulty: Difficulty,
  category: Category,
  stats: CategoryStats,
): Promise<void> {
  await supabase.from('user_stats').upsert({
    user_id: userId,
    mode,
    difficulty,
    category: String(category),
    games_played: stats.gamesPlayed,
    total_questions: stats.totalQuestions,
    total_correct: stats.totalCorrect,
    best_score: stats.bestScore,
    best_streak: stats.bestStreak,
    fastest_perfect: stats.fastestPerfect,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id,mode,difficulty,category' })
}

export async function syncGlobalStats(
  userId: string,
  stats: GlobalStats,
): Promise<void> {
  await supabase.from('user_global_stats').upsert({
    user_id: userId,
    games_played: stats.gamesPlayed,
    total_questions: stats.totalQuestions,
    total_correct: stats.totalCorrect,
    best_streak: stats.bestStreak,
    fastest_perfect: stats.fastestPerfect,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' })
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
