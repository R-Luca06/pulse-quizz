import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../hooks/useAuth'
import {
  getDailyTheme,
  getDailyEntry,
  getDailyStreak,
  getDailyMultiplier,
  getDailyLeaderboard,
  getDailyUserRank,
  getDailyPlayerCount,
  getTodayDate,
} from '../../services/dailyChallenge'
import type { DailyTheme, DailyEntry, DailyStreak, DailyLeaderboardEntry } from '../../types/quiz'
import MiniBadge from '../shared/MiniBadge'

interface Props {
  onBack: () => void
  onStartGame: () => void
  onShowLeaderboard?: () => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(d: string): string {
  return new Date(d + 'T00:00:00').toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
  })
}

function useCountdown() {
  const [remaining, setRemaining] = useState('')
  useEffect(() => {
    function calc() {
      const now = new Date()
      const midnight = new Date()
      midnight.setUTCHours(24, 0, 0, 0)
      const diff = midnight.getTime() - now.getTime()
      if (diff <= 0) { setRemaining('0h'); return }
      const h = Math.floor(diff / 3_600_000)
      const m = Math.floor((diff % 3_600_000) / 60_000)
      setRemaining(h > 0 ? `${h}h ${m}min` : `${m}min`)
    }
    calc()
    const id = setInterval(calc, 60_000)
    return () => clearInterval(id)
  }, [])
  return remaining
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

// ─── Leaderboard Row ──────────────────────────────────────────────────────────

function LeaderboardRow({
  entry,
  isCurrentUser,
  showDetail = false,
}: {
  entry: DailyLeaderboardEntry
  isCurrentUser: boolean
  showDetail?: boolean
}) {
  const rankColors: Record<number, string> = { 1: '#EAB308', 2: '#94A3B8', 3: '#CD7C35' }
  const rankColor = isCurrentUser ? '#8B5CF6' : (rankColors[entry.rank] ?? 'rgba(255,255,255,0.25)')

  return (
    <div
      className={`flex items-center gap-3 rounded-xl px-4 py-3 ${
        isCurrentUser
          ? 'border border-neon-violet/30 bg-neon-violet/[0.08]'
          : 'border border-white/[0.06] bg-white/[0.02]'
      }`}
    >
      <span
        className="w-6 shrink-0 text-center text-xs font-black tabular-nums"
        style={{ color: rankColor }}
      >
        #{entry.rank}
      </span>

      <div className="flex min-w-0 flex-1 items-center gap-1.5">
        <span className={`truncate text-sm font-bold ${isCurrentUser ? 'text-neon-violet' : 'text-white'}`}>
          {entry.username}
        </span>
        {isCurrentUser && (
          <span className="shrink-0 text-[10px] text-neon-violet/40">(moi)</span>
        )}
        {entry.featured_badges.slice(0, 2).map(b => (
          <MiniBadge key={b} achievementId={b} size={14} />
        ))}
        {entry.streak_day > 1 && (
          <span className="shrink-0 text-[10px] text-warning/70">🔥{entry.streak_day}</span>
        )}
      </div>

      {showDetail ? (
        <div className="flex shrink-0 flex-col items-end gap-0.5">
          <span className={`text-sm font-black tabular-nums ${isCurrentUser ? 'text-neon-violet' : 'text-white/80'}`}>
            {entry.score.toLocaleString('fr-FR')}<span className="text-[10px] font-medium text-white/30"> pts</span>
          </span>
          <span className="text-[10px] text-white/25">
            {entry.multiplier > 1 ? `×${entry.multiplier} · ` : ''}{entry.xp_earned.toLocaleString('fr-FR')} XP
          </span>
        </div>
      ) : (
        <div className="flex shrink-0 items-center gap-2">
          <span className={`text-sm font-black tabular-nums ${isCurrentUser ? 'text-neon-violet' : 'text-white/60'}`}>
            {entry.score.toLocaleString('fr-FR')}<span className="text-[10px] font-medium text-white/30"> pts</span>
          </span>
          {entry.multiplier > 1 && (
            <span className="text-[9px] font-bold text-warning/80">×{entry.multiplier}</span>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10

export default function DailyChallengePage({ onBack, onStartGame }: Props) {
  const { user } = useAuth()
  const countdown = useCountdown()
  const today = getTodayDate()

  const [theme, setTheme]             = useState<DailyTheme | null>(null)
  const [entry, setEntry]             = useState<DailyEntry | null | undefined>(undefined)
  const [streak, setStreak]           = useState<DailyStreak | null>(null)
  const [playerCount, setPlayerCount] = useState<number>(0)
  const [loading, setLoading]         = useState(true)

  const [leaderboard, setLeaderboard]   = useState<DailyLeaderboardEntry[]>([])
  const [lbTotal, setLbTotal]           = useState(0)
  const [lbPage, setLbPage]             = useState(0)
  const [lbLoading, setLbLoading]       = useState(false)
  const [userRank, setUserRank]         = useState<number | null>(null)

  const lbTotalPages = Math.ceil(lbTotal / PAGE_SIZE)

  // ── Initial load ─────────────────────────────────────────────────────────
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

  // ── Load leaderboard ─────────────────────────────────────────────────────
  useEffect(() => {
    loadLeaderboard(0)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [today])

  async function loadLeaderboard(page: number) {
    setLbLoading(true)
    try {
      const [{ entries, total }, rank] = await Promise.all([
        getDailyLeaderboard(today, page, PAGE_SIZE),
        user ? getDailyUserRank(user.id, today) : Promise.resolve(null),
      ])
      setLeaderboard(entries)
      setLbTotal(total)
      setLbPage(page)
      if (rank !== null) setUserRank(rank)
    } catch (err) {
      console.error(err)
    } finally {
      setLbLoading(false)
    }
  }

  const isCompleted = entry !== null && entry !== undefined
  const currentStreak  = streak?.current_streak ?? 0
  const multiplier     = getDailyMultiplier(currentStreak)
  const nextMult       = streakNeededForNext(currentStreak)

  if (loading) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-game-bg">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-neon-violet border-t-transparent" />
      </div>
    )
  }

  if (!theme) {
    return <NoThemeState onBack={onBack} />
  }

  return (
    <div className="absolute inset-0 overflow-y-auto bg-game-bg">
      {/* ── Back bar ── */}
      <div className="sticky top-0 z-10 border-b border-white/[0.06] bg-game-bg/90 backdrop-blur-md">
        <div className="mx-auto flex h-12 max-w-4xl items-center px-4 lg:px-6">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-white/40 transition-colors hover:text-white/80"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
            Retour
          </button>
          <span className="flex-1 text-center text-xs font-semibold text-white/30">Défi journalier</span>
          <div className="w-14" />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {isCompleted ? (
          <CompletedState
            key="completed"
            theme={theme}
            entry={entry!}
            streak={streak}
            userRank={userRank}
            leaderboard={leaderboard}
            lbTotal={lbTotal}
            lbPage={lbPage}
            lbTotalPages={lbTotalPages}
            lbLoading={lbLoading}
            userId={user?.id ?? ''}
            onChangePage={p => loadLeaderboard(p)}
          />
        ) : (
          <UnplayedState
            key="unplayed"
            theme={theme}
            streak={streak}
            multiplier={multiplier}
            nextMult={nextMult}
            playerCount={playerCount}
            countdown={countdown}
            user={user}
            leaderboard={leaderboard.slice(0, 3)}
            onStartGame={onStartGame}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── UnplayedState ────────────────────────────────────────────────────────────

function UnplayedState({
  theme,
  streak,
  multiplier,
  nextMult,
  playerCount,
  countdown,
  user,
  leaderboard,
  onStartGame,
}: {
  theme: DailyTheme
  streak: DailyStreak | null
  multiplier: number
  nextMult: { needed: number; label: string } | null
  playerCount: number
  countdown: string
  user: { id: string } | null
  leaderboard: DailyLeaderboardEntry[]
  onStartGame: () => void
}) {
  const currentStreak = streak?.current_streak ?? 0
  const today = getTodayDate()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4 }}
      className="mx-auto max-w-lg px-4 pb-20 pt-2 lg:max-w-4xl lg:px-6"
    >
      <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-6">

        {/* ── Colonne gauche : héro + bouton jouer ── */}
        <div>
          {/* Hero */}
          <div className="relative mb-3 overflow-hidden rounded-2xl border border-white/[0.06] bg-game-card">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(139,92,246,0.18)_0%,transparent_65%)]" />

            <div className="relative px-6 pb-5 pt-6 text-center">
              {/* Date pill */}
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-400" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/30">
                  {formatDate(today)}
                </span>
              </div>

              {/* Emoji flottant */}
              <motion.span
                className="mb-3 block text-5xl"
                style={{ filter: 'drop-shadow(0 0 18px rgba(139,92,246,0.5))' }}
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
              >
                {theme.emoji}
              </motion.span>

              <h1 className="mb-2 text-2xl font-black tracking-tight"
                style={{ background: 'linear-gradient(135deg,#fff 0%,rgba(167,139,250,0.9) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
              >
                {theme.title}
              </h1>
              {theme.description && (
                <p className="mx-auto max-w-xs text-sm text-white/35 leading-relaxed">
                  {theme.description}
                </p>
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

            {/* Multiplier banner (if active) */}
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
          </div>

          {/* Play button */}
          <div className="mb-4 flex flex-col items-center gap-3 lg:mb-0">
            {!user ? (
              <p className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-center text-sm text-white/40">
                Connecte-toi pour participer au défi journalier
              </p>
            ) : (
              <>
                <motion.button
                  type="button"
                  onClick={onStartGame}
                  className="relative w-full overflow-hidden rounded-2xl py-4 text-center font-black text-white"
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
                  {/* Shimmer */}
                  <motion.div
                    className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/8 to-transparent"
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ duration: 3, repeat: Infinity, repeatDelay: 0 }}
                  />
                  <div className="relative flex items-center justify-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/18 text-sm">📅</span>
                    <div className="text-left">
                      <div className="text-base font-black leading-none">Relever le défi</div>
                      <div className="mt-0.5 text-[11px] font-medium opacity-70">10 questions · 1 seule tentative</div>
                    </div>
                  </div>
                </motion.button>

                <p className="flex items-center gap-1.5 text-[11px] text-white/20">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  1 seule tentative par jour — résultat définitif
                </p>
              </>
            )}
          </div>
        </div>

        {/* ── Colonne droite : mini classement ── */}
        {leaderboard.length > 0 && (
          <div className="rounded-2xl border border-white/[0.06] bg-game-card p-4">
            <h3 className="mb-3 text-[10px] font-bold uppercase tracking-widest text-white/30">Meilleurs scores du jour</h3>
            <div className="flex flex-col gap-2">
              {leaderboard.map(e => (
                <LeaderboardRow key={e.id} entry={e} isCurrentUser={e.user_id === (user?.id ?? '')} />
              ))}
            </div>
            <div className="mt-3 flex items-center justify-center border-t border-white/[0.04] pt-3">
              <div className="flex items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2">
                <span className="text-xs text-white/25">Ton score</span>
                <span className="text-xs font-bold text-white/30">—</span>
                <span className="text-xs text-white/20">Non joué</span>
              </div>
            </div>
            <p className="mt-2 text-center text-[10px] text-white/15">
              Se termine dans {countdown}
            </p>
          </div>
        )}

      </div>
    </motion.div>
  )
}

// ─── CompletedState ───────────────────────────────────────────────────────────

function CompletedState({
  theme,
  entry,
  streak,
  userRank,
  leaderboard,
  lbTotal,
  lbPage,
  lbTotalPages,
  lbLoading,
  userId,
  onChangePage,
}: {
  theme: DailyTheme
  entry: DailyEntry
  streak: DailyStreak | null
  userRank: number | null
  leaderboard: DailyLeaderboardEntry[]
  lbTotal: number
  lbPage: number
  lbTotalPages: number
  lbLoading: boolean
  userId: string
  onChangePage: (p: number) => void
}) {
  const lbRef = useRef<HTMLDivElement>(null)
  const currentStreak = streak?.current_streak ?? entry.streak_day
  const nextMult      = streakNeededForNext(currentStreak)
  const isExcellent    = entry.score >= 2000
  const isGood         = entry.score >= 800

  // Hero colors based on score
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

  const emojiGlowColor = isExcellent ? 'rgba(34,197,94,0.5)' : 'rgba(139,92,246,0.5)'
  const scoreColor     = isExcellent ? '#22C55E' : isGood ? '#8B5CF6' : '#F97316'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4 }}
      className="mx-auto max-w-lg px-4 pb-20 pt-2 lg:max-w-4xl lg:px-6"
    >
      <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-6">

      {/* ── Colonne gauche : héro + score + série ── */}
      <div className="mb-3 lg:mb-0">
      {/* ── Hero + Score + Streak card ── */}
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-game-card">
        <div className="pointer-events-none absolute inset-0" style={{ background: heroGlow }} />

        {/* Hero section */}
        <div className="relative px-6 pb-5 pt-6 text-center">
          {/* Completed pill — green */}
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/[0.07] px-3 py-1">
            <span className="text-[11px] font-bold text-emerald-400">✓</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400/60">
              Complété · {formatDate(entry.date)}
            </span>
          </div>

          <motion.span
            className="mb-3 block text-5xl"
            style={{ filter: `drop-shadow(0 0 18px ${emojiGlowColor})` }}
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            {theme.emoji}
          </motion.span>

          <h1 className="mb-1.5 text-2xl font-black tracking-tight"
            style={{ background: titleGradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
          >
            {theme.title}
          </h1>
          <p className="text-sm text-white/35">Tu as relevé le défi du jour !</p>
        </div>

        {/* Score section */}
        <div className="relative flex flex-col items-center gap-3 border-t border-white/[0.05] px-6 py-6">
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
            transition={{ delay: 0.35 }}
            className="flex items-center gap-2 rounded-full border border-neon-violet/20 bg-neon-violet/[0.08] px-4 py-1.5"
          >
            <span className="text-base leading-none text-neon-violet/60">✦</span>
            <span className="text-sm font-bold text-purple-300/90">
              +{entry.xp_earned.toLocaleString('fr-FR')} XP gagnés
            </span>
            {entry.multiplier > 1 && (
              <span className="text-[10px] font-medium text-white/35">
                (×{entry.multiplier} série)
              </span>
            )}
          </motion.div>

          {/* Rank line */}
          {userRank !== null && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex items-center gap-1.5 text-xs text-white/40"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
              <span>
                Tu es{' '}
                <strong className="font-black text-neon-violet/90">#{userRank}</strong>
                {' '}sur {lbTotal.toLocaleString('fr-FR')} joueur{lbTotal > 1 ? 's' : ''} aujourd'hui
              </span>
            </motion.div>
          )}

          {/* See leaderboard button — visible uniquement sur mobile */}
          <button
            type="button"
            onClick={() => lbRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            className="mt-1 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-5 py-2.5 text-sm font-semibold text-white/45 transition-colors hover:border-white/15 hover:text-white/70 lg:hidden"
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
                  transition={{ delay: 0.5 + i * 0.07, type: 'spring', stiffness: 400, damping: 15 }}
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
      </div>{/* fin carte hero+score+streak */}
      </div>{/* fin colonne gauche */}

      {/* ── Colonne droite : classement ── */}
      <div ref={lbRef} className="rounded-2xl border border-white/[0.06] bg-game-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">
            Classement du jour
          </p>
          <span className="text-[10px] text-white/20">{lbTotal} joueur{lbTotal > 1 ? 's' : ''}</span>
        </div>

        {lbLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-neon-violet border-t-transparent" />
          </div>
        ) : leaderboard.length === 0 ? (
          <p className="py-4 text-center text-sm text-white/25">Aucun résultat</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {leaderboard.map(e => (
              <LeaderboardRow key={e.id} entry={e} isCurrentUser={e.user_id === userId} showDetail />
            ))}
          </div>
        )}

        {/* Pagination */}
        {lbTotalPages > 1 && (
          <div className="mt-3 flex items-center justify-center gap-2 border-t border-white/[0.04] pt-3">
            <button
              type="button"
              onClick={() => onChangePage(lbPage - 1)}
              disabled={lbPage === 0 || lbLoading}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-white/50 transition-colors disabled:opacity-30 enabled:hover:border-white/20 enabled:hover:text-white"
            >
              ‹
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: lbTotalPages }, (_, i) => {
                const show = i === 0 || i === lbTotalPages - 1 || Math.abs(i - lbPage) <= 1
                if (!show) {
                  const prevShown = i - 1 === 0 || i - 1 === lbTotalPages - 1 || Math.abs(i - 1 - lbPage) <= 1
                  if (!prevShown) return null
                  return <span key={`ellipsis-${i}`} className="px-1 text-xs text-white/20">…</span>
                }
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => onChangePage(i)}
                    disabled={lbLoading}
                    className={[
                      'h-7 min-w-[28px] rounded-lg px-2 text-xs font-bold transition-colors',
                      i === lbPage
                        ? 'border border-neon-violet/30 bg-neon-violet/20 text-neon-violet'
                        : 'text-white/40 hover:text-white/70',
                    ].join(' ')}
                  >
                    {i + 1}
                  </button>
                )
              })}
            </div>

            <button
              type="button"
              onClick={() => onChangePage(lbPage + 1)}
              disabled={lbPage >= lbTotalPages - 1 || lbLoading}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-white/50 transition-colors disabled:opacity-30 enabled:hover:border-white/20 enabled:hover:text-white"
            >
              ›
            </button>
          </div>
        )}
      </div>{/* fin colonne droite */}

      </div>{/* fin grille desktop */}
    </motion.div>
  )
}

// ─── No theme state ───────────────────────────────────────────────────────────

function NoThemeState({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-20 text-center">
      <span className="mb-4 text-5xl">📅</span>
      <h2 className="mb-2 text-lg font-bold text-white">Pas de défi aujourd'hui</h2>
      <p className="mb-6 text-sm text-white/35">Aucun thème n'a été configuré pour aujourd'hui. Reviens demain !</p>
      <button
        type="button"
        onClick={onBack}
        className="rounded-xl border border-white/10 px-6 py-2.5 text-sm font-semibold text-white/60 transition-colors hover:border-white/20 hover:text-white"
      >
        Retour
      </button>
    </div>
  )
}
