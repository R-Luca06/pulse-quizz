import { supabase } from './supabase'
import { AppError } from './errors'
import type {
  DailyTheme,
  DailyEntry,
  DailyStreak,
  DailyLeaderboardEntry,
  DailyRecapData,
  QuestionResult,
  AchievementWithStatus,
  AchievementId,
} from '../types/quiz'
import { ACHIEVEMENTS } from '../constants/achievements'
import { XP_PER_ACHIEVEMENT } from '../constants/xp'
import { computePulsesGained } from '../constants/pulses'
import { computeBestStreak } from '../utils/statsStorage'
import { fetchDailyQuestions } from './api'

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

const ENTRY_COLUMNS =
  'id, user_id, date, score, correct_answers, xp_earned, multiplier, streak_day, completed_at, recap_seen, question_results'

function mapEntryRow(row: Record<string, unknown>): DailyEntry {
  return {
    id:               row.id as string,
    user_id:          row.user_id as string,
    date:             row.date as string,
    score:            Number(row.score),
    correct_answers:  Number(row.correct_answers ?? 0),
    xp_earned:        Number(row.xp_earned),
    multiplier:       Number(row.multiplier),
    streak_day:       Number(row.streak_day),
    completed_at:     row.completed_at as string,
    recap_seen:       Boolean(row.recap_seen),
    question_results: Array.isArray(row.question_results) ? (row.question_results as QuestionResult[]) : [],
  }
}

/** Récupère la participation d'un utilisateur pour une date donnée. */
export async function getDailyEntry(userId: string, date?: string): Promise<DailyEntry | null> {
  const d = date ?? getTodayDate()
  const { data, error } = await supabase
    .from('daily_challenge_entries')
    .select(ENTRY_COLUMNS)
    .eq('user_id', userId)
    .eq('date', d)
    .maybeSingle()

  if (error) throw new AppError('db_error', error.message)
  if (!data) return null
  return mapEntryRow(data as Record<string, unknown>)
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
  score: number                     // speed-based points (soumis au leaderboard)
  multiplier: number                // multiplicateur de série (pour XP)
  correctAnswers: number            // nombre de bonnes réponses (pour calcul XP)
  questionResults: QuestionResult[] // détail par question (stocké pour la Recap)
}

export interface SubmitDailyResult {
  entry_id: string
  streak_day: number
  current_streak: number
  longest_streak: number
}

/** Soumet un score journalier via la RPC sécurisée. */
export async function submitDailyEntry(params: SubmitDailyParams): Promise<SubmitDailyResult> {
  const { date, score, multiplier, correctAnswers, questionResults } = params
  const xp_earned = computeDailyXp(correctAnswers, multiplier)

  const { data, error } = await supabase.rpc('submit_daily_entry', {
    p_date:              date,
    p_score:             score,
    p_xp_earned:         xp_earned,
    p_multiplier:        multiplier,
    p_correct_answers:   correctAnswers,
    p_question_results:  questionResults,
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
    .eq('correct_answers', 10)

  if (error) throw new AppError('db_error', error.message)
  return count ?? 0
}

// ─── Recap ────────────────────────────────────────────────────────────────────

/**
 * Récupère les données nécessaires à la Daily Recap : l'entrée la plus récente
 * non vue par l'utilisateur et dont la date est strictement antérieure à
 * aujourd'hui. Retourne null s'il n'y a rien à afficher.
 */
export async function getPendingDailyRecap(userId: string): Promise<DailyRecapData | null> {
  const today = getTodayDate()

  const { data: entryRow, error: entryError } = await supabase
    .from('daily_challenge_entries')
    .select(ENTRY_COLUMNS)
    .eq('user_id', userId)
    .eq('recap_seen', false)
    .lt('date', today)
    .order('date', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (entryError) throw new AppError('db_error', entryError.message)
  if (!entryRow) return null

  const entry = mapEntryRow(entryRow as Record<string, unknown>)

  const [theme, leaderboard, rank, totalPlayers, streak, achievementsRow, xpRow] = await Promise.all([
    getDailyTheme(entry.date),
    getDailyLeaderboard(entry.date, 0, 3),
    getDailyUserRank(userId, entry.date),
    getDailyPlayerCount(entry.date),
    getDailyStreak(userId),
    supabase
      .from('user_achievements')
      .select('achievement_id, unlocked_at')
      .eq('user_id', userId)
      .like('achievement_id', 'daily_%')
      .gte('unlocked_at', entry.completed_at)
      .then(({ data, error }) => {
        if (error) throw new AppError('db_error', error.message)
        return (data ?? []) as Array<{ achievement_id: string; unlocked_at: string }>
      }),
    supabase
      .from('user_global_stats')
      .select('total_xp')
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) throw new AppError('db_error', error.message)
        return data as { total_xp: number } | null
      }),
  ])

  // Questions : priorité aux résultats stockés ; fallback sur la re-fetch pour
  // les entries antérieures à la migration (userAnswer absent).
  let questions: QuestionResult[] = entry.question_results
  if (questions.length === 0) {
    try {
      const fetched = await fetchDailyQuestions(entry.date)
      questions = fetched.map(q => ({
        question:      q.question,
        correctAnswer: q.correct_answer,
        userAnswer:    null,
        isCorrect:     false,
        timeSpent:     0,
        anecdote:      q.anecdote ?? null,
      }))
    } catch {
      questions = []
    }
  }

  // Achievements : zip avec la liste statique pour fournir name/icon/tier.
  const achievementsMap = new Map(
    achievementsRow.map(r => [r.achievement_id as AchievementId, r.unlocked_at]),
  )
  const unlockedAchievements: AchievementWithStatus[] = ACHIEVEMENTS
    .filter(a => achievementsMap.has(a.id))
    .map(a => ({
      ...a,
      unlocked:    true,
      unlocked_at: achievementsMap.get(a.id) ?? null,
      progress:    a.progressTotal !== null ? { current: a.progressTotal, total: a.progressTotal } : null,
    }))

  // Pulses gagnés : recalculés à partir des résultats stockés.
  const maxStreak = computeBestStreak(questions)
  const pulses = computePulsesGained('daily', entry.score, questions, maxStreak, entry.multiplier)

  return {
    entry,
    theme,
    questions,
    rank,
    totalPlayers,
    topThree: leaderboard.entries,
    streak,
    unlockedAchievements,
    pulsesEarned: pulses.total,
    totalXpNow:   xpRow?.total_xp ?? 0,
  }
}

/** Marque l'entry comme vue pour éviter de remontrer la recap. */
export async function markDailyRecapSeen(date: string): Promise<void> {
  const { error } = await supabase.rpc('mark_daily_recap_seen', { p_date: date })
  if (error) throw new AppError('db_error', error.message)
}

/** Somme de l'XP gagnée pendant la session daily (partie + achievements daily). */
export function computeDailyRecapXpTotal(data: DailyRecapData): number {
  const achievementXp = data.unlockedAchievements.reduce(
    (sum, a) => sum + XP_PER_ACHIEVEMENT[a.tier],
    0,
  )
  return data.entry.xp_earned + achievementXp
}
