import { useState, useEffect } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { useAuth } from '../../../contexts/AuthContext'
import { getUserRank } from '../../../services/leaderboard'
import { AvatarContainer } from '../../avatar'
import ConstellationBackground from '../ConstellationBackground'
import LeaderboardCard from '../LeaderboardCard'
import PlayerStatsCard from '../PlayerStatsCard'
import { CATEGORY_LABELS, DIFFICULTY_LABELS } from '../../../constants/quiz'
import type { GameSettings } from '../../../hooks/useSettings'

interface Props {
  isLaunching: boolean
  onShowStats: (tab?: 'stats' | 'leaderboard') => void
  settings: GameSettings
  onPlay: () => void
  onOpenSettings: () => void
}

// ── Mobile dock ────────────────────────────────────────────────────────────────

interface MobileDockProps {
  settings: GameSettings
  onPlay: () => void
  onOpenSettings: () => void
}

function MobileDock({ settings, onPlay, onOpenSettings }: MobileDockProps) {
  const isComp = settings.mode === 'compétitif'
  const categoryLabel = CATEGORY_LABELS[settings.category] ?? settings.category
  const difficultyLabel = DIFFICULTY_LABELS[settings.difficulty] ?? settings.difficulty

  return (
    <div className="shrink-0 px-4">
      <div
        className="flex items-center gap-3 rounded-2xl px-4 py-3"
        style={{
          background: 'rgba(13,13,22,0.88)',
          border: '1px solid rgba(139,92,246,0.22)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 0 40px rgba(139,92,246,0.12), 0 8px 32px rgba(0,0,0,0.6)',
        }}
      >
        {/* Gauche : mode (gros) + niveau · catégorie (petits) */}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          {isComp ? (
            <span className="text-[15px] font-black text-neon-violet">⚡ Compétitif</span>
          ) : (
            <span className="text-[15px] font-black text-neon-blue">Normal</span>
          )}
          <div className={`flex min-w-0 items-center gap-1.5 overflow-hidden transition-opacity duration-200 ${isComp ? 'opacity-35' : ''}`}>
            <span className={`shrink-0 text-[10px] font-semibold ${isComp ? 'text-white/30 line-through' : 'text-white/45'}`}>
              {isComp ? 'Aléatoire' : difficultyLabel}
            </span>
            <span className="shrink-0 text-[10px] text-white/20">·</span>
            <span className={`min-w-0 truncate text-[10px] font-semibold ${isComp ? 'text-white/30 line-through' : 'text-white/45'}`}>
              {isComp ? 'Aléatoire' : categoryLabel}
            </span>
          </div>
        </div>

        {/* Droite : bouton JOUER + icône settings */}
        <button
          type="button"
          onClick={onPlay}
          aria-label="Jouer"
          className="shrink-0 rounded-2xl px-7 py-2.5 text-sm font-black uppercase tracking-widest text-white transition-transform hover:scale-105 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neon-violet/60 active:scale-95"
          style={{
            background: 'linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%)',
            boxShadow: '0 0 20px rgba(139,92,246,0.45), 0 4px 14px rgba(0,0,0,0.5)',
          }}
        >
          Jouer
        </button>

        <button
          type="button"
          onClick={onOpenSettings}
          aria-label="Paramètres de la partie"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/40 transition-colors hover:border-neon-violet/40 hover:text-white/70 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neon-violet/60"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
      </div>
    </div>
  )
}

// ── Main ───────────────────────────────────────────────────────────────────────

