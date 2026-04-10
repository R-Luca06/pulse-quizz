import { supabase } from './supabase'
import type { GameMode, Difficulty, Language } from '../types/quiz'

export interface CompGameData {
  question: string
  correctAnswer: string
  userAnswer: string | null
  isCorrect: boolean
  timeSpent: number
  pointsEarned: number
  multiplier: number
}

export interface LeaderboardEntry {
  id: string
  user_id: string
  username: string
  score: number
  mode: GameMode
  difficulty: Difficulty
  language: Language
  updated_at: string
  game_data?: CompGameData[]
}

export interface SubmitParams {
  userId: string
  username: string
  score: number
  mode: GameMode
  difficulty: Difficulty
  language: Language
  gameData?: CompGameData[]
}

export async function submitScore(params: SubmitParams): Promise<void> {
  const { userId, username, score, mode, difficulty, language, gameData } = params

  if (mode === 'compétitif') {
    const { data: existing } = await supabase
      .from('leaderboard')
      .select('id, score')
      .eq('user_id', userId)
      .eq('mode', mode)
      .eq('language', language)
      .maybeSingle()

    if (!existing || score > existing.score) {
      if (existing) {
        const { error } = await supabase
          .from('leaderboard')
          .update({
            username,
            score,
            game_data: gameData ?? null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
        if (error) throw new Error(error.message)
      } else {
        const { error } = await supabase
          .from('leaderboard')
          .insert({
            user_id: userId,
            username,
            score,
            mode,
            difficulty: 'mixed',
            language,
            game_data: gameData ?? null,
            updated_at: new Date().toISOString(),
          })
        if (error) throw new Error(error.message)
      }
    }
  } else {
    const { data: existing } = await supabase
      .from('leaderboard')
      .select('id, score')
      .eq('user_id', userId)
      .eq('mode', mode)
      .eq('difficulty', difficulty)
      .maybeSingle()

    if (!existing || score > existing.score) {
      if (existing) {
        const { error } = await supabase
          .from('leaderboard')
          .update({ username, score, updated_at: new Date().toISOString() })
          .eq('id', existing.id)
        if (error) throw new Error(error.message)
      } else {
        const { error } = await supabase
          .from('leaderboard')
          .insert({ user_id: userId, username, score, mode, difficulty, language, updated_at: new Date().toISOString() })
        if (error) throw new Error(error.message)
      }
    }
  }
}

export async function getTopScores(
  mode: GameMode,
  difficulty: Difficulty,
  limit = 10,
): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase
    .from('leaderboard')
    .select('id, user_id, username, score, mode, difficulty, language, updated_at')
    .eq('mode', mode)
    .eq('difficulty', difficulty)
    .order('score', { ascending: false })
    .order('updated_at', { ascending: true })
    .limit(limit)
  if (error) throw new Error(error.message)
  return data as LeaderboardEntry[]
}

export async function getCompTopScores(
  language: Language,
  limit = 10,
): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase
    .from('leaderboard')
    .select('id, user_id, username, score, mode, difficulty, language, updated_at')
    .eq('mode', 'compétitif')
    .eq('language', language)
    .order('score', { ascending: false })
    .order('updated_at', { ascending: true })
    .limit(limit)
  if (error) throw new Error(error.message)
  return data as LeaderboardEntry[]
}

export async function getUserBestScore(userId: string, language: Language): Promise<number> {
  const { data } = await supabase
    .from('leaderboard')
    .select('score')
    .eq('user_id', userId)
    .eq('mode', 'compétitif')
    .eq('language', language)
    .maybeSingle()
  return (data as { score: number } | null)?.score ?? 0
}

export async function getUserRank(userId: string, language: Language): Promise<number | null> {
  const { data: entry } = await supabase
    .from('leaderboard')
    .select('score')
    .eq('user_id', userId)
    .eq('mode', 'compétitif')
    .eq('language', language)
    .maybeSingle()
  if (!entry) return null
  const { count } = await supabase
    .from('leaderboard')
    .select('*', { count: 'exact', head: true })
    .eq('mode', 'compétitif')
    .eq('language', language)
    .gt('score', (entry as { score: number }).score)
  return (count ?? 0) + 1
}

export async function getCompEntryGameData(entryId: string): Promise<CompGameData[] | null> {
  const { data, error } = await supabase
    .from('leaderboard')
    .select('game_data')
    .eq('id', entryId)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return (data as { game_data: CompGameData[] | null } | null)?.game_data ?? null
}
