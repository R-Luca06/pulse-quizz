import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, type Transition } from 'framer-motion'
import { useAuth } from '../../hooks/useAuth'
import { getUserAchievements } from '../../services/achievements'
import { updateFeaturedBadges } from '../../services/profile'
import { supabase } from '../../services/supabase'
import { BADGE_COLOR_HEX } from '../../constants/achievementColors'
import type { AchievementId, AchievementWithStatus } from '../../types/quiz'

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

// ─── Couleurs par achievement ──────────────────────────────────────────────────

const ACHIEVEMENT_COLORS: Record<AchievementId, { text: string; progress: string; glow: string }> = {
  // Compte
  premiers_pas:          { text: 'text-emerald-400', progress: 'bg-emerald-500',  glow: 'shadow-emerald-500/20' },
  // Volume
  coup_d_envoi:          { text: 'text-emerald-400', progress: 'bg-emerald-500',  glow: 'shadow-emerald-500/20' },
  pris_au_jeu:           { text: 'text-teal-400',    progress: 'bg-teal-500',     glow: 'shadow-teal-500/20'    },
  accro:                 { text: 'text-cyan-400',    progress: 'bg-cyan-500',     glow: 'shadow-cyan-500/20'    },
  centenaire:            { text: 'text-amber-400',   progress: 'bg-amber-400',    glow: 'shadow-amber-400/20'   },
  marathonien:           { text: 'text-orange-400',  progress: 'bg-orange-500',   glow: 'shadow-orange-500/20'  },
  // Compétitif
  premier_competiteur:   { text: 'text-sky-400',     progress: 'bg-sky-500',      glow: 'shadow-sky-500/20'     },
  combattant:            { text: 'text-orange-400',  progress: 'bg-orange-500',   glow: 'shadow-orange-500/20'  },
  gladiateur:            { text: 'text-red-400',     progress: 'bg-red-500',      glow: 'shadow-red-500/20'     },
  legende_de_lareme:     { text: 'text-rose-400',    progress: 'bg-rose-500',     glow: 'shadow-rose-500/20'    },
  // Séries
  serie_de_feu:          { text: 'text-orange-400',  progress: 'bg-orange-500',   glow: 'shadow-orange-500/20'  },
  inferno:               { text: 'text-red-400',     progress: 'bg-red-500',      glow: 'shadow-red-500/20'     },
  inarretable:           { text: 'text-rose-400',    progress: 'bg-rose-500',     glow: 'shadow-rose-500/20'    },
  transcendant:          { text: 'text-violet-400',  progress: 'bg-violet-500',   glow: 'shadow-violet-500/20'  },
  // Rapidité
  vif:                   { text: 'text-sky-400',     progress: 'bg-sky-500',      glow: 'shadow-sky-500/20'     },
  foudroyant:            { text: 'text-blue-400',    progress: 'bg-blue-500',     glow: 'shadow-blue-500/20'    },
  supersonique:          { text: 'text-indigo-400',  progress: 'bg-indigo-500',   glow: 'shadow-indigo-500/20'  },
  instinct_pur:          { text: 'text-violet-400',  progress: 'bg-violet-500',   glow: 'shadow-violet-500/20'  },
  // Perfection
  perfectionniste:       { text: 'text-violet-400',  progress: 'bg-violet-500',   glow: 'shadow-violet-500/20'  },
  // Points
  rookie:                { text: 'text-slate-400',   progress: 'bg-slate-500',    glow: 'shadow-slate-500/20'   },
  challenger:            { text: 'text-emerald-400', progress: 'bg-emerald-500',  glow: 'shadow-emerald-500/20' },
  performeur:            { text: 'text-teal-400',    progress: 'bg-teal-500',     glow: 'shadow-teal-500/20'    },
  chasseur_de_points:    { text: 'text-cyan-400',    progress: 'bg-cyan-500',     glow: 'shadow-cyan-500/20'    },
  expert:                { text: 'text-blue-400',    progress: 'bg-blue-500',     glow: 'shadow-blue-500/20'    },
  maitre:                { text: 'text-violet-400',  progress: 'bg-violet-500',   glow: 'shadow-violet-500/20'  },
  grand_maitre:          { text: 'text-purple-400',  progress: 'bg-purple-500',   glow: 'shadow-purple-500/20'  },
  legende:               { text: 'text-amber-400',   progress: 'bg-amber-400',    glow: 'shadow-amber-400/20'   },
  mythique:              { text: 'text-yellow-400',  progress: 'bg-yellow-400',   glow: 'shadow-yellow-400/20'  },
  // Exploration
  touche_a_tout:         { text: 'text-teal-400',    progress: 'bg-teal-500',     glow: 'shadow-teal-500/20'    },
  polyvalent:            { text: 'text-purple-400',  progress: 'bg-purple-500',   glow: 'shadow-purple-500/20'  },
  // Classement
  dans_l_elite:          { text: 'text-slate-400',   progress: 'bg-slate-500',    glow: 'shadow-slate-500/20'   },
  reconnu:               { text: 'text-sky-400',     progress: 'bg-sky-500',      glow: 'shadow-sky-500/20'     },
  les_25:                { text: 'text-blue-400',    progress: 'bg-blue-500',     glow: 'shadow-blue-500/20'    },
  les_meilleurs:         { text: 'text-violet-400',  progress: 'bg-violet-500',   glow: 'shadow-violet-500/20'  },
  sur_le_podium:         { text: 'text-amber-400',   progress: 'bg-amber-400',    glow: 'shadow-amber-400/20'   },
  sans_rival:            { text: 'text-yellow-400',  progress: 'bg-yellow-400',   glow: 'shadow-yellow-400/20'  },
  // Personnalisation
  premier_pin:           { text: 'text-violet-400',  progress: 'bg-violet-500',   glow: 'shadow-violet-500/20'  },
  collectionneur:        { text: 'text-purple-400',  progress: 'bg-purple-500',   glow: 'shadow-purple-500/20'  },
  reinvention:           { text: 'text-pink-400',    progress: 'bg-pink-500',     glow: 'shadow-pink-500/20'    },
  nouveau_visage:        { text: 'text-rose-400',    progress: 'bg-rose-500',     glow: 'shadow-rose-500/20'    },
  mon_histoire:          { text: 'text-fuchsia-400', progress: 'bg-fuchsia-500',  glow: 'shadow-fuchsia-500/20' },
}


