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

export async function incrementCategoryStats(
  userId: string,
  mode: GameMode,
  difficulty: Difficulty,
  category: Category,
  gameScore: number,
  results: QuestionResult[],
): Promise<void> {
  const streak = computeBestStreak(results)
  const totalTime = Math.round(results.reduce((s, r) => s + r.timeSpent, 0) * 10) / 10
  const isPerfect = mode === 'normal' && gameScore === results.length && results.length === NORMAL_MODE_QUESTIONS

  const { data: existing } = await supabase
    .from('user_stats')
    .select('*')
    .eq('user_id', userId)
    .eq('mode', mode)
    .eq('difficulty', difficulty)
    .eq('category', String(category))
    .maybeSingle()

  const prev = existing ?? {
    games_played: 0, total_questions: 0, total_correct: 0,
    best_score: 0, best_streak: 0, fastest_perfect: null,
  }

  await supabase.from('user_stats').upsert({
    user_id: userId,
    mode,
    difficulty,
    category: String(category),
    games_played:    prev.games_played + 1,
    total_questions: prev.total_questions + results.length,
    total_correct:   prev.total_correct + gameScore,
    best_score:      Math.max(prev.best_score, gameScore),
    best_streak:     Math.max(prev.best_streak, streak),
    fastest_perfect: isPerfect
      ? prev.fastest_perfect === null ? totalTime : Math.min(prev.fastest_perfect, totalTime)
      : prev.fastest_perfect,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id,mode,difficulty,category' })
}

export async function incrementGlobalStats(
  userId: string,
  results: QuestionResult[],
  gameScore: number,
  mode: GameMode,
): Promise<void> {
  const streak = computeBestStreak(results)
  const totalTime = Math.round(results.reduce((s, r) => s + r.timeSpent, 0) * 10) / 10
  const isPerfect = mode === 'normal' && gameScore === results.length && results.length === NORMAL_MODE_QUESTIONS

  const { data: existing } = await supabase
    .from('user_global_stats')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  const prev = existing ?? {
    games_played: 0, total_questions: 0, total_correct: 0,
    best_streak: 0, fastest_perfect: null,
  }

  await supabase.from('user_global_stats').upsert({
    user_id: userId,
    games_played:    prev.games_played + 1,
    total_questions: prev.total_questions + results.length,
    total_correct:   prev.total_correct + gameScore,
    best_streak:     Math.max(prev.best_streak, streak),
    fastest_perfect: isPerfect
      ? prev.fastest_perfect === null ? totalTime : Math.min(prev.fastest_perfect, totalTime)
      : prev.fastest_perfect,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' })
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
