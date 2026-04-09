import { useState, useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
import { getCategoryStats, getGlobalStats } from '../../utils/statsStorage'
import type { CategoryStats, GlobalStats } from '../../utils/statsStorage'
import { fetchAllStats } from '../../services/cloudStats'
import type { CloudCategoryStatRow, CloudGlobalStatRow } from '../../services/cloudStats'
import { getTopScores } from '../../services/leaderboard'
import type { LeaderboardEntry } from '../../services/leaderboard'
import { CATEGORIES, MODES, DIFFICULTIES } from '../../constants/quiz'
import { useAuth } from '../../hooks/useAuth'
import type { GameMode, Difficulty } from '../../types/quiz'

interface Props {
  onBack: () => void
  defaultTab?: 'stats' | 'leaderboard'
  initialMode?: GameMode
  initialDiff?: Difficulty
}

// StatsPage uses smaller buttons than LandingPage
const btnBase = 'rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors duration-150'
const btnSelected = 'border-neon-violet bg-neon-violet/15 text-white'
const btnIdle = 'border-white/10 bg-white/5 text-white/40 hover:border-white/20 hover:text-white/60'

function StatTile({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl border border-white/[0.08] bg-white/[0.03] py-3">
      <span className={`text-lg font-black tabular-nums ${accent ?? 'text-white'}`}>{value}</span>
      <span className="text-[10px] font-semibold uppercase tracking-wider text-white/30">{label}</span>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-white/25">{label}</span>
      <span className="text-sm font-bold text-white">{value}</span>
    </div>
  )
}

const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }

const EMPTY_CAT_STATS: CategoryStats = {
  version: 1, gamesPlayed: 0, totalQuestions: 0, totalCorrect: 0,
  bestScore: 0, bestStreak: 0, fastestPerfect: null,
}

function cloudRowToCatStats(row: CloudCategoryStatRow): CategoryStats {
  return {
    version: 1,
    gamesPlayed: row.games_played,
    totalQuestions: row.total_questions,
    totalCorrect: row.total_correct,
    bestScore: row.best_score,
    bestStreak: row.best_streak,
    fastestPerfect: row.fastest_perfect,
  }
}

function cloudRowToGlobalStats(row: CloudGlobalStatRow): GlobalStats {
  return {
    version: 1,
    gamesPlayed: row.games_played,
    totalQuestions: row.total_questions,
    totalCorrect: row.total_correct,
    bestStreak: row.best_streak,
    fastestPerfect: row.fastest_perfect,
  }
}

