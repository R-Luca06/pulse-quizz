import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence, type Transition } from 'framer-motion'
import { useAuth } from '../../hooks/useAuth'
import { getUserAchievements } from '../../services/achievements'
import { updateFeaturedBadges } from '../../services/profile'
import { supabase } from '../../services/supabase'
import { BADGE_TIER, TIER_GLOW_COLOR } from '../../constants/achievementColors'
import MiniBadge from '../shared/MiniBadge'
import type { AchievementId, AchievementTier, AchievementWithStatus } from '../../types/quiz'

interface Props {
  onBack?: () => void
  hideBack?: boolean
  pendingAchievementId?: AchievementId | null
  onBadgeReady?: (rect: DOMRect) => void
}

// ─── Types ────────────────────────────────────────────────────────────────────

type AchievementStatus = 'unlocked' | 'in_progress' | 'locked'
type FilterKey = 'all' | 'unlocked' | 'in_progress' | 'locked'

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all',         label: 'Tous' },
  { key: 'unlocked',    label: 'Accomplis' },
  { key: 'in_progress', label: 'En cours' },
  { key: 'locked',      label: 'Non débutés' },
]

const STATUS_ORDER: Record<AchievementStatus, number> = { unlocked: 0, in_progress: 1, locked: 2 }
const TIER_ORDER:   Record<AchievementTier,    number> = { legendary: 0, epic: 1, rare: 2, common: 3 }

// Labels de rareté affichés en haut à gauche des cards
const TIER_LABEL: Record<AchievementTier, string> = {
  common:    'Commun',
  rare:      'Rare',
  epic:      'Épique',
  legendary: 'Légendaire',
}

// Couleur du dot de rareté par tier
const TIER_DOT_COLOR: Record<AchievementTier, string> = {
  common:    'rgba(255,255,255,0.30)',
  rare:      'rgba(255,255,255,0.65)',
  epic:      '#a78bfa',
  legendary: '#f59e0b',
}

// ─── IDs des achievements avec barres de progression ──────────────────────────

const VOLUME_IDS = new Set<AchievementId>(['coup_d_envoi', 'pris_au_jeu', 'accro', 'centenaire', 'marathonien'])
const COMP_IDS   = new Set<AchievementId>(['combattant', 'gladiateur', 'legende_de_lareme'])
const SCORE_IDS  = new Set<AchievementId>(['rookie', 'challenger', 'performeur', 'chasseur_de_points', 'expert', 'maitre', 'grand_maitre', 'legende', 'mythique'])

function enrichProgress(
  achievements: AchievementWithStatus[],
  data: { gamesPlayed: number; compGamesPlayed: number; compBestScore: number; categoriesPlayed: number },
): AchievementWithStatus[] {
  return achievements.map(a => {
    if (a.unlocked || a.progress === null) return a
    if (VOLUME_IDS.has(a.id))     return { ...a, progress: { current: data.gamesPlayed,      total: a.progress.total } }
    if (COMP_IDS.has(a.id))       return { ...a, progress: { current: data.compGamesPlayed,   total: a.progress.total } }
    if (SCORE_IDS.has(a.id))      return { ...a, progress: { current: data.compBestScore,     total: a.progress.total } }
    if (a.id === 'touche_a_tout') return { ...a, progress: { current: data.categoriesPlayed,  total: a.progress.total } }
    return a
  })
}

function getStatus(a: AchievementWithStatus): AchievementStatus {
  if (a.unlocked) return 'unlocked'
  if (a.progress !== null && a.progress.current > 0) return 'in_progress'
  return 'locked'
}

// ─── Pin icon ─────────────────────────────────────────────────────────────────

const PinIcon = ({ filled }: { filled: boolean }) => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="17" x2="12" y2="22"/>
    <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"/>
  </svg>
)

// ─── Card ─────────────────────────────────────────────────────────────────────

type CardPendingPhase = 'idle' | 'receptive' | 'inserted'

