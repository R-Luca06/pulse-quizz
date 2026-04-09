import { supabase } from './supabase'
import type { GameMode, Difficulty } from '../types/quiz'

export interface LeaderboardEntry {
  id: string
  user_id: string
  username: string
  score: number
  mode: GameMode
  difficulty: Difficulty
  updated_at: string
}

export interface SubmitParams {
  userId: string
  username: string
  score: number
  mode: GameMode
  difficulty: Difficulty
}

export async function submitScore(params: SubmitParams): Promise<void> {
  const { userId, username, score, mode, difficulty } = params

  const { data: existing } = await supabase
    .from('leaderboard')
    .select('score')
    .eq('user_id', userId)
    .eq('mode', mode)
    .eq('difficulty', difficulty)
    .single()

  if (!existing || score > existing.score) {
    const { error } = await supabase
      .from('leaderboard')
      .upsert(
        { user_id: userId, username, score, mode, difficulty, updated_at: new Date().toISOString() },
        { onConflict: 'user_id,mode,difficulty' },
      )
    if (error) throw new Error(error.message)
  }
}

export async function getTopScores(
  mode: GameMode,
  difficulty: Difficulty,
  limit = 10,
): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase
    .from('leaderboard')
    .select('*')
    .eq('mode', mode)
    .eq('difficulty', difficulty)
    .order('score', { ascending: false })
    .order('updated_at', { ascending: true })
    .limit(limit)
  if (error) throw new Error(error.message)
  return data as LeaderboardEntry[]
}
