import { useState, useEffect } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { useAuth } from '../../../contexts/AuthContext'
import { getUserRank } from '../../../services/leaderboard'
import { AvatarContainer } from '../../avatar'
import ConstellationBackground from '../ConstellationBackground'
import LeaderboardCard from '../LeaderboardCard'
import PlayerStatsCard from '../PlayerStatsCard'

interface Props {
  isLaunching: boolean
  onShowStats: (tab?: 'stats' | 'leaderboard') => void
}

export default function PodiumScene({ isLaunching, onShowStats }: Props) {
  const reduced = useReducedMotion()
  const { user, profile } = useAuth()
  const [rank, setRank] = useState<number | null>(null)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    getUserRank(user.id, 'fr').then(r => { if (!cancelled) setRank(r) }).catch(() => {})
    return () => { cancelled = true }
  }, [user])

  return (
    <div className="absolute inset-0 overflow-hidden bg-game-bg">
      {/* Halo violet/bleu */}
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

      {/* Fond animé constellations */}
      <ConstellationBackground />

      {/* Slots personnalisation réservés */}
      <div
        data-slot="behind-avatar"
        aria-hidden="true"
        className="absolute left-1/2 top-[42%] h-40 w-40 -translate-x-1/2 -translate-y-1/2 sm:h-56 sm:w-56"
      />
      <div
        data-slot="top-left"
        aria-hidden="true"
        className="absolute left-6 top-20 h-20 w-20 sm:left-16 sm:top-24 sm:h-28 sm:w-28"
      />
      <div
        data-slot="top-right"
        aria-hidden="true"
        className="absolute right-6 top-20 h-20 w-20 sm:right-16 sm:top-24 sm:h-28 sm:w-28"
      />

      {/* Podium placeholder */}
      <div data-testid="podium" className="hidden" />

      {/* Card gauche — Leaderboard compétitif */}
      <div className="absolute left-4 top-1/2 z-30 -translate-y-1/2 lg:left-8">
        <LeaderboardCard onShowStats={tab => onShowStats(tab)} />
      </div>

      {/* Card droite — Stats perso */}
      <div className="absolute right-4 top-1/2 z-30 -translate-y-1/2 lg:right-8">
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
          animate={
            reduced
              ? undefined
              : {
                  x: ['0vw', '10vw', '-8vw', '12vw', '-10vw', '6vw', '0vw'],
                  y: ['0vh', '-8vh', '7vh', '-9vh', '6vh', '-5vh', '0vh'],
                  rotate: [-2, 4, -3, 6, -5, 2, -2],
                  scale: [1, 0.98, 1.02, 0.97, 1.01, 0.99, 1],
                }
          }
          transition={{
            x: { duration: 68, repeat: Infinity, ease: 'easeInOut' },
            y: { duration: 32, repeat: Infinity, ease: 'easeInOut' },
            rotate: { duration: 22, repeat: Infinity, ease: 'easeInOut' },
            scale: { duration: 14, repeat: Infinity, ease: 'easeInOut' },
          }}
        >
          {/* Bulle spatiale */}
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

          {/* Slot podium-front */}
          <div
            data-slot="podium-front"
            className="absolute left-1/2 z-20 -translate-x-1/2"
            style={{ bottom: '-48px' }}
          />

          {/* Identité sous l'avatar */}
          <div className="relative z-[1] flex flex-col items-center gap-1 text-center">
            <span className="text-base font-bold text-white/90">
              @{profile?.username ?? '…'}
            </span>
            {rank !== null && (
              <span className="text-xs font-semibold text-neon-gold/80">
                #{rank} mondial
              </span>
            )}
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