function AchievementCard({ achievement, pendingId, onBadgeReady, isPinned, canPin, onTogglePin }: {
  achievement: AchievementWithStatus
  pendingId?: AchievementId | null
  onBadgeReady?: (rect: DOMRect) => void
  isPinned: boolean
  canPin: boolean
  onTogglePin: (id: AchievementId) => void
}) {
  const status   = getStatus(achievement)
  const isLocked = status === 'locked'
  const tier     = BADGE_TIER[achievement.id]
  const tierLabel = TIER_LABEL[tier]
  // Couleur glow pour les animations de pending (insertion badge)
  const glowColor = TIER_GLOW_COLOR[tier]

  const [pendingPhase, setPendingPhase] = useState<CardPendingPhase>('idle')
  const badgeContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (pendingId !== achievement.id) {
      const t = setTimeout(() => setPendingPhase('idle'), 0)
      return () => clearTimeout(t)
    }
    const t0 = setTimeout(() => setPendingPhase('receptive'), 0)
    const t1 = setTimeout(() => setPendingPhase('inserted'), 1400)
    const t2 = setTimeout(() => setPendingPhase('idle'), 1400 + 700)
    return () => { clearTimeout(t0); clearTimeout(t1); clearTimeout(t2) }
  }, [pendingId, achievement.id])

  useEffect(() => {
    if (pendingId !== achievement.id) return
    badgeContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    const t = setTimeout(() => {
      if (badgeContainerRef.current) {
        onBadgeReady?.(badgeContainerRef.current.getBoundingClientRect())
      }
    }, 750)
    return () => clearTimeout(t)
  }, [pendingId, achievement.id, onBadgeReady])

  const isPending   = pendingPhase !== 'idle'
  const isReceptive = pendingPhase === 'receptive'

  const cardTransition: Transition = pendingPhase === 'inserted'
    ? { duration: 0.55 }
    : { type: 'spring', stiffness: 280, damping: 22 }

  // ── Card class + style per status ─────────────────────────────────────────
  // Durant l'animation d'insertion, la card se comporte comme si le badge était débloqué
  const effectivelyUnlocked = status === 'unlocked' || isPending
  const cardClass = [
    'relative flex min-h-[160px] flex-col items-center gap-3 rounded-xl border p-4 text-center transition-colors',
    !effectivelyUnlocked && isLocked
      ? 'border-white/[0.06] bg-white/[0.02]'
      : !effectivelyUnlocked && status === 'in_progress'
        ? 'border-white/[0.18] bg-game-card/55'
        : 'border-emerald-500/40 bg-game-card',
  ].join(' ')

  // Inline style uniquement pour l'état pending (animation d'insertion)
  const cardStyle: React.CSSProperties = isPending
    ? { borderColor: `${glowColor}90`, boxShadow: `0 0 22px ${glowColor}70, 0 0 45px ${glowColor}28` }
    : {}

  return (
    <motion.div
      animate={
        pendingPhase === 'inserted'
          ? { x: [0, -7, 7, -5, 5, -3, 3, 0], scale: [1.08, 1] }
          : pendingPhase === 'receptive'
            ? { scale: 1.06, x: 0 }
            : { scale: 1, x: 0 }
      }
      transition={cardTransition}
      style={cardStyle}
      className={cardClass}
    >
      {/* Anneau de pulse (réceptif) */}
      <AnimatePresence>
        {isReceptive && (
          <motion.div
            key="pulse"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute inset-0 rounded-xl"
          >
            <motion.div
              animate={{ scale: [1, 1.12], opacity: [0.7, 0] }}
              transition={{ duration: 1.1, repeat: Infinity, ease: 'easeOut' }}
              className="absolute inset-0 rounded-xl"
              style={{ border: `2px solid ${glowColor}`, boxShadow: `0 0 12px ${glowColor}60` }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Flash d'insertion */}
      <AnimatePresence>
        {pendingPhase === 'inserted' && (
          <motion.div
            key="flash"
            initial={{ opacity: 0.8 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="pointer-events-none absolute inset-0 rounded-xl"
            style={{ backgroundColor: `${glowColor}25` }}
          />
        )}
      </AnimatePresence>

      {/* Indicateur de rareté — top-left, discret, visible pour tous les tiers */}
      <div className={['absolute left-2 top-2 flex items-center gap-1', isLocked ? 'opacity-25' : 'opacity-45'].join(' ')}>
        <div
          className="h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: TIER_DOT_COLOR[tier] }}
        />
        <span className="text-[8px] font-medium uppercase tracking-wide text-white/55">
          {tierLabel}
        </span>
      </div>

      {/* Bouton pin */}
      {status === 'unlocked' && (
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={e => { e.stopPropagation(); onTogglePin(achievement.id) }}
          disabled={!isPinned && !canPin}
          title={isPinned ? 'Retirer du leaderboard' : canPin ? 'Afficher dans le leaderboard' : 'Maximum 3 badges'}
          className={[
            'absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full transition-colors',
            isPinned
              ? 'bg-neon-violet/20 text-neon-violet hover:bg-neon-violet/30'
              : canPin
                ? 'bg-white/5 text-white/25 hover:bg-white/10 hover:text-white/60'
                : 'cursor-not-allowed text-white/10',
          ].join(' ')}
        >
          <PinIcon filled={isPinned} />
        </motion.button>
      )}

      {/* Badge — utilise MiniBadge (source unique) avec animations de pending par-dessus */}
      <div className="relative mt-1 shrink-0">
        <div
          ref={badgeContainerRef}
          className="relative flex items-center justify-center"
          style={{ width: 52, height: 58 }}
        >
          {/* MiniBadge : toujours le même rendu, stroke par tier */}
          <div
            className={[
              'absolute inset-0',
              // Masqué en phase réceptive (l'overlay de pending le remplace)
              isReceptive ? 'opacity-0' : '',
            ].join(' ')}
          >
            <MiniBadge
              achievementId={achievement.id}
              size={52}
              unlocked={effectivelyUnlocked}
            />
          </div>

          {/* Overlay pending : phase réceptive (hexagone vide coloré) */}
          {isReceptive && (
            <svg viewBox="0 0 64 72" className="absolute inset-0 h-full w-full" fill="none">
              <path
                d="M32 2 L62 20 L62 52 L32 70 L2 52 L2 20 Z"
                fill={`${glowColor}22`}
                stroke={`${glowColor}90`}
                strokeWidth="2"
              />
            </svg>
          )}
        </div>

        {/* Pastille ✓ verte — identique pour tous les badges débloqués */}
        {effectivelyUnlocked && (
          <div className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full border border-game-bg bg-emerald-500/20 text-[8px] font-black text-emerald-400">
            ✓
          </div>
        )}

        {/* Animation icône lors de l'insertion */}
        <AnimatePresence>
          {pendingPhase === 'inserted' && (
            <motion.div
              key="icon-pop"
              className="pointer-events-none absolute inset-0 flex items-center justify-center"
              initial={{ scale: 0.2, opacity: 0 }}
              animate={{ scale: [0.2, 1.5, 1], opacity: 1 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
            >
              <span className="text-xl leading-none select-none">{achievement.icon}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Texte */}
      <div className="flex flex-1 flex-col gap-1 px-0.5">
        <p className={['text-xs font-bold leading-tight', (isLocked && !isPending) ? 'text-white/25' : 'text-white'].join(' ')}>
          {achievement.name}
        </p>
        <p className={['text-[10px] leading-snug', (isLocked && !isPending) ? 'text-white/15' : 'text-white/40'].join(' ')}>
          {achievement.description}
        </p>
      </div>

      {/* Bas de card */}
      <div className="w-full">
        {effectivelyUnlocked ? (
          <span className="inline-block rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-semibold text-emerald-400">
            Accompli
          </span>
        ) : achievement.progress !== null ? (
          <div className="flex flex-col gap-1">
            {/* Barre de progression — style uniforme quelque soit l'achievement */}
            <div className="h-0.5 w-full overflow-hidden rounded-full bg-white/10">
              {achievement.progress.current > 0 && (
                <div
                  className="h-full rounded-full bg-white/55 transition-all"
                  style={{ width: `${Math.min(100, (achievement.progress.current / achievement.progress.total) * 100)}%` }}
                />
              )}
            </div>
            <p className="text-[9px] font-semibold tabular-nums text-white/28">
              {achievement.progress.current.toLocaleString('fr-FR')} / {achievement.progress.total.toLocaleString('fr-FR')}
            </p>
          </div>
        ) : (
          <span className="inline-block rounded-full bg-white/5 px-2 py-0.5 text-[9px] font-semibold text-white/18">
            Non débuté
          </span>
        )}
      </div>
    </motion.div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AchievementsPage({ onBack, hideBack = false, pendingAchievementId, onBadgeReady }: Props) {
  const { user, profile, setLocalFeaturedBadges, triggerAchievementCheck, statsRefreshKey } = useAuth()
  const [achievements, setAchievements] = useState<AchievementWithStatus[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterKey>('all')
  const [featuredBadges, setFeaturedBadges] = useState<string[]>([])
  const [pinSaving, setPinSaving] = useState(false)

  useEffect(() => {
    setFeaturedBadges(profile?.featured_badges ?? [])
  }, [profile?.featured_badges])

  async function handleTogglePin(id: AchievementId) {
    if (!user) return
    const already = featuredBadges.includes(id)
    const next = already
      ? featuredBadges.filter(b => b !== id)
      : featuredBadges.length < 3
        ? [...featuredBadges, id]
        : featuredBadges

    if (next === featuredBadges) return
    setFeaturedBadges(next)
    setLocalFeaturedBadges(next)
    if (pinSaving) return
    setPinSaving(true)
    try {
      await updateFeaturedBadges(user.id, next)
      triggerAchievementCheck().catch(console.error)
    } catch {
      setFeaturedBadges(featuredBadges)
      setLocalFeaturedBadges(featuredBadges)
    } finally {
      setPinSaving(false)
    }
  }

  const loadAchievements = useCallback(async (userId: string, silent = false) => {
    const [achievementsData, globalStatsResult, compEntryResult, userStatsResult] = await Promise.all([
      getUserAchievements(userId),
      supabase.from('user_global_stats').select('games_played, comp_games_played').eq('user_id', userId).maybeSingle(),
      supabase.from('leaderboard').select('score').eq('user_id', userId).eq('mode', 'compétitif').maybeSingle(),
      supabase.from('user_stats').select('category').eq('user_id', userId).eq('mode', 'normal').neq('category', 'all').limit(20),
    ])

    type GlobalRow = { games_played: number; comp_games_played: number }
    const gamesPlayed      = (globalStatsResult.data as GlobalRow | null)?.games_played ?? 0
    const compGamesPlayed  = (globalStatsResult.data as GlobalRow | null)?.comp_games_played ?? 0
    const compBestScore    = (compEntryResult.data as { score: number } | null)?.score ?? 0
    const categoriesPlayed = new Set(((userStatsResult.data ?? []) as { category: string }[]).map(r => r.category)).size

    const enriched = enrichProgress(achievementsData, { gamesPlayed, compGamesPlayed, compBestScore, categoriesPlayed })
    if (!silent) setLoading(false)
    setAchievements(enriched)
    return enriched
  }, [])

  useEffect(() => {
    if (!user) return
    let cancelled = false
    setLoading(true)
    setError(null)

    loadAchievements(user.id)
      .catch(() => { if (!cancelled) setError('Impossible de charger les achievements.') })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [user, loadAchievements])

  // Rechargement silencieux quand statsRefreshKey change (déclenché par handleAchievementsDone)
  // → permet d'afficher le badge comme débloqué après l'animation d'unlock
  useEffect(() => {
    if (!user || statsRefreshKey === 0) return
    loadAchievements(user.id, true).catch(console.error)
  }, [user, statsRefreshKey, loadAchievements])

  // Filtre + tri : débloqués (par rareté desc) → en cours → non débutés
  const filtered = achievements
    .filter(a => {
      if (filter === 'all') return true
      return getStatus(a) === filter
    })
    .sort((a, b) => {
      const statusDiff = STATUS_ORDER[getStatus(a)] - STATUS_ORDER[getStatus(b)]
      if (statusDiff !== 0) return statusDiff
      // Au sein de chaque groupe (débloqué / en cours / non débuté) : legendary d'abord
      return TIER_ORDER[BADGE_TIER[a.id]] - TIER_ORDER[BADGE_TIER[b.id]]
    })

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="flex min-h-screen flex-col bg-game-bg"
    >
      {/* Header navigation (standalone) */}
      {!hideBack && (
        <div className="flex items-center border-b border-game-border px-4 py-2.5">
          <button
            onClick={onBack}
            className="flex w-20 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-white/50 transition-colors hover:bg-white/5 hover:text-white"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Retour
          </button>
          <div className="flex flex-1 justify-center">
            <p className="text-sm text-white/40">Achievements</p>
          </div>
          <div className="w-20" />
        </div>
      )}

      {/* Hero header (dans ProfilePage) */}
      {hideBack && (
        <div className="relative overflow-hidden px-6 py-7 bg-gradient-to-br from-game-border/20 via-game-card/30 to-transparent">
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/[0.03] blur-3xl" />
          <div className="relative flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-amber-500/20 bg-amber-500/10 text-amber-400/60">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
                <path d="M4 22h16"/>
                <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
                <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
                <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
              </svg>
            </div>
            <div>
              <p className="text-lg font-bold text-white">Achievements</p>
              <p className="mt-0.5 text-xs text-white/35">Tes badges et ta progression</p>
            </div>
          </div>
        </div>
      )}

      {/* Body */}
      {!user ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-4 text-center">
          <div className="text-4xl">🏆</div>
          <p className="text-sm font-semibold text-white/60">Connecte-toi pour débloquer des achievements</p>
          <p className="text-xs text-white/30">Tes progrès seront sauvegardés dans ton compte</p>
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden">

          {/* Sidebar filtres */}
          <div className="flex w-36 shrink-0 flex-col gap-0.5 border-r border-game-border p-3">
            <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-white/20">
              Filtrer
            </p>
            {FILTERS.map(f => {
              const count = f.key === 'all'
                ? achievements.length
                : achievements.filter(a => getStatus(a) === f.key).length
              return (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={[
                    'flex items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs font-medium transition-colors',
                    filter === f.key
                      ? 'bg-neon-violet/10 text-neon-violet'
                      : 'text-white/35 hover:bg-white/5 hover:text-white/60',
                  ].join(' ')}
                >
                  <span>{f.label}</span>
                  <span className={['tabular-nums text-[10px]', filter === f.key ? 'text-neon-violet/70' : 'text-white/20'].join(' ')}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Grille */}
          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-neon-violet/30 border-t-neon-violet" />
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
                <p className="text-sm text-white/40">{error}</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
                <p className="text-sm text-white/30">Aucun résultat pour ce filtre</p>
              </div>
            ) : (
              <>
              {/* Indicateur badges épinglés */}
              <div className="mb-3 flex items-center gap-2">
                <div className="flex items-center gap-1.5 rounded-lg border border-neon-violet/20 bg-neon-violet/5 px-2.5 py-1.5">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-neon-violet/60">
                    <line x1="12" y1="17" x2="12" y2="22"/>
                    <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"/>
                  </svg>
                  <span className="text-[10px] font-semibold text-neon-violet/70">
                    Badges leaderboard
                  </span>
                  <span className={`text-[10px] font-black tabular-nums ${featuredBadges.length >= 3 ? 'text-neon-violet' : 'text-white/40'}`}>
                    {featuredBadges.length}/3
                  </span>
                </div>
                {pinSaving && (
                  <div className="h-3 w-3 animate-spin rounded-full border border-neon-violet/30 border-t-neon-violet/70" />
                )}
              </div>

              <div className="grid grid-cols-3 gap-3">
                {filtered.map(a => (
                  <AchievementCard
                    key={a.id}
                    achievement={a}
                    pendingId={pendingAchievementId}
                    onBadgeReady={onBadgeReady}
                    isPinned={featuredBadges.includes(a.id)}
                    canPin={featuredBadges.length < 3}
                    onTogglePin={handleTogglePin}
                  />
                ))}
              </div>
              </>
            )}
          </div>
        </div>
      )}
    </motion.div>
  )
}
