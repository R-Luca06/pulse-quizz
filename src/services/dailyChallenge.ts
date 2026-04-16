import { supabase } from './supabase'
import { AppError } from './errors'
import type { DailyTheme, DailyEntry, DailyStreak, DailyLeaderboardEntry } from '../types/quiz'

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Retourne la date du jour en UTC au format 'YYYY-MM-DD'. */
export function getTodayDate(): string {
  return new Date().toISOString().slice(0, 10)
}

/**
 * Calcule le multiplicateur XP en fonction de la série active.
 *  1  → ×1.0
 *  3  → ×1.5
 *  7  → ×2.0
 *  14 → ×2.5
 *  30 → ×3.0
 */
export function getDailyMultiplier(streak: number): number {
  if (streak >= 30) return 3.0
  if (streak >= 14) return 2.5
  if (streak >= 7)  return 2.0
  if (streak >= 3)  return 1.5
  return 1.0
}

/** XP de base pour le défi journalier avant multiplicateur. */
const DAILY_BASE_XP_PER_CORRECT = 20   // 10 questions × 20 = 200 XP max avant mult.
const DAILY_BASE_XP_PARTICIPATION = 30 // XP fixe pour avoir joué

export function computeDailyXp(correctAnswers: number, streakMultiplier: number): number {
  const base = DAILY_BASE_XP_PARTICIPATION + correctAnswers * DAILY_BASE_XP_PER_CORRECT
  return Math.round(base * streakMultiplier)
}

// ─── Theme ────────────────────────────────────────────────────────────────────

/** Récupère le thème du jour (ou d'une date donnée). Null si aucun thème configuré. */
export async function getDailyTheme(date?: string): Promise<DailyTheme | null> {
  const d = date ?? getTodayDate()
  const { data, error } = await supabase
    .from('daily_themes')
    .select('date, title, emoji, description, category_tags')
    .eq('date', d)
    .maybeSingle()

  if (error) throw new AppError('db_error', error.message)
  return data as DailyTheme | null
}

/** Récupère la liste des dates pour lesquelles un thème existe (triées DESC). */
export async function getDailyThemeDates(): Promise<string[]> {
  const { data, error } = await supabase
    .from('daily_themes')
    .select('date')
    .order('date', { ascending: false })
    .limit(60)

  if (error) throw new AppError('db_error', error.message)
  return (data ?? []).map((r: { date: string }) => r.date)
}

// ─── Entry ────────────────────────────────────────────────────────────────────

/** Récupère la participation d'un utilisateur pour une date donnée. */
export async function getDailyEntry(userId: string, date?: string): Promise<DailyEntry | null> {
  const d = date ?? getTodayDate()
  const { data, error } = await supabase
    .from('daily_challenge_entries')
    .select('id, user_id, date, score, xp_earned, multiplier, streak_day, completed_at')
    .eq('user_id', userId)
    .eq('date', d)
    .maybeSingle()

  if (error) throw new AppError('db_error', error.message)
  if (!data) return null
  return {
    ...data,
    multiplier: Number(data.multiplier),
  } as DailyEntry
}

// ─── Streak ───────────────────────────────────────────────────────────────────

/** Récupère l'état de la série d'un utilisateur. */
export async function getDailyStreak(userId: string): Promise<DailyStreak> {
  const { data, error } = await supabase
    .from('daily_streaks')
    .select('user_id, current_streak, longest_streak, last_played_date')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw new AppError('db_error', error.message)
  if (!data) {
    return { user_id: userId, current_streak: 0, longest_streak: 0, last_played_date: null }
  }
  return data as DailyStreak
}

// ─── Submit ───────────────────────────────────────────────────────────────────

export interface SubmitDailyParams {
  date: string
  score: number           // speed-based points (soumis au leaderboard)
  multiplier: number      // multiplicateur de série (pour XP)
  correctAnswers: number  // nombre de bonnes réponses (pour calcul XP)
}

export interface SubmitDailyResult {
  entry_id: string
  streak_day: number
  current_streak: number
  longest_streak: number
}

/** Soumet un score journalier via la RPC sécurisée. */
export async function submitDailyEntry(params: SubmitDailyParams): Promise<SubmitDailyResult> {
  const { date, score, multiplier, correctAnswers } = params
  const xp_earned = computeDailyXp(correctAnswers, multiplier)

  const { data, error } = await supabase.rpc('submit_daily_entry', {
    p_date:       date,
    p_score:      score,
    p_xp_earned:  xp_earned,
    p_multiplier: multiplier,
  })

  if (error) {
    if (error.message?.includes('already_played')) {
      throw new AppError('validation_error', 'Tu as déjà joué le défi du jour.')
    }
    throw new AppError('db_error', error.message)
  }
  return data as SubmitDailyResult
}

// ─── Leaderboard ──────────────────────────────────────────────────────────────

export interface DailyLeaderboardPage {
  entries: DailyLeaderboardEntry[]
  total: number
}

/** Récupère le leaderboard journalier paginé pour une date. */
export async function getDailyLeaderboard(
  date?: string,
  page = 0,
  pageSize = 10,
): Promise<DailyLeaderboardPage> {
  const d = date ?? getTodayDate()
  const offset = page * pageSize

  const [{ data: entries, error }, { count, error: countError }] = await Promise.all([
    supabase.rpc('get_daily_leaderboard', {
      p_date:   d,
      p_offset: offset,
      p_limit:  pageSize,
    }),
    supabase
      .from('daily_challenge_entries')
      .select('*', { count: 'exact', head: true })
      .eq('date', d),
  ])

  if (error) throw new AppError('db_error', error.message)
  if (countError) throw new AppError('db_error', countError.message)

  return {
    entries: ((entries ?? []) as DailyLeaderboardEntry[]).map(e => ({
      ...e,
      multiplier: Number(e.multiplier),
      rank: Number(e.rank),
    })),
    total: count ?? 0,
  }
}

/** Récupère le rang d'un utilisateur dans le leaderboard journalier d'une date. */
export async function getDailyUserRank(userId: string, date?: string): Promise<number | null> {
  const d = date ?? getTodayDate()
  const { data, error } = await supabase
    .from('daily_challenge_entries')
    .select('score, completed_at')
    .eq('user_id', userId)
    .eq('date', d)
    .maybeSingle()

  if (error || !data) return null

  const { count } = await supabase
    .from('daily_challenge_entries')
    .select('*', { count: 'exact', head: true })
    .eq('date', d)
    .or(`score.gt.${data.score},and(score.eq.${data.score},completed_at.lt.${data.completed_at})`)

  return (count ?? 0) + 1
}

/** Compte le nombre de joueurs ayant participé au défi d'une date. */
export async function getDailyPlayerCount(date?: string): Promise<number> {
  const d = date ?? getTodayDate()
  const { count, error } = await supabase
    .from('daily_challenge_entries')
    .select('*', { count: 'exact', head: true })
    .eq('date', d)

  if (error) throw new AppError('db_error', error.message)
  return count ?? 0
}

/** Compte combien de fois l'utilisateur a fait un score parfait en daily. */
export async function getDailyPerfectCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('daily_challenge_entries')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('score', 10)

  if (error) throw new AppError('db_error', error.message)
  return count ?? 0
}
