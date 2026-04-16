import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../../hooks/useAuth'
import {
  getDailyTheme,
  getDailyEntry,
  getDailyStreak,
  getDailyMultiplier,
  getDailyUserRank,
  getDailyPlayerCount,
  getTodayDate,
} from '../../services/dailyChallenge'
import type { DailyTheme, DailyEntry, DailyStreak } from '../../types/quiz'

interface Props {
  onClose: () => void
  onStartGame: () => void
  onShowLeaderboard: () => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(d: string): string {
  return new Date(d + 'T00:00:00').toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
  })
}

function multiplierLabel(m: number): string {
  if (m >= 3.0) return '×3.0'
  if (m >= 2.5) return '×2.5'
  if (m >= 2.0) return '×2.0'
  if (m >= 1.5) return '×1.5'
  return '×1.0'
}

function streakNeededForNext(current: number): { needed: number; label: string } | null {
  if (current < 3)  return { needed: 3  - current, label: '×1.5 dans' }
  if (current < 7)  return { needed: 7  - current, label: '×2.0 dans' }
  if (current < 14) return { needed: 14 - current, label: '×2.5 dans' }
  if (current < 30) return { needed: 30 - current, label: '×3.0 dans' }
  return null
}

// ─── Main modal card ──────────────────────────────────────────────────────────

export default function DailyChallengeModal({ onClose, onStartGame, onShowLeaderboard }: Props) {
  const { user } = useAuth()
  const today = getTodayDate()

  const [theme,       setTheme]       = useState<DailyTheme | null>(null)
  const [entry,       setEntry]       = useState<DailyEntry | null | undefined>(undefined)
  const [streak,      setStreak]      = useState<DailyStreak | null>(null)
  const [playerCount, setPlayerCount] = useState(0)
  const [userRank,    setUserRank]    = useState<number | null>(null)

  const [loading,     setLoading]     = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [t, count] = await Promise.all([
          getDailyTheme(today),
          getDailyPlayerCount(today),
        ])
        setTheme(t)
        setPlayerCount(count)

        if (user) {
          const [e, s] = await Promise.all([
            getDailyEntry(user.id, today),
            getDailyStreak(user.id),
          ])
          setEntry(e)
          setStreak(s)
          if (e) {
            const rank = await getDailyUserRank(user.id, today)
            setUserRank(rank)
            // Use playerCount already fetched for total
          }
        } else {
          setEntry(null)
        }
      } catch (err) {
        console.error(err)
        setEntry(null)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user, today])

  // Close button
  const CloseButton = () => (
    <button
      type="button"
      onClick={onClose}
      className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/40 transition-colors hover:border-white/20 hover:text-white/70"
      aria-label="Fermer"
    >
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
        <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    </button>
  )

  // Loading state
  if (loading) {
    return (
      <div className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-white/[0.06] bg-game-card">
        <CloseButton />
        <div className="flex h-48 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-neon-violet border-t-transparent" />
        </div>
      </div>
    )
  }

  if (!theme) {
    return (
      <div className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-white/[0.06] bg-game-card px-6 py-8 text-center">
        <CloseButton />
        <span className="mb-3 block text-4xl">📅</span>
        <p className="text-sm font-bold text-white">Pas de défi aujourd'hui</p>
        <p className="mt-1 text-xs text-white/35">Aucun thème configuré. Reviens demain !</p>
      </div>
    )
  }

  const isCompleted    = entry !== null && entry !== undefined
  const currentStreak  = streak?.current_streak ?? 0
  const multiplier     = getDailyMultiplier(currentStreak)
  const nextMult       = streakNeededForNext(currentStreak)

  if (isCompleted && entry) {
    return <CompletedCard
      theme={theme}
      entry={entry}
      streak={streak}
      userRank={userRank}
      playerCount={playerCount}
      onClose={onClose}
      onShowLeaderboard={onShowLeaderboard}
    />
  }

  return <UnplayedCard
    theme={theme}
    streak={streak}
    multiplier={multiplier}
    nextMult={nextMult}
    playerCount={playerCount}
    user={user}
    onClose={onClose}
    onStartGame={onStartGame}
    onShowLeaderboard={onShowLeaderboard}
  />
}

