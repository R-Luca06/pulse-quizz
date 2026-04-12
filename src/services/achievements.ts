import { supabase } from './supabase'
import { AppError } from './errors'
import { ACHIEVEMENTS, ACHIEVEMENT_MAP } from '../constants/achievements'
import type { AchievementId, AchievementWithStatus, GameMode } from '../types/quiz'

// ─── Context optionnel pour les achievements temps-réel ───────────────────────

export interface AchievementContext {
  maxStreak?: number   // streak max atteint en cours de partie
  score?: number       // score final (pour Perfectionniste)
  mode?: GameMode
}

// ─── Fetch ────────────────────────────────────────────────────────────────────

export async function getUserAchievements(userId: string): Promise<AchievementWithStatus[]> {
  const { data, error } = await supabase
    .from('user_achievements')
    .select('achievement_id, unlocked_at')
    .eq('user_id', userId)

  if (error) throw new AppError('db_error', error.message)

  const unlockedMap = new Map((data ?? []).map((r: { achievement_id: string; unlocked_at: string }) => [r.achievement_id, r.unlocked_at]))

  return ACHIEVEMENTS.map(a => ({
    ...a,
    unlocked: unlockedMap.has(a.id),
    unlocked_at: unlockedMap.get(a.id) ?? null,
    progress: a.progressTotal !== null ? { current: 0, total: a.progressTotal } : null,
  }))
}

// ─── Check & Unlock ───────────────────────────────────────────────────────────

export async function checkAndUnlockAchievements(
  userId: string,
  context?: AchievementContext
): Promise<AchievementWithStatus[]> {
  // 1. Récupérer les achievements déjà débloqués
  const { data: existing, error: fetchError } = await supabase
    .from('user_achievements')
    .select('achievement_id')
    .eq('user_id', userId)
  if (fetchError) throw new AppError('db_error', fetchError.message)

  const alreadyUnlocked = new Set((existing ?? []).map((r: { achievement_id: string }) => r.achievement_id))

  // 2. Récupérer les données nécessaires pour les checks
  const [profileResult, globalStatsResult, compResult] = await Promise.all([
    supabase.from('profiles').select('created_at').eq('id', userId).maybeSingle(),
    supabase.from('user_global_stats').select('games_played').eq('user_id', userId).maybeSingle(),
    supabase.from('comp_leaderboard').select('id').eq('user_id', userId).limit(1),
  ])

  const gamesPlayed = (globalStatsResult.data as { games_played: number } | null)?.games_played ?? 0
  const hasCompGame = ((compResult.data as { id: string }[] | null)?.length ?? 0) > 0

  // 3. Évaluer chaque achievement non débloqué
  const toUnlock: AchievementId[] = []

  if (!alreadyUnlocked.has('premiers_pas')) {
    if (profileResult.data) toUnlock.push('premiers_pas')
  }

  if (!alreadyUnlocked.has('premier_competiteur')) {
    if (hasCompGame || context?.mode === 'compétitif') toUnlock.push('premier_competiteur')
  }

  if (!alreadyUnlocked.has('centenaire')) {
    if (gamesPlayed >= 100) toUnlock.push('centenaire')
  }

  // Achievements temps-réel (nécessitent le contexte de la partie courante)
  if (!alreadyUnlocked.has('serie_de_feu')) {
    if ((context?.maxStreak ?? 0) >= 10) toUnlock.push('serie_de_feu')
  }

  if (!alreadyUnlocked.has('perfectionniste')) {
    if (context?.mode === 'normal' && context?.score === 10) toUnlock.push('perfectionniste')
  }

  if (toUnlock.length === 0) return []

  // 4. Insérer les nouveaux achievements (upsert pour éviter les doublons en race condition)
  const { error: insertError } = await supabase
    .from('user_achievements')
    .upsert(
      toUnlock.map(id => ({ user_id: userId, achievement_id: id })),
      { onConflict: 'user_id,achievement_id', ignoreDuplicates: true }
    )
  if (insertError) throw new AppError('db_error', insertError.message)

  // 5. Retourner les nouveaux achievements débloqués
  return toUnlock.map(id => ({
    ...ACHIEVEMENT_MAP[id],
    unlocked: true,
    unlocked_at: new Date().toISOString(),
    progress: null,
  }))
}
