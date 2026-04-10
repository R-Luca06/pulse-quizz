import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getCompLeaderboardPage, getCompLeaderboardCount } from '../../services/leaderboard'
import type { LeaderboardEntry } from '../../services/leaderboard'
import type { Language } from '../../types/quiz'

const PAGE_SIZE = 10

interface Props {
  userRank: number | null
  rankDelta: number | null
  userId: string
  username: string
  userScore: number
  language: Language
  onDone: () => void
}

const rowVariants = {
  hidden: { opacity: 0, y: 12 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.28, ease: 'easeOut', delay: i * 0.06 },
  }),
  exit: { opacity: 0, transition: { duration: 0.15 } },
}

export default function RankingRevealScreen({
  userRank,
  rankDelta,
  userId,
  username,
  userScore,
  language,
  onDone,
}: Props) {
  const initialPage = userRank !== null ? Math.floor((userRank - 1) / PAGE_SIZE) : 0

  const [page, setPage] = useState(initialPage)
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [pageKey, setPageKey] = useState(0)
  const prevPage = useRef(initialPage)

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  // Fetch count once
  useEffect(() => {
    getCompLeaderboardCount(language)
      .then(setTotalCount)
      .catch(console.error)
  }, [language])

  // Fetch page data when page changes
  useEffect(() => {
    setLoading(true)
    getCompLeaderboardPage(language, page, PAGE_SIZE)
      .then(data => {
        setEntries(data)
        setLoading(false)
        if (page !== prevPage.current) {
          setPageKey(k => k + 1)
          prevPage.current = page
        }
      })
      .catch(console.error)
  }, [language, page])

  function goTo(p: number) {
    if (p < 0 || p >= totalPages || loading) return
    setPage(p)
  }

  const globalRankStart = page * PAGE_SIZE + 1

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-game-bg px-4 py-10 overflow-hidden">
      {/* Background blobs */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute right-1/4 bottom-1/4 h-64 w-64 translate-x-1/2 translate-y-1/2 rounded-full bg-orange-500/5 blur-3xl" />
        <div className="absolute left-1/2 top-1/3 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-500/[0.08] blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-sm flex flex-col gap-4">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="flex flex-col items-center gap-2 text-center"
        >
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">
            Classement · Compétitif
          </p>

          {userRank !== null && (
            <motion.p
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.2 }}
              className="text-5xl font-black text-white"
            >
              #{userRank}
            </motion.p>
          )}

          {rankDelta !== null && rankDelta !== 0 && (
            <motion.span
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.35 }}
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                rankDelta > 0
                  ? 'bg-game-success/15 text-game-success'
                  : 'bg-game-danger/15 text-game-danger'
              }`}
            >
              {rankDelta > 0
                ? `↑ ${rankDelta} place${rankDelta > 1 ? 's' : ''}`
                : `↓ ${Math.abs(rankDelta)} place${Math.abs(rankDelta) > 1 ? 's' : ''}`}
            </motion.span>
          )}
        </motion.div>

        {/* Rows */}
        <div className="flex flex-col gap-1.5 min-h-[420px]">
          {loading ? (
            <div className="flex flex-1 items-center justify-center py-16">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={pageKey}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex flex-col gap-1.5"
              >
                {entries.map((entry, i) => {
                  const rank = globalRankStart + i
                  const isPlayer = entry.user_id === userId
                  return (
                    <motion.div
                      key={entry.id}
                      custom={i}
                      variants={rowVariants}
                      initial="hidden"
                      animate="show"
                      className={[
                        'flex items-center gap-3 rounded-xl px-4 py-3',
                        isPlayer
                          ? 'border border-orange-500/30 bg-orange-500/10 shadow-[0_0_16px_rgba(249,115,22,0.25)] animate-glow-pulse'
                          : 'border border-white/[0.06] bg-white/[0.02]',
                      ].join(' ')}
                    >
                      <span className={`w-6 shrink-0 text-center text-xs font-black ${isPlayer ? 'text-orange-400' : 'text-white/25'}`}>
                        #{rank}
                      </span>
                      <span className="flex-1 truncate text-sm font-bold text-white">
                        {entry.username}
                      </span>
                      <span className={`text-sm font-black tabular-nums ${isPlayer ? 'text-orange-400' : 'text-white/60'}`}>
                        {entry.score} pts
                      </span>
                      {isPlayer && rankDelta !== null && rankDelta !== 0 && (
                        <span className={`shrink-0 text-xs font-bold ${rankDelta > 0 ? 'text-game-success' : 'text-game-danger'}`}>
                          {rankDelta > 0 ? `↑${rankDelta}` : `↓${Math.abs(rankDelta)}`}
                        </span>
                      )}
                    </motion.div>
                  )
                })}
              </motion.div>
            </AnimatePresence>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.3 }}
            className="flex items-center justify-center gap-3"
          >
            <button
              onClick={() => goTo(page - 1)}
              disabled={page === 0 || loading}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-white/50 transition-colors disabled:opacity-30 enabled:hover:border-white/20 enabled:hover:text-white"
            >
              ‹
            </button>

            {/* Page pills */}
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => {
                // Show first, last, current ±1, and ellipsis
                const show =
                  i === 0 ||
                  i === totalPages - 1 ||
                  Math.abs(i - page) <= 1

                if (!show) {
                  // Only render one ellipsis per gap
                  const prevShown =
                    i - 1 === 0 ||
                    i - 1 === totalPages - 1 ||
                    Math.abs(i - 1 - page) <= 1
                  if (!prevShown) return null
                  return (
                    <span key={`ellipsis-${i}`} className="px-1 text-xs text-white/20">
                      …
                    </span>
                  )
                }

                return (
                  <button
                    key={i}
                    onClick={() => goTo(i)}
                    className={[
                      'h-7 min-w-[28px] rounded-lg px-2 text-xs font-bold transition-colors',
                      i === page
                        ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                        : 'text-white/40 hover:text-white/70',
                    ].join(' ')}
                  >
                    {i + 1}
                  </button>
                )
              })}
            </div>

            <button
              onClick={() => goTo(page + 1)}
              disabled={page >= totalPages - 1 || loading}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-white/50 transition-colors disabled:opacity-30 enabled:hover:border-white/20 enabled:hover:text-white"
            >
              ›
            </button>
          </motion.div>
        )}

        {/* Continuer button */}
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.35 }}
          onClick={onDone}
          className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.04] py-3 text-sm font-bold text-white/70 transition-colors hover:border-white/20 hover:text-white"
        >
          Voir les résultats →
        </motion.button>
      </div>
    </div>
  )
}
