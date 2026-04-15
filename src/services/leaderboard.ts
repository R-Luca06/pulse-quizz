import { supabase } from './supabase'
import { AppError } from './errors'
import type { GameMode, Difficulty, Language } from '../types/quiz'

// Traduit une erreur Supabase en erreur applicative.
// RLS deny (anonyme tentant d'écrire) → AppError('auth_error') pour distinguer
// d'une vraie panne DB côté appelant.
function mapSupabaseWriteError(error: { code?: string; message?: string }): Error {
  const msg = error.message ?? 'leaderboard write failed'
  if (error.code === '42501' || /row-level security/i.test(msg)) {
    return new AppError('auth_error', 'Session expirée')
  }
  return new Error(msg)
}

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
  rank?: number          // computed client-side: same rank for tied scores
  featured_badges?: string[]  // depuis profiles.featured_badges
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
  const { username, score, mode, difficulty, language, gameData } = params
  // La logique "seulement si meilleur score" est désormais garantie côté serveur
  // par submit_score (GREATEST). Plus de read-modify-write côté client.
  const { error } = await supabase.rpc('submit_score', {
    p_mode:       mode,
    p_difficulty: mode === 'compétitif' ? 'mixed' : difficulty,
    p_language:   language,
    p_score:      score,
    p_username:   username,
    p_game_data:  gameData ?? null,
  })
  if (error) throw mapSupabaseWriteError(error)
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

export async function getCompLeaderboardPage(
  language: Language,
  page: number,
  pageSize = 10,
): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase
    .from('leaderboard')
    .select('id, user_id, username, score, mode, difficulty, language, updated_at')
    .eq('mode', 'compétitif')
    .eq('language', language)
    .order('score', { ascending: false })
    .order('updated_at', { ascending: true })
    .range(page * pageSize, (page + 1) * pageSize - 1)
  if (error) throw new Error(error.message)
  const entries = data as LeaderboardEntry[]
  if (entries.length === 0) return []

  // Rang de base dérivé de la position dans la page.
  // Le tri (score DESC, updated_at ASC) est deterministe : pas d'égalité aux
  // frontières de page, donc page * pageSize + 1 est toujours exact.
  // Supprime le roundtrip COUNT(higherCount) de l'ancienne implémentation.
  const baseRank = page * pageSize + 1

  // Fetch featured_badges pour les utilisateurs de cette page uniquement.
  const userIds = entries.map(e => e.user_id)
  const { data: profileData } = await supabase
    .from('profiles')
    .select('id, featured_badges')
    .in('id', userIds)
  const badgesMap = new Map(
    ((profileData ?? []) as { id: string; featured_badges: string[] }[])
      .map(p => [p.id, p.featured_badges ?? []])
  )

  // Rang de chaque entry = baseRank + nombre d'entries sur cette page avec un score strictement supérieur.
  // Les égalités de score partagent le même rang.
  return entries.map(entry => ({
    ...entry,
    rank: baseRank + entries.filter(e => e.score > entry.score).length,
    featured_badges: badgesMap.get(entry.user_id) ?? [],
  }))
}

export async function getCompLeaderboardCount(language: Language): Promise<number> {
  const { count, error } = await supabase
    .from('leaderboard')
    .select('*', { count: 'exact', head: true })
    .eq('mode', 'compétitif')
    .eq('language', language)
  if (error) throw new Error(error.message)
  return count ?? 0
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