export default function StatsPage({ onBack, defaultTab = 'stats', initialMode, initialDiff }: Props) {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'stats' | 'leaderboard'>(defaultTab)
  const [filterMode, setFilterMode] = useState<GameMode>(initialMode ?? 'normal')
  const [filterDiff, setFilterDiff] = useState<Difficulty>(initialDiff ?? 'easy')
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [lbLoading, setLbLoading] = useState(false)
  const [lbError, setLbError] = useState(false)

  const [cloudCats, setCloudCats] = useState<CloudCategoryStatRow[]>([])
  const [cloudGlobal, setCloudGlobal] = useState<CloudGlobalStatRow | null>(null)
  const [cloudLoading, setCloudLoading] = useState(false)

  useEffect(() => {
    if (!user) {
      setCloudCats([])
      setCloudGlobal(null)
      return
    }
    setCloudLoading(true)
    fetchAllStats(user.id)
      .then(({ categories, global }) => {
        setCloudCats(categories)
        setCloudGlobal(global)
      })
      .catch(console.error)
      .finally(() => setCloudLoading(false))
  }, [user])

  useEffect(() => {
    if (activeTab !== 'leaderboard') return
    setLbLoading(true)
    setLbError(false)
    getTopScores(filterMode, filterDiff)
      .then(setLeaderboard)
      .catch(() => setLbError(true))
      .finally(() => setLbLoading(false))
  }, [activeTab, filterMode, filterDiff])

  const effectiveGlobal: GlobalStats = useMemo(() => {
    if (user && cloudGlobal && !cloudLoading) return cloudRowToGlobalStats(cloudGlobal)
    return getGlobalStats()
  }, [user, cloudGlobal, cloudLoading])

  const globalRate = effectiveGlobal.totalQuestions > 0
    ? Math.round((effectiveGlobal.totalCorrect / effectiveGlobal.totalQuestions) * 100)
    : 0

  const sorted = useMemo(() => {
    const getStats = (catValue: string | number): CategoryStats => {
      if (user && !cloudLoading) {
        const row = cloudCats.find(
          r => r.mode === filterMode && r.difficulty === filterDiff && r.category === String(catValue)
        )
        return row ? cloudRowToCatStats(row) : { ...EMPTY_CAT_STATS }
      }
      return getCategoryStats(filterMode, filterDiff, catValue)
    }

    const catsWithStats = CATEGORIES.map(cat => ({
      ...cat,
      stats: getStats(cat.value),
    }))
    return [
      ...catsWithStats.filter(c => c.stats.gamesPlayed > 0),
      ...catsWithStats.filter(c => c.stats.gamesPlayed === 0),
    ]
  }, [filterMode, filterDiff, user, cloudCats, cloudLoading])

  return (
    <div className="relative flex min-h-screen flex-col items-center overflow-y-auto bg-game-bg px-4 py-6 sm:py-10">
      {/* Background blob */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-1/2 top-1/3 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-neon-violet/8 blur-3xl lg:h-[500px] lg:w-[500px]" />
      </div>

      {/* Container — max-w-lg mobile, max-w-5xl desktop */}
      <div className="relative z-10 flex w-full max-w-lg flex-col gap-6 lg:max-w-5xl">

        {/* Header — toujours pleine largeur */}
        <div className="flex items-center justify-between">
          <motion.button
            onClick={onBack}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/40 transition-colors hover:border-white/20 hover:text-white/70"
          >
            ← Retour
          </motion.button>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="flex gap-2"
          >
            <button
              onClick={() => setActiveTab('stats')}
              className={[btnBase, 'px-3 py-1', activeTab === 'stats' ? btnSelected : btnIdle].join(' ')}
            >
              Mes stats
            </button>
            <button
              onClick={() => setActiveTab('leaderboard')}
              className={[btnBase, 'px-3 py-1', activeTab === 'leaderboard' ? btnSelected : btnIdle].join(' ')}
            >
              Classement
            </button>
          </motion.div>
          <div className="w-20" />
        </div>

        {/* Contenu — 1 colonne mobile, 2 colonnes lg */}
        <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[260px_1fr] lg:items-start lg:gap-10">

          {/* Colonne gauche — Global + Filtres (sticky sur lg) */}
          <motion.div
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } } }}
            initial="hidden"
            animate="show"
            className="flex flex-col gap-6 lg:sticky lg:top-6"
          >
            {/* Bloc global — onglet stats uniquement */}
            {activeTab === 'stats' && (
              <motion.div variants={fadeUp}>
                <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-white/30">
                  Global {user && <span className="text-neon-violet/60">· cloud</span>}
                </p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2">
                  <StatTile label="Parties" value={effectiveGlobal.gamesPlayed} />
                  <StatTile label="Réussite" value={`${globalRate}%`} accent="text-neon-violet" />
                  <StatTile label="Série max" value={`${effectiveGlobal.bestStreak}×`} accent="text-yellow-400" />
                  <StatTile
                    label="Parfait en"
                    value={effectiveGlobal.fastestPerfect !== null ? `${effectiveGlobal.fastestPerfect.toFixed(1)}s` : '—'}
                    accent={effectiveGlobal.fastestPerfect !== null ? 'text-game-success' : 'text-white/30'}
                  />
                </div>
              </motion.div>
            )}

            {/* Filtres */}
            <motion.div variants={fadeUp} className="flex flex-col gap-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Filtrer par</p>
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  {MODES.map(m => (
                    <button
                      key={m.value}
                      onClick={() => setFilterMode(m.value)}
                      className={[btnBase, filterMode === m.value ? btnSelected : btnIdle].join(' ')}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  {DIFFICULTIES.map(d => (
                    <button
                      key={d.value}
                      onClick={() => setFilterDiff(d.value)}
                      className={[btnBase, filterDiff === d.value ? btnSelected : btnIdle].join(' ')}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Colonne droite */}
          <motion.div
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05, delayChildren: 0.2 } } }}
            initial="hidden"
            animate="show"
            className="pb-8"
          >
            {activeTab === 'stats' ? (
              <>
                <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-white/30">Par catégorie</p>
                <div className="flex flex-col gap-2 lg:grid lg:grid-cols-2 lg:gap-3">
                  {sorted.map((cat) => {
                    const s = cat.stats
                    const played = s.gamesPlayed > 0
                    const rate = s.totalQuestions > 0
                      ? Math.round((s.totalCorrect / s.totalQuestions) * 100)
                      : 0

                    return (
                      <motion.div
                        key={String(cat.value)}
                        variants={fadeUp}
                        className={[
                          'rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 transition-opacity',
                          played ? '' : 'opacity-40',
                        ].join(' ')}
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <p className="text-xs font-bold text-white">{cat.label}</p>
                          {played && (
                            <span className="text-[10px] text-white/30">
                              {s.gamesPlayed} partie{s.gamesPlayed > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>

                        {!played ? (
                          <p className="text-xs text-white/30">Pas encore joué</p>
                        ) : (
                          <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                            <Metric label="Meilleur score" value={`${s.bestScore}/10`} />
                            <Metric label="Réussite" value={`${rate}%`} />
                            <Metric label="Meilleure série" value={`${s.bestStreak}×`} />
                            <Metric
                              label="Parfait en"
                              value={s.fastestPerfect !== null ? `${s.fastestPerfect.toFixed(1)}s` : '—'}
                            />
                          </div>
                        )}
                      </motion.div>
                    )
                  })}
                </div>
              </>
            ) : (
              <>
                <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-white/30">Top 10</p>
                {lbLoading ? (
                  <p className="text-xs text-white/30">Chargement…</p>
                ) : lbError ? (
                  <p className="text-xs text-game-danger">Erreur de connexion</p>
                ) : leaderboard.length === 0 ? (
                  <p className="text-xs text-white/30">Pas encore de scores publiés pour ce filtre</p>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {leaderboard.map((entry, i) => (
                      <motion.div
                        key={entry.id}
                        variants={fadeUp}
                        className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3"
                      >
                        <span className="w-6 text-center text-xs font-black text-white/25">#{i + 1}</span>
                        <span className="flex-1 text-sm font-bold text-white">{entry.username}</span>
                        <span className="text-sm font-black tabular-nums text-neon-violet">{entry.score}/10</span>
                        <span className="text-[10px] text-white/20">
                          {new Date(entry.updated_at).toLocaleDateString('fr-FR')}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                )}
              </>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
