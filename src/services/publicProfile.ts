import { supabase } from './supabase'
import type { AchievementId, EquippedCosmetics } from '../types/quiz'

export interface PublicProfile {
  userId:            string
  username:          string
  avatar_emoji:      string
  avatar_color:      string
  description:       string
  featured_badges:   AchievementId[]
  games_played:      number
  total_correct:     number
  best_streak:       number
  best_comp_score:   number
  rank:              number | null
  total_players:     number
  total_xp:          number
  achievements:      AchievementId[]
  /** id → date ISO de déblocage */
  achievement_dates: Record<string, string>
  equipped:          EquippedCosmetics
}

export async function getPublicProfile(username: string): Promise<PublicProfile | null> {
  const [rpcResult, profileRow] = await Promise.all([
    supabase.rpc('get_public_profile', { p_username: username }),
    supabase.from('profiles').select('id').ilike('username', username).single(),
  ])
  if (rpcResult.error || !rpcResult.data) return null
  // La RPC retourne un jsonb → cast direct
  const raw = rpcResult.data as Record<string, unknown>
  return {
    userId:          profileRow.data?.id ?? '',
    username:        raw.username        as string,
    avatar_emoji:    raw.avatar_emoji    as string,
    avatar_color:    raw.avatar_color    as string,
    description:     raw.description     as string,
    featured_badges: (raw.featured_badges as string[]).filter(Boolean) as AchievementId[],
    games_played:    (raw.games_played    as number)  ?? 0,
    total_correct:   (raw.total_correct   as number)  ?? 0,
    best_streak:     (raw.best_streak     as number)  ?? 0,
    best_comp_score: (raw.best_comp_score as number)  ?? 0,
    rank:            (raw.rank            as number | null) ?? null,
    total_players:   (raw.total_players   as number)  ?? 0,
    total_xp:        (raw.total_xp        as number)  ?? 0,
    achievements:      ((raw.achievements as string[]) ?? []).filter(Boolean) as AchievementId[],
    achievement_dates: Object.fromEntries(
      ((raw.achievement_dates as { id: string; unlocked_at: string }[]) ?? [])
        .map(a => [a.id, a.unlocked_at])
    ),
    equipped: {
      emblem_id:      (raw.equipped_emblem_id      as string | null) ?? null,
      background_id:  (raw.equipped_background_id  as string | null) ?? null,
      title_id:       (raw.equipped_title_id       as string | null) ?? null,
      card_design_id: (raw.equipped_card_design_id as string | null) ?? null,
      screen_anim_id: (raw.equipped_screen_anim_id as string | null) ?? null,
    },
  }
}