// ─── CompletedCard ────────────────────────────────────────────────────────────

function CompletedCard({
  theme,
  entry,
  streak,
  userRank,
  playerCount,
  onClose,
  onShowLeaderboard,
}: {
  theme: DailyTheme
  entry: DailyEntry
  streak: DailyStreak | null
  userRank: number | null
  playerCount: number
  onClose: () => void
  onShowLeaderboard: () => void
}) {
  const currentStreak = streak?.current_streak ?? entry.streak_day
  const nextMult      = streakNeededForNext(currentStreak)
  const isExcellent   = entry.score >= 2000
  const isGood        = entry.score >= 800

  const heroGlow = isExcellent
    ? 'radial-gradient(ellipse at 50% 0%, rgba(34,197,94,0.15) 0%, transparent 65%)'
    : isGood
    ? 'radial-gradient(ellipse at 50% 0%, rgba(139,92,246,0.15) 0%, transparent 65%)'
    : 'radial-gradient(ellipse at 50% 0%, rgba(249,115,22,0.12) 0%, transparent 65%)'

  const titleGradient = isExcellent
    ? 'linear-gradient(135deg, #fff 0%, rgba(52,211,153,0.9) 100%)'
    : isGood
    ? 'linear-gradient(135deg, #fff 0%, rgba(167,139,250,0.9) 100%)'
    : 'linear-gradient(135deg, #fff 0%, rgba(251,146,60,0.9) 100%)'

  const scoreColor = isExcellent ? '#22C55E' : isGood ? '#8B5CF6' : '#F97316'
  const emojiGlow  = isExcellent ? 'rgba(34,197,94,0.5)' : 'rgba(139,92,246,0.5)'

  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.97 }}
      transition={{ duration: 0.16, ease: 'easeOut' }}
      className="relative w-full overflow-hidden rounded-2xl border border-white/[0.08] bg-game-card shadow-[0_8px_32px_rgba(0,0,0,0.6)]"
    >
      <div className="pointer-events-none absolute inset-0" style={{ background: heroGlow }} />

      {/* Close */}
      <button
        type="button"
        onClick={onClose}
        className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-game-card/80 text-white/40 transition-colors hover:border-white/20 hover:text-white/70"
        aria-label="Fermer"
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </button>

      {/* Hero */}
      <div className="relative px-6 pb-4 pt-6 text-center">
        <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/[0.07] px-3 py-1">
          <span className="text-[11px] font-bold text-emerald-400">✓</span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400/60">
            Complété · {formatDate(entry.date)}
          </span>
        </div>

        <motion.span
          className="mb-3 block text-5xl"
          style={{ filter: `drop-shadow(0 0 18px ${emojiGlow})` }}
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          {theme.emoji}
        </motion.span>

        <h1
          className="mb-1.5 text-xl font-black tracking-tight"
          style={{ background: titleGradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
        >
          {theme.title}
        </h1>
        <p className="text-sm text-white/35">Tu as relevé le défi du jour !</p>
      </div>

      {/* Score section */}
      <div className="relative flex flex-col items-center gap-3 border-t border-white/[0.05] px-6 py-5">
        {/* Score pts */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 300, damping: 20 }}
          className="flex flex-col items-center gap-0.5"
        >
          <span className="text-4xl font-black tabular-nums" style={{ color: scoreColor }}>
            {entry.score.toLocaleString('fr-FR')}
          </span>
          <span className="text-[11px] font-semibold text-white/30 uppercase tracking-widest">points</span>
        </motion.div>

        {/* XP pill */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center gap-2 rounded-full border border-neon-violet/20 bg-neon-violet/[0.08] px-4 py-1.5"
        >
          <span className="text-base leading-none text-neon-violet/60">✦</span>
          <span className="text-sm font-bold text-purple-300/90">
            +{entry.xp_earned.toLocaleString('fr-FR')} XP gagnés
          </span>
          {entry.multiplier > 1 && (
            <span className="text-[10px] font-medium text-white/35">(×{entry.multiplier} série)</span>
          )}
        </motion.div>

        {/* Rank line */}
        {userRank !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45 }}
            className="flex items-center gap-1.5 text-xs text-white/40"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
            <span>
              Tu es{' '}
              <strong className="font-black text-neon-violet/90">#{userRank}</strong>
              {' '}sur {playerCount.toLocaleString('fr-FR')} joueur{playerCount > 1 ? 's' : ''} aujourd'hui
            </span>
          </motion.div>
        )}

        {/* Leaderboard button */}
        <button
          type="button"
          onClick={onShowLeaderboard}
          className="mt-1 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-5 py-2.5 text-sm font-semibold text-white/45 transition-colors hover:border-white/15 hover:text-white/70"
        >
          Voir le classement complet →
        </button>
      </div>

      {/* Streak section */}
      {currentStreak >= 1 && (
        <div className="flex flex-col items-center gap-2 border-t border-warning/10 bg-warning/[0.04] px-4 py-4">
          <div className="flex items-center gap-0.5">
            {Array.from({ length: Math.min(currentStreak, 7) }).map((_, i) => (
              <motion.span
                key={i}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.4 + i * 0.07, type: 'spring', stiffness: 400, damping: 15 }}
                className="text-lg"
              >
                🔥
              </motion.span>
            ))}
            {currentStreak > 7 && (
              <span className="ml-1 text-sm font-black text-warning">+{currentStreak - 7}</span>
            )}
          </div>
          <span className="text-sm font-black text-warning/90">
            {currentStreak} jour{currentStreak > 1 ? 's' : ''} de suite !
          </span>
          {nextMult ? (
            <span className="text-[11px] text-white/30">
              Continue demain pour atteindre {nextMult.label.split(' ')[0]}
            </span>
          ) : (
            <span className="text-[11px] text-white/30">
              Multiplicateur maximum ×3.0 atteint 🏆
            </span>
          )}
        </div>
      )}
    </motion.div>
  )
}

