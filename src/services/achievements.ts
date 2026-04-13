import { supabase } from './supabase'
import { AppError } from './errors'
import { ACHIEVEMENTS, ACHIEVEMENT_MAP } from '../constants/achievements'
import { FR_CATEGORIES } from '../constants/quiz'
import type { AchievementId, AchievementWithStatus, GameMode } from '../types/quiz'

// Nombre de catégories distinctes (hors 'all') — 7 actuellement
const CATEGORY_COUNT = FR_CATEGORIES.filter(c => c.value !== 'all').length

// ─── Context optionnel pour les achievements temps-réel ───────────────────────

export interface AchievementContext {
  maxStreak?: number      // streak max atteint en cours de partie
  score?: number          // score final
  mode?: GameMode
  minAnswerTime?: number  // temps minimum d'une bonne réponse (secondes)
  userRank?: number | null // rang après soumission compétitive
}

// ─── Fetch ────────────────────────────────────────────────────────────────────

export async function getUserAchievements(userId: string): Promise<AchievementWithStatus[]> {
  const { data, error } = await supabase
    .from('user_achievements')
    .select('achievement_id, unlocked_at')
    .eq('user_id', userId)

  if (error) throw new AppError('db_error', error.message)

  const unlockedMap = new Map(
    (data ?? []).map((r: { achievement_id: string; unlocked_at: string }) => [r.achievement_id, r.unlocked_at])
  )

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
  context?: AchievementContext,
): Promise<AchievementWithStatus[]> {
  // 1. Achievements déjà débloqués
  const { data: existing, error: fetchError } = await supabase
    .from('user_achievements')
    .select('achievement_id')
    .eq('user_id', userId)
  if (fetchError) throw new AppError('db_error', fetchError.message)

  const alreadyUnlocked = new Set(
    (existing ?? []).map((r: { achievement_id: string }) => r.achievement_id)
  )

  // 2. Données DB en parallèle
  const [profileResult, globalStatsResult, compEntryResult, userStatsResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('created_at, featured_badges, username_changed, avatar_changed, description_changed')
      .eq('id', userId)
      .maybeSingle(),
    supabase
      .from('user_global_stats')
      .select('games_played, comp_games_played')
      .eq('user_id', userId)
      .maybeSingle(),
    supabase
      .from('leaderboard')
      .select('score')
      .eq('user_id', userId)
      .eq('mode', 'compétitif')
      .maybeSingle(),
    supabase
      .from('user_stats')
      .select('mode, category')
      .eq('user_id', userId)
      .limit(200),
  ])

  type ProfileRow = { created_at: string; featured_badges: string[]; username_changed: boolean; avatar_changed: boolean; description_changed: boolean }
  type GlobalRow  = { games_played: number; comp_games_played: number }

  const profileData      = profileResult.data as ProfileRow | null
  const gamesPlayed      = (globalStatsResult.data as GlobalRow | null)?.games_played ?? 0
  const compGamesPlayed  = (globalStatsResult.data as GlobalRow | null)?.comp_games_played ?? 0
  const compLeaderboard  = compEntryResult.data as { score: number } | null
  const featuredCount    = (profileData?.featured_badges ?? []).length

  // Score compétitif = max(meilleur leaderboard, score courant si comp)
  const compBestScore = Math.max(
    compLeaderboard?.score ?? 0,
    context?.mode === 'compétitif' ? (context.score ?? 0) : 0,
  )

  // Modes et catégories joués
  const statsRows    = (userStatsResult.data ?? []) as { mode: string; category: string }[]
  const hasNormalGame = statsRows.some(r => r.mode === 'normal') || context?.mode === 'normal'
  const hasCompGame   = compGamesPlayed >= 1 || compLeaderboard !== null || context?.mode === 'compétitif'
  const uniqueCategories = new Set(
    statsRows.filter(r => r.mode === 'normal' && r.category !== 'all').map(r => r.category)
  )

  // Rang compétitif — depuis contexte ou calcul lazy
  let effectiveRank: number | null = context?.userRank !== undefined ? context.userRank : null
  if (effectiveRank === null && compLeaderboard !== null) {
    const { count } = await supabase
      .from('leaderboard')
      .select('*', { count: 'exact', head: true })
      .eq('mode', 'compétitif')
      .gt('score', compLeaderboard.score)
    effectiveRank = (count ?? 0) + 1
  }

  // 3. Évaluer chaque achievement
  const toUnlock: AchievementId[] = []

  function check(id: AchievementId, condition: boolean) {
    if (!alreadyUnlocked.has(id) && condition) toUnlock.push(id)
  }

  // Compte
  check('premiers_pas', profileData !== null)

  // Volume
  check('coup_d_envoi',  gamesPlayed >= 1)
  check('pris_au_jeu',   gamesPlayed >= 10)
  check('accro',         gamesPlayed >= 50)
  check('centenaire',    gamesPlayed >= 100)
  check('marathonien',   gamesPlayed >= 500)

  // Compétitif
  check('premier_competiteur', hasCompGame)
  check('combattant',          compGamesPlayed >= 50)
  check('gladiateur',          compGamesPlayed >= 100)
  check('legende_de_lareme',   compGamesPlayed >= 1000)

  // Séries
  check('serie_de_feu',  (context?.maxStreak ?? 0) >= 10)
  check('inferno',       (context?.maxStreak ?? 0) >= 20)
  check('inarretable',   (context?.maxStreak ?? 0) >= 30)
  check('transcendant',  (context?.maxStreak ?? 0) >= 50)

  // Rapidité (une bonne réponse sous le seuil)
  const fastest = context?.minAnswerTime ?? Infinity
  check('vif',          fastest < 5)
  check('foudroyant',   fastest < 3)
  check('supersonique', fastest < 2)
  check('instinct_pur', fastest < 1)

  // Perfection
  check('perfectionniste', context?.mode === 'normal' && context?.score === 10)

  // Points compétitif
  check('rookie',              compBestScore >= 1000)
  check('challenger',          compBestScore >= 2000)
  check('performeur',          compBestScore >= 3000)
  check('chasseur_de_points',  compBestScore >= 5000)
  check('expert',              compBestScore >= 10000)
  check('maitre',              compBestScore >= 20000)
  check('grand_maitre',        compBestScore >= 30000)
  check('legende',             compBestScore >= 50000)
  check('mythique',            compBestScore >= 100000)

  // Exploration
  check('touche_a_tout', uniqueCategories.size >= CATEGORY_COUNT)
  check('polyvalent',    hasNormalGame && hasCompGame)

  // Classement
  if (effectiveRank !== null) {
    check('dans_l_elite',  effectiveRank <= 100)
    check('reconnu',       effectiveRank <= 50)
    check('les_25',        effectiveRank <= 25)
    check('les_meilleurs', effectiveRank <= 10)
    check('sur_le_podium', effectiveRank <= 3)
    check('sans_rival',    effectiveRank === 1)
  }

  // Personnalisation
  check('premier_pin',   featuredCount >= 1)
  check('collectionneur', featuredCount >= 3)
  check('reinvention',   profileData?.username_changed === true)
  check('nouveau_visage', profileData?.avatar_changed === true)
  check('mon_histoire',  profileData?.description_changed === true)

  if (toUnlock.length === 0) return []

  // 4. Insérer (upsert pour éviter les doublons en race condition)
  const { error: insertError } = await supabase
    .from('user_achievements')
    .upsert(
      toUnlock.map(id => ({ user_id: userId, achievement_id: id })),
      { onConflict: 'user_id,achievement_id', ignoreDuplicates: true },
    )
  if (insertError) throw new AppError('db_error', insertError.message)

  return toUnlock.map(id => ({
    ...ACHIEVEMENT_MAP[id],
    unlocked: true,
    unlocked_at: new Date().toISOString(),
    progress: null,
  }))
}
