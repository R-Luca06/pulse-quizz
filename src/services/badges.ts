import { supabase } from './supabase'
import { AppError } from './errors'
import type { OwnedBadge } from '../types/quiz'

// ─── Fetch ────────────────────────────────────────────────────────────────────

export async function getUserBadges(userId: string): Promise<OwnedBadge[]> {
  const { data, error } = await supabase
    .from('user_badges')
    .select('badge_id, source, obtained_at')
    .eq('user_id', userId)
    .order('obtained_at', { ascending: false })

  if (error) throw new AppError('db_error', error.message)

  return (data ?? []).map((row: { badge_id: string; source: string; obtained_at: string }) => ({
    badge_id:    row.badge_id,
    source:      row.source as OwnedBadge['source'],
    obtained_at: row.obtained_at,
  }))
}