// ─── IDs des achievements avec barres de progression ──────────────────────────

const VOLUME_IDS   = new Set<AchievementId>(['coup_d_envoi', 'pris_au_jeu', 'accro', 'centenaire', 'marathonien'])
const COMP_IDS     = new Set<AchievementId>(['combattant', 'gladiateur', 'legende_de_lareme'])
const SCORE_IDS    = new Set<AchievementId>(['rookie', 'challenger', 'performeur', 'chasseur_de_points', 'expert', 'maitre', 'grand_maitre', 'legende', 'mythique'])

function enrichProgress(
  achievements: AchievementWithStatus[],
  data: { gamesPlayed: number; compGamesPlayed: number; compBestScore: number; categoriesPlayed: number },
): AchievementWithStatus[] {
  return achievements.map(a => {
    if (a.unlocked || a.progress === null) return a
    if (VOLUME_IDS.has(a.id))  return { ...a, progress: { current: data.gamesPlayed,      total: a.progress.total } }
    if (COMP_IDS.has(a.id))    return { ...a, progress: { current: data.compGamesPlayed,   total: a.progress.total } }
    if (SCORE_IDS.has(a.id))   return { ...a, progress: { current: data.compBestScore,     total: a.progress.total } }
    if (a.id === 'touche_a_tout') return { ...a, progress: { current: data.categoriesPlayed, total: a.progress.total } }
    return a
  })
}

function getStatus(a: AchievementWithStatus): AchievementStatus {
  if (a.unlocked) return 'unlocked'
  if (a.progress !== null && a.progress.current > 0) return 'in_progress'
  return 'locked'
}

// ─── Card ─────────────────────────────────────────────────────────────────────

type CardPendingPhase = 'idle' | 'receptive' | 'inserted'

const PinIcon = ({ filled }: { filled: boolean }) => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="17" x2="12" y2="22"/>
    <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"/>
  </svg>
)