export default function PodiumScene({ isLaunching, onShowStats, settings, onPlay, onOpenSettings }: Props) {
  const reduced = useReducedMotion()
  const { user, profile } = useAuth()
  const [rank, setRank] = useState<number | null>(null)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    getUserRank(user.id, 'fr').then(r => { if (!cancelled) setRank(r) }).catch(() => {})
    return () => { cancelled = true }
  }, [user])

  const floatAnimation = reduced
    ? undefined
    : {
        x: ['0vw', '10vw', '-8vw', '12vw', '-10vw', '6vw', '0vw'],
        y: ['0vh', '-8vh', '7vh', '-9vh', '6vh', '-5vh', '0vh'],
        rotate: [-2, 4, -3, 6, -5, 2, -2],
        scale: [1, 0.98, 1.02, 0.97, 1.01, 0.99, 1],
      }
  const floatTransition = {
    x: { duration: 68, repeat: Infinity, ease: 'easeInOut' },
    y: { duration: 32, repeat: Infinity, ease: 'easeInOut' },
    rotate: { duration: 22, repeat: Infinity, ease: 'easeInOut' },
    scale: { duration: 14, repeat: Infinity, ease: 'easeInOut' },
  }

  return (
    <div className="absolute inset-0 bg-game-bg">

      {/* ── Fond partagé ── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 30%, rgba(139, 92, 246, 0.18) 0%, rgba(59, 130, 246, 0.08) 40%, transparent 70%)',
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 left-1/2 h-96 w-[42rem] -translate-x-1/2 rounded-full bg-neon-violet/10 blur-3xl"
      />
      <ConstellationBackground />

      {/* ════════════════════════════════════════════════════
          MOBILE layout (< lg) : flex-col, avatar haut,
          dock inline, cards empilées + scroll
      ════════════════════════════════════════════════════ */}
      <div className="absolute inset-0 flex flex-col lg:hidden">

        {/* Zone avatar — portion haute, sous le header (pt-14) */}
        <motion.div
          className="flex shrink-0 items-center justify-center pt-14"
          style={{ height: 'calc(28vh + 56px)' }}
          animate={
            isLaunching
              ? { opacity: 0, scale: 0.85, transition: { duration: 0.25 } }
              : { opacity: 1, scale: 1 }
          }
        >
          <motion.div
            className="relative flex flex-col items-center gap-3"
            style={{ willChange: 'transform' }}
            animate={floatAnimation}
            transition={floatTransition}
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-full"
              style={{
                background:
                  'radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, rgba(139, 92, 246, 0.03) 50%, transparent 70%)',
                transform: 'scale(1.3)',
                zIndex: 0,
              }}
            />
            <div className="relative z-[1]">
              <AvatarContainer className="h-28 w-28" fontSize="3.5rem" />
            </div>
            <div className="relative z-[1] flex flex-col items-center gap-1 text-center">
              <span className="text-sm font-bold text-white/90">@{profile?.username ?? '…'}</span>
              {rank !== null && (
                <span className="text-xs font-semibold text-neon-gold/80">#{rank} mondial</span>
              )}
            </div>
          </motion.div>
        </motion.div>

        {/* Dock mobile */}
        <div className="shrink-0 py-3">
          <MobileDock settings={settings} onPlay={onPlay} onOpenSettings={onOpenSettings} />
        </div>

        {/* Cards empilées — zone scrollable */}
        <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
          <div className="flex flex-col gap-3 px-4 pb-8 pt-1">
            <LeaderboardCard onShowStats={tab => onShowStats(tab)} />
            <PlayerStatsCard onShowStats={tab => onShowStats(tab)} />
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════
          DESKTOP layout (lg+) : cards latérales + avatar centré
      ════════════════════════════════════════════════════ */}
      <div className="hidden lg:block">

        {/* Slots personnalisation réservés */}
        <div
          data-slot="behind-avatar"
          aria-hidden="true"
          className="absolute left-1/2 top-[42%] h-56 w-56 -translate-x-1/2 -translate-y-1/2"
        />
        <div
          data-slot="top-left"
          aria-hidden="true"
          className="absolute left-16 top-24 h-28 w-28"
        />
        <div
          data-slot="top-right"
          aria-hidden="true"
          className="absolute right-16 top-24 h-28 w-28"
        />
        <div data-testid="podium" className="hidden" />

        {/* Card gauche — Leaderboard */}
        <div className="absolute left-4 top-1/2 z-30 w-64 -translate-y-1/2 lg:left-8 xl:w-72">
          <LeaderboardCard onShowStats={tab => onShowStats(tab)} />
        </div>

        {/* Card droite — Stats perso */}
        <div className="absolute right-4 top-1/2 z-30 w-64 -translate-y-1/2 lg:right-8 xl:w-72">
          <PlayerStatsCard onShowStats={tab => onShowStats(tab)} />
        </div>

        {/* Hero : avatar flottant + identité */}
        <motion.div
          className="absolute inset-0 z-10 flex flex-col items-center justify-center"
          animate={
            isLaunching
              ? { opacity: 0, scale: 0.85, transition: { duration: 0.25 } }
              : { opacity: 1, scale: 1 }
          }
        >
          <motion.div
            className="relative flex flex-col items-center gap-4"
            style={{ willChange: 'transform' }}
            animate={floatAnimation}
            transition={floatTransition}
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-full"
              style={{
                background:
                  'radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, rgba(139, 92, 246, 0.03) 50%, transparent 70%)',
                transform: 'scale(1.3)',
                zIndex: 0,
              }}
            />
            <div className="relative z-[1]">
              <AvatarContainer className="h-36 w-36 sm:h-44 sm:w-44" fontSize="4rem" />
            </div>
            <div
              data-slot="podium-front"
              className="absolute left-1/2 z-20 -translate-x-1/2"
              style={{ bottom: '-48px' }}
            />
            <div className="relative z-[1] flex flex-col items-center gap-1 text-center">
              <span className="text-base font-bold text-white/90">@{profile?.username ?? '…'}</span>
              {rank !== null && (
                <span className="text-xs font-semibold text-neon-gold/80">#{rank} mondial</span>
              )}
            </div>
          </motion.div>
        </motion.div>
      </div>

    </div>
  )
}