// ─── UnplayedCard ─────────────────────────────────────────────────────────────

function UnplayedCard({
  theme,
  streak,
  multiplier,
  nextMult,
  playerCount,
  user,
  onClose,
  onStartGame,
  onShowLeaderboard,
}: {
  theme: DailyTheme
  streak: DailyStreak | null
  multiplier: number
  nextMult: { needed: number; label: string } | null
  playerCount: number
  user: { id: string } | null
  onClose: () => void
  onStartGame: () => void
  onShowLeaderboard: () => void
}) {
  const currentStreak = streak?.current_streak ?? 0
  const today = getTodayDate()

  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.97 }}
      transition={{ duration: 0.16, ease: 'easeOut' }}
      className="relative w-full overflow-hidden rounded-2xl border border-white/[0.08] bg-game-card shadow-[0_8px_32px_rgba(0,0,0,0.6)]"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(139,92,246,0.18)_0%,transparent_65%)]" />

      {/* Close */}
      <button
        type="button"
        onClick={onClose}
        className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-game-card/80 text-white/40 transition-colors hover:border-white/20 hover:text-white/70"
        aria-label="Fermer"
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </button>

      {/* Hero */}
      <div className="relative px-6 pb-4 pt-6 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-400" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-white/30">
            {formatDate(today)}
          </span>
        </div>

        <motion.span
          className="mb-3 block text-5xl"
          style={{ filter: 'drop-shadow(0 0 18px rgba(139,92,246,0.5))' }}
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          {theme.emoji}
        </motion.span>

        <h1
          className="mb-2 text-xl font-black tracking-tight"
          style={{ background: 'linear-gradient(135deg,#fff 0%,rgba(167,139,250,0.9) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
        >
          {theme.title}
        </h1>
        {theme.description && (
          <p className="mx-auto max-w-xs text-sm text-white/35 leading-relaxed">{theme.description}</p>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 border-t border-white/[0.05]">
        <div className="flex flex-col items-center gap-0.5 py-3">
          <span className="text-lg font-black text-white">{playerCount}</span>
          <span className="text-[9px] font-semibold uppercase tracking-wider text-white/25">Joueurs</span>
        </div>
        <div className="flex flex-col items-center gap-0.5 border-x border-white/[0.05] py-3">
          <span className="text-lg font-black text-warning">{currentStreak}</span>
          <span className="text-[9px] font-semibold uppercase tracking-wider text-white/25">Jours de suite</span>
        </div>
        <div className="flex flex-col items-center gap-0.5 py-3">
          <span className="text-lg font-black text-white">{multiplierLabel(multiplier)}</span>
          <span className="text-[9px] font-semibold uppercase tracking-wider text-white/25">Multiplicateur</span>
        </div>
      </div>

      {/* Multiplier banner */}
      {multiplier > 1 && (
        <div className="flex items-center justify-center gap-2 border-t border-warning/10 bg-warning/[0.05] px-4 py-2.5">
          <motion.span
            animate={{ filter: ['drop-shadow(0 0 3px #f9731660)', 'drop-shadow(0 0 8px #f97316cc)', 'drop-shadow(0 0 3px #f9731660)'] }}
            transition={{ duration: 1.6, repeat: Infinity }}
            className="text-lg"
          >
            🔥
          </motion.span>
          <span className="text-xs font-semibold text-white/60">
            Série de <strong className="text-white">{currentStreak} jours</strong> — multiplicateur actif
          </span>
          <span className="rounded-full border border-warning/35 bg-warning/18 px-2.5 py-0.5 text-sm font-black text-warning/95">
            {multiplierLabel(multiplier)}
          </span>
        </div>
      )}

      {nextMult && (
        <div className="border-t border-white/[0.04] px-4 py-2 text-center text-[10px] text-white/25">
          {nextMult.label} {nextMult.needed} jour{nextMult.needed > 1 ? 's' : ''}
        </div>
      )}

      {/* Buttons */}
      <div className="px-5 pb-5 pt-4 flex flex-col gap-2">
        {!user ? (
          <p className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-center text-sm text-white/40">
            Connecte-toi pour participer au défi journalier
          </p>
        ) : (
          <motion.button
            type="button"
            onClick={onStartGame}
            className="relative w-full overflow-hidden rounded-2xl py-3.5 text-center font-black text-white"
            style={{
              background: 'linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)',
              boxShadow: '0 0 32px rgba(124,58,237,0.45), 0 0 64px rgba(37,99,235,0.2)',
            }}
            animate={{
              boxShadow: [
                '0 0 24px rgba(124,58,237,0.4), 0 0 48px rgba(37,99,235,0.15)',
                '0 0 40px rgba(124,58,237,0.65), 0 0 80px rgba(37,99,235,0.28)',
                '0 0 24px rgba(124,58,237,0.4), 0 0 48px rgba(37,99,235,0.15)',
              ],
            }}
            transition={{ duration: 2.5, repeat: Infinity }}
            whileTap={{ scale: 0.97 }}
          >
            <motion.div
              className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/8 to-transparent"
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
            <div className="relative flex items-center justify-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-white/18 text-sm">📅</span>
              <div className="text-left">
                <div className="text-sm font-black leading-none">Relever le défi</div>
                <div className="mt-0.5 text-[11px] font-medium opacity-70">10 questions · score basé sur la vitesse</div>
              </div>
            </div>
          </motion.button>
        )}

        <button
          type="button"
          onClick={onShowLeaderboard}
          className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-5 py-2.5 text-sm font-semibold text-white/40 transition-colors hover:border-white/15 hover:text-white/65"
        >
          Voir le classement →
        </button>
      </div>
    </motion.div>
  )
}