function AchievementCard({ achievement, pendingId, onBadgeReady, isPinned, canPin, onTogglePin }: {
  achievement: AchievementWithStatus
  pendingId?: AchievementId | null
  onBadgeReady?: (rect: DOMRect) => void
  isPinned: boolean
  canPin: boolean
  onTogglePin: (id: AchievementId) => void
}) {
  const colors = ACHIEVEMENT_COLORS[achievement.id]
  const status = getStatus(achievement)
  const isLocked = status === 'locked'
  const hex = BADGE_COLOR_HEX[achievement.id]
  const [pendingPhase, setPendingPhase] = useState<CardPendingPhase>('idle')
  const badgeContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (pendingId !== achievement.id) {
      const t = setTimeout(() => setPendingPhase('idle'), 0)
      return () => clearTimeout(t)
    }
    const t0 = setTimeout(() => setPendingPhase('receptive'), 0)
    // 1400ms ≈ quand le badge overlay atterrit (rect lu à 650ms + vol 750ms)
    const t1 = setTimeout(() => setPendingPhase('inserted'), 1400)
    const t2 = setTimeout(() => setPendingPhase('idle'), 1400 + 700)
    return () => { clearTimeout(t0); clearTimeout(t1); clearTimeout(t2) }
  }, [pendingId, achievement.id])

  // Scroll la card en vue + signale la position du badge au parent.
  // Attend la fin de la transition de page ET du scroll smooth (750ms).
  useEffect(() => {
    if (pendingId !== achievement.id) return
    // Centrer immédiatement la card dans la zone scrollable
    badgeContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    // Lire le rect après que le scroll et la transition de page sont terminés
    const t = setTimeout(() => {
      if (badgeContainerRef.current) {
        onBadgeReady?.(badgeContainerRef.current.getBoundingClientRect())
      }
    }, 750)
    return () => clearTimeout(t)
  }, [pendingId, achievement.id, onBadgeReady])

  const isPending = pendingPhase !== 'idle'
  const isReceptive = pendingPhase === 'receptive'

  // Transition adaptée selon la phase (pas de TypeScript error sur le type)
  const cardTransition: Transition = pendingPhase === 'inserted'
    ? { duration: 0.55 }
    : { type: 'spring', stiffness: 280, damping: 22 }

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
      style={{
        // Bordure couleur propre à l'achievement (inline car Tailwind ne supporte pas les valeurs dynamiques)
        ...(isPending
          ? { borderColor: `${hex}90`, boxShadow: `0 0 22px ${hex}70, 0 0 45px ${hex}28` }
          : status === 'unlocked'
            ? { borderColor: `${hex}55` }
            : status === 'in_progress'
              ? { borderColor: `${hex}40` }
              : {}),
      }}
      className={[
        'relative flex min-h-[160px] flex-col items-center gap-3 rounded-xl border p-4 text-center transition-colors',
        isLocked
          ? 'border-white/[0.06] bg-white/[0.02]'
          : status === 'unlocked'
            ? `bg-game-card shadow-md ${colors.glow}`
            : 'bg-game-card/70',
      ].join(' ')}
    >
      {/* Anneau de pulse pendant la phase réceptive */}
      <AnimatePresence>
        {pendingPhase === 'receptive' && (
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
              style={{ border: `2px solid ${hex}`, boxShadow: `0 0 12px ${hex}60` }}
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
            style={{ backgroundColor: `${hex}25` }}
          />
        )}
      </AnimatePresence>

      {/* Bouton pin — visible seulement si débloqué */}
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

      {/* Badge hexagone */}
      <div className="relative mt-1 shrink-0">
        <div ref={badgeContainerRef} className="relative flex items-center justify-center" style={{ width: 52, height: 58 }}>
          <svg viewBox="0 0 64 72" className="absolute inset-0 h-full w-full" fill="none">
            {isLocked && !isReceptive ? (
              <path
                d="M32 2 L62 20 L62 52 L32 70 L2 52 L2 20 Z"
                fill="rgba(255,255,255,0.03)"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="2"
              />
            ) : (
              <>
                <defs>
                  <linearGradient id={`grad-${achievement.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.22)" />
                    <stop offset="100%" stopColor="rgba(0,0,0,0.15)" />
                  </linearGradient>
                </defs>
                <path
                  d="M32 2 L62 20 L62 52 L32 70 L2 52 L2 20 Z"
                  fill={isReceptive ? `${hex}22` : status === 'in_progress' ? `${hex}44` : hex}
                  stroke={isReceptive ? `${hex}90` : 'rgba(255,255,255,0.15)'}
                  strokeWidth={isReceptive ? '2' : '1'}
                />
                {!isReceptive && (
                  <path
                    d="M32 2 L62 20 L62 52 L32 70 L2 52 L2 20 Z"
                    fill={`url(#grad-${achievement.id})`}
                  />
                )}
              </>
            )}
          </svg>
          {/* Icône : cachée en phase réceptive, s'anime en phase inserted */}
          <motion.span
            className={['relative z-10 text-xl leading-none select-none', isLocked && !isReceptive ? 'opacity-20 grayscale' : ''].join(' ')}
            animate={
              isReceptive
                ? { opacity: 0, scale: 0.2 }
                : pendingPhase === 'inserted'
                  ? { opacity: 1, scale: [0.2, 1.5, 1] }
                  : { opacity: 1, scale: 1 }
            }
            transition={{ duration: 0.45, ease: 'easeOut' }}
          >
            {achievement.icon}
          </motion.span>
        </div>

        {status === 'unlocked' && (
          <div className={`absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full border border-game-bg text-[8px] font-black ${colors.text} bg-game-card`}>
            ✓
          </div>
        )}
      </div>

      {/* Texte */}
      <div className="flex flex-1 flex-col gap-1 px-0.5">
        <p className={['text-xs font-bold leading-tight', isLocked ? 'text-white/25' : 'text-white'].join(' ')}>
          {achievement.name}
        </p>
        <p className={['text-[10px] leading-snug', isLocked ? 'text-white/15' : 'text-white/40'].join(' ')}>
          {achievement.description}
        </p>
      </div>

      {/* Bas de card */}
      <div className="w-full">
        {status === 'unlocked' ? (
          <span className={`inline-block rounded-full px-2 py-0.5 text-[9px] font-semibold ${colors.text} bg-white/5`}>
            Accompli
          </span>
        ) : achievement.progress !== null ? (
          <div className="flex flex-col gap-1">
            <div className="h-0.5 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className={`h-full rounded-full transition-all ${isLocked ? 'bg-white/12' : colors.progress}`}
                style={{ width: `${Math.min(100, (achievement.progress.current / achievement.progress.total) * 100)}%` }}
              />
            </div>
            <p className={`text-[9px] font-semibold tabular-nums ${isLocked ? 'text-white/20' : colors.text}`}>
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
  const { user, profile, setLocalFeaturedBadges, triggerAchievementCheck } = useAuth()
  const [achievements, setAchievements] = useState<AchievementWithStatus[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterKey>('all')
  const [featuredBadges, setFeaturedBadges] = useState<string[]>([])
  const [pinSaving, setPinSaving] = useState(false)

  // Sync featured badges from profile
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
        : featuredBadges  // max atteint, ne rien faire

    if (next === featuredBadges) return
    // Optimistic update
    setFeaturedBadges(next)
    setLocalFeaturedBadges(next)
    if (pinSaving) return
    setPinSaving(true)
    try {
      await updateFeaturedBadges(user.id, next)
      // Vérifier les achievements liés au pin (premier_pin, collectionneur)
      triggerAchievementCheck().catch(console.error)
    } catch {
      // Revert on error
      setFeaturedBadges(featuredBadges)
      setLocalFeaturedBadges(featuredBadges)
    } finally {
      setPinSaving(false)
    }
  }

  useEffect(() => {
    if (!user) return
    let cancelled = false
    setLoading(true)
    setError(null)

    async function load() {
      try {
        const [achievementsData, globalStatsResult, compEntryResult, userStatsResult] = await Promise.all([
          getUserAchievements(user!.id),
          supabase.from('user_global_stats').select('games_played, comp_games_played').eq('user_id', user!.id).maybeSingle(),
          supabase.from('leaderboard').select('score').eq('user_id', user!.id).eq('mode', 'compétitif').maybeSingle(),
          supabase.from('user_stats').select('category').eq('user_id', user!.id).eq('mode', 'normal').neq('category', 'all').limit(20),
        ])

        type GlobalRow = { games_played: number; comp_games_played: number }
        const gamesPlayed     = (globalStatsResult.data as GlobalRow | null)?.games_played ?? 0
        const compGamesPlayed = (globalStatsResult.data as GlobalRow | null)?.comp_games_played ?? 0
        const compBestScore   = (compEntryResult.data as { score: number } | null)?.score ?? 0
        const categoriesPlayed = new Set(((userStatsResult.data ?? []) as { category: string }[]).map(r => r.category)).size

        const enriched = enrichProgress(achievementsData, { gamesPlayed, compGamesPlayed, compBestScore, categoriesPlayed })
        if (!cancelled) setAchievements(enriched)
      } catch {
        if (!cancelled) setError('Impossible de charger les achievements.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [user])

  // Filtre puis tri : accomplis → en cours → non débutés
  const filtered = achievements
    .filter(a => {
      if (filter === 'all') return true
      return getStatus(a) === filter
    })
    .sort((a, b) => STATUS_ORDER[getStatus(a)] - STATUS_ORDER[getStatus(b)])

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

      {/* Body : filtres à gauche + grille à droite */}
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
              {user && (
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
              )}

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
