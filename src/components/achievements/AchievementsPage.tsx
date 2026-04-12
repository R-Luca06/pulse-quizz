import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, type Transition } from 'framer-motion'
import { useAuth } from '../../hooks/useAuth'
import { getUserAchievements } from '../../services/achievements'
import { supabase } from '../../services/supabase'
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
  premiers_pas:        { text: 'text-emerald-400', progress: 'bg-emerald-500', glow: 'shadow-emerald-500/20' },
  premier_competiteur: { text: 'text-sky-400',     progress: 'bg-sky-500',     glow: 'shadow-sky-500/20'     },
  serie_de_feu:        { text: 'text-orange-400',  progress: 'bg-orange-500',  glow: 'shadow-orange-500/20'  },
  perfectionniste:     { text: 'text-violet-400',  progress: 'bg-violet-500',  glow: 'shadow-violet-500/20'  },
  centenaire:          { text: 'text-amber-400',   progress: 'bg-amber-400',   glow: 'shadow-amber-400/20'   },
}

const BADGE_COLOR_HEX: Record<AchievementId, string> = {
  premiers_pas:        '#10b981',
  premier_competiteur: '#0ea5e9',
  serie_de_feu:        '#f97316',
  perfectionniste:     '#8b5cf6',
  centenaire:          '#f59e0b',
}

function getStatus(a: AchievementWithStatus): AchievementStatus {
  if (a.unlocked) return 'unlocked'
  if (a.progress !== null && a.progress.current > 0) return 'in_progress'
  return 'locked'
}

// ─── Card ─────────────────────────────────────────────────────────────────────

type CardPendingPhase = 'idle' | 'receptive' | 'inserted'

function AchievementCard({ achievement, pendingId, onBadgeReady }: { achievement: AchievementWithStatus; pendingId?: AchievementId | null; onBadgeReady?: (rect: DOMRect) => void }) {
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

  // Signale la position du badge au parent — attend la fin de la transition
  // de page (initial y:40 → y:0, delay:0.1s + duration:0.5s = 600ms)
  useEffect(() => {
    if (pendingId !== achievement.id) return
    const t = setTimeout(() => {
      if (badgeContainerRef.current) {
        onBadgeReady?.(badgeContainerRef.current.getBoundingClientRect())
      }
    }, 650)
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
            : {}),
      }}
      className={[
        'relative flex min-h-[160px] flex-col items-center gap-3 rounded-xl border p-4 text-center transition-colors',
        isLocked
          ? 'border-white/[0.06] bg-white/[0.02]'
          : status === 'unlocked'
            ? `bg-game-card shadow-md ${colors.glow}`
            : 'border-white/[0.07] bg-game-card/50',
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
        {achievement.progress !== null ? (
          <div className="flex flex-col gap-1">
            <div className="h-0.5 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className={`h-full rounded-full transition-all ${isLocked ? 'bg-white/12' : colors.progress}`}
                style={{ width: `${Math.min(100, (achievement.progress.current / achievement.progress.total) * 100)}%` }}
              />
            </div>
            <p className={`text-[9px] font-semibold tabular-nums ${isLocked ? 'text-white/20' : colors.text}`}>
              {achievement.progress.current} / {achievement.progress.total}
            </p>
          </div>
        ) : status === 'unlocked' ? (
          <span className={`inline-block rounded-full px-2 py-0.5 text-[9px] font-semibold ${colors.text} bg-white/5`}>
            Accompli
          </span>
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
  const { user } = useAuth()
  const [achievements, setAchievements] = useState<AchievementWithStatus[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterKey>('all')

  useEffect(() => {
    if (!user) return
    let cancelled = false
    setLoading(true)
    setError(null)

    async function load() {
      try {
        const data = await getUserAchievements(user!.id)
        const gamesPlayedResult = await supabase
          .from('user_global_stats')
          .select('games_played')
          .eq('user_id', user!.id)
          .maybeSingle()
        const gamesPlayed = (gamesPlayedResult.data as { games_played: number } | null)?.games_played ?? 0
        const enriched = data.map(a =>
          a.id === 'centenaire' && !a.unlocked && a.progress !== null
            ? { ...a, progress: { ...a.progress, current: gamesPlayed } }
            : a
        )
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
              <div className="grid grid-cols-3 gap-3">
                {filtered.map(a => (
                  <AchievementCard key={a.id} achievement={a} pendingId={pendingAchievementId} onBadgeReady={onBadgeReady} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  )
}
