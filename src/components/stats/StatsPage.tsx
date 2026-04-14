import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { EMPTY_CATEGORY_STATS, EMPTY_GLOBAL_STATS } from '../../utils/statsStorage'
import type { CategoryStats, GlobalStats } from '../../utils/statsStorage'
import { fetchAllStats } from '../../services/cloudStats'
import type { CloudCategoryStatRow, CloudGlobalStatRow } from '../../services/cloudStats'
import { getCompLeaderboardPage, getCompLeaderboardCount, getCompEntryGameData, getUserRank } from '../../services/leaderboard'
import type { LeaderboardEntry, CompGameData } from '../../services/leaderboard'
import { FR_CATEGORIES, DIFFICULTIES, LANGUAGES, btnBaseSm, btnSelected, btnIdleSm } from '../../constants/quiz'
import { useAuth } from '../../hooks/useAuth'
import type { Difficulty, Language } from '../../types/quiz'
import MiniBadge from '../shared/MiniBadge'

interface Props {
  onBack: () => void
  defaultTab?: 'stats' | 'leaderboard'
  initialDiff?: Difficulty
  initialLang?: Language
  hideNav?: boolean
  onViewProfile?: (username: string) => void
}

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
const PAGE_SIZE = 10

function formatTotalTime(seconds: number): string {
  if (seconds <= 0) return '0s'
  const s = Math.round(seconds)
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  const rem = s % 60
  return rem > 0 ? `${m}m ${rem}s` : `${m}m`
}

function cloudRowToCatStats(row: CloudCategoryStatRow): CategoryStats {
  return {
    version: 1,
    gamesPlayed: row.games_played,
    totalQuestions: row.total_questions,
    totalCorrect: row.total_correct,
    totalTime: row.total_time ?? 0,
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
    comp_total_score: row.comp_total_score,
  }
}

function aggregateCatStats(rows: CloudCategoryStatRow[]): CategoryStats {
  if (rows.length === 0) return { ...EMPTY_CATEGORY_STATS }
  const fps = rows.map(r => r.fastest_perfect).filter((v): v is number => v !== null)
  return {
    version: 1,
    gamesPlayed: rows.reduce((s, r) => s + r.games_played, 0),
    totalQuestions: rows.reduce((s, r) => s + r.total_questions, 0),
    totalCorrect: rows.reduce((s, r) => s + r.total_correct, 0),
    totalTime: rows.reduce((s, r) => s + (r.total_time ?? 0), 0),
    bestScore: Math.max(...rows.map(r => r.best_score)),
    bestStreak: Math.max(...rows.map(r => r.best_streak)),
    fastestPerfect: fps.length > 0 ? Math.min(...fps) : null,
  }
}

const STATS_DIFFICULTIES: { value: Difficulty; label: string }[] = [
  { value: 'mixed', label: 'Mixte' },
  ...DIFFICULTIES,
]

export default function StatsPage({ onBack, defaultTab = 'stats', initialDiff, initialLang, hideNav = false, onViewProfile }: Props) {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'stats' | 'leaderboard'>(defaultTab)
  const [filterDiff, setFilterDiff] = useState<Difficulty>(initialDiff ?? 'mixed')
  const [filterLang, setFilterLang] = useState<Language>(initialLang ?? 'fr')
  const [statsLang, setStatsLang] = useState<Language>(initialLang ?? 'fr')
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [lbLoading, setLbLoading] = useState(false)
  const [lbError, setLbError] = useState(false)
  const [lbPage, setLbPage] = useState(0)
  const [lbTotalCount, setLbTotalCount] = useState(0)
  const [lbPageKey, setLbPageKey] = useState(0)
  const [userRankInLb, setUserRankInLb] = useState<number | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [expandedData, setExpandedData] = useState<Record<string, CompGameData[] | null>>({})
  const [expandLoading, setExpandLoading] = useState<string | null>(null)

  const lbTotalPages = Math.ceil(lbTotalCount / PAGE_SIZE)

  const [cloudCats, setCloudCats] = useState<CloudCategoryStatRow[]>([])
  const [cloudGlobal, setCloudGlobal] = useState<CloudGlobalStatRow | null>(null)
  const [cloudLoading, setCloudLoading] = useState(() => user !== null)

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
    setLeaderboard([])
    setExpandedId(null)

    Promise.all([
      getCompLeaderboardCount(filterLang),
      user ? getUserRank(user.id, filterLang) : Promise.resolve(null),
    ])
      .then(([count, rank]) => {
        setLbTotalCount(count)
        setUserRankInLb(rank)
        const startPage = rank !== null ? Math.floor((rank - 1) / PAGE_SIZE) : 0
        setLbPage(startPage)
        setLbPageKey(k => k + 1)
        return getCompLeaderboardPage(filterLang, startPage, PAGE_SIZE)
      })
      .then(setLeaderboard)
      .catch(() => setLbError(true))
      .finally(() => setLbLoading(false))
  }, [activeTab, filterLang]) // eslint-disable-line react-hooks/exhaustive-deps

  function goToPage(p: number) {
    if (p < 0 || p >= lbTotalPages || lbLoading) return
    setLbPage(p)
    setLbPageKey(k => k + 1)
    setExpandedId(null)
    setLbLoading(true)
    getCompLeaderboardPage(filterLang, p, PAGE_SIZE)
      .then(setLeaderboard)
      .catch(() => setLbError(true))
      .finally(() => setLbLoading(false))
  }

  async function handleToggleExpand(entry: LeaderboardEntry) {
    if (activeTab !== 'leaderboard') return
    const id = entry.id
    if (expandedId === id) {
      setExpandedId(null)
      return
    }
    setExpandedId(id)
    if (expandedData[id] !== undefined) return
    setExpandLoading(id)
    try {
      const data = await getCompEntryGameData(id)
      setExpandedData(prev => ({ ...prev, [id]: data }))
    } catch {
      setExpandedData(prev => ({ ...prev, [id]: null }))
    } finally {
      setExpandLoading(null)
    }
  }

  const effectiveGlobal: GlobalStats = useMemo(() => {
    if (!user || cloudLoading) return EMPTY_GLOBAL_STATS
    return cloudGlobal ? cloudRowToGlobalStats(cloudGlobal) : EMPTY_GLOBAL_STATS
  }, [user, cloudGlobal, cloudLoading])

  const sorted = useMemo(() => {
    if (!user) return []

    const getStats = (catValue: string | number): CategoryStats => {
      if (cloudLoading) return { ...EMPTY_CATEGORY_STATS }
      if (filterDiff === 'mixed') {
        const rows = cloudCats.filter(r => r.mode === 'normal' && r.category === String(catValue))
        return aggregateCatStats(rows)
      }
      const row = cloudCats.find(
        r => r.mode === 'normal' && r.difficulty === filterDiff && r.category === String(catValue)
      )
      return row ? cloudRowToCatStats(row) : { ...EMPTY_CATEGORY_STATS }
    }

    // Bloc "Toutes catégories" — agrégat de toutes les lignes selon le filtre courant
    const allRows = cloudLoading
      ? []
      : filterDiff === 'mixed'
        ? cloudCats.filter(r => r.mode === 'normal')
        : cloudCats.filter(r => r.mode === 'normal' && r.difficulty === filterDiff)
    const allCatItem = {
      value: 'all' as const,
      label: 'Toutes catégories',
      stats: aggregateCatStats(allRows),
      isAll: true,
    }

    const catList = FR_CATEGORIES.filter(c => c.value !== 'all')
    const catsWithStats = catList.map(cat => ({
      ...cat,
      stats: getStats(cat.value),
      isAll: false,
    }))

    return [
      allCatItem,
      ...catsWithStats.filter(c => c.stats.gamesPlayed > 0),
      ...catsWithStats.filter(c => c.stats.gamesPlayed === 0),
    ]
  }, [filterDiff, user, cloudCats, cloudLoading])

  return (
    <div className={`relative flex flex-col items-center overflow-y-auto bg-game-bg px-4 py-6 sm:py-10 ${hideNav ? '' : 'min-h-screen'}`}>
      {/* Background blob — uniquement hors mode intégré */}
      {!hideNav && (
        <div className="pointer-events-none fixed inset-0">
          <div className="absolute left-1/2 top-1/3 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-neon-violet/8 blur-3xl lg:h-[500px] lg:w-[500px]" />
        </div>
      )}

      {/* Container */}
      <div className="relative z-10 flex w-full max-w-lg flex-col gap-6 lg:max-w-5xl">

        {/* Header — masqué en mode intégré */}
        {!hideNav && (
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
                className={[btnBaseSm, 'px-3 py-1', activeTab === 'stats' ? btnSelected : btnIdleSm].join(' ')}
              >
                Mes stats
              </button>
              <button
                onClick={() => setActiveTab('leaderboard')}
                className={[btnBaseSm, 'px-3 py-1', activeTab === 'leaderboard' ? btnSelected : btnIdleSm].join(' ')}
              >
                Classement
              </button>
            </motion.div>
            <div className="w-20" />
          </div>
        )}

        {/* Contenu — 1 colonne mobile, 2 colonnes lg */}
        <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[260px_1fr] lg:items-start lg:gap-10">

          {/* Colonne gauche — Global + Filtres */}
          <motion.div
            variants={hideNav ? undefined : { hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } } }}
            initial={hideNav ? false : 'hidden'}
            animate={hideNav ? false : 'show'}
            className={`flex flex-col gap-6 ${hideNav ? '' : 'lg:sticky lg:top-6'}`}
          >
            {/* Bloc global — onglet stats, connecté uniquement */}
            {activeTab === 'stats' && user && (
              <motion.div variants={fadeUp}>
                <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-white/30">
                  Global {user && <span className="text-neon-violet/60">· cloud</span>}
                </p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2">
                  <StatTile label="Parties" value={effectiveGlobal.gamesPlayed} />
                  <StatTile label="Questions Justes" value={effectiveGlobal.totalCorrect} accent="text-neon-violet" />
                  <StatTile label="Série max" value={`${effectiveGlobal.bestStreak}×`} accent="text-yellow-400" />
                  <StatTile
                    label="Score Compétitif"
                    value={effectiveGlobal.comp_total_score > 0 ? effectiveGlobal.comp_total_score.toLocaleString('fr-FR') + ' pts' : '—'}
                    accent={effectiveGlobal.comp_total_score > 0 ? 'text-orange-400' : 'text-white/30'}
                  />
                </div>
              </motion.div>
            )}

            {/* Filtres */}
            <motion.div variants={fadeUp} className="flex flex-col gap-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Filtrer par</p>
              <div className="flex flex-col gap-2">
                {activeTab === 'leaderboard' ? (
                  /* Leaderboard : langue uniquement */
                  <div className="flex gap-2">
                    {LANGUAGES.map(l => (
                      <button
                        key={l.value}
                        onClick={() => setFilterLang(l.value)}
                        className={[btnBaseSm, filterLang === l.value ? btnSelected : btnIdleSm].join(' ')}
                      >
                        {l.label}
                      </button>
                    ))}
                  </div>
                ) : (
                  /* Stats : langue + difficulté */
                  <>
                    <div className="flex gap-2">
                      {LANGUAGES.map(l => (
                        <button
                          key={l.value}
                          onClick={() => setStatsLang(l.value)}
                          className={[btnBaseSm, statsLang === l.value ? btnSelected : btnIdleSm].join(' ')}
                        >
                          {l.label}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      {STATS_DIFFICULTIES.map(d => (
                        <button
                          key={d.value}
                          onClick={() => setFilterDiff(d.value)}
                          className={[btnBaseSm, filterDiff === d.value ? btnSelected : btnIdleSm].join(' ')}
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>

          {/* Colonne droite */}
          <div className="pb-8">
            {activeTab === 'stats' && !user ? (
              <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-white/20">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                <p className="text-sm font-semibold text-white/50">Connecte-toi pour voir tes statistiques</p>
                <p className="text-xs text-white/25">Tes parties sont sauvegardées dans le cloud</p>
              </div>
            ) : activeTab === 'stats' ? (
              <>
                <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-white/30">
                  Par catégorie <span className="text-white/25">· Mode Normal</span>
                </p>
                <div className="flex flex-col gap-2 lg:grid lg:grid-cols-2 lg:gap-3">
                  {sorted.map((cat, i) => {
                    const s = cat.stats
                    const played = s.gamesPlayed > 0
                    const rate = s.totalQuestions > 0
                      ? Math.round((s.totalCorrect / s.totalQuestions) * 100)
                      : 0

                    return (
                      <motion.div
                        key={String(cat.value)}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.2 + i * 0.04 }}
                        className={[
                          'rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 transition-opacity',
                          !cat.isAll && !played ? 'opacity-40' : '',
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

                        {!cat.isAll && !played ? (
                          <p className="text-xs text-white/30">Pas encore joué</p>
                        ) : (
                          <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                            <Metric label="Questions justes" value={String(s.totalCorrect)} />
                            <Metric label="Questions totales" value={String(s.totalQuestions)} />
                            <Metric label="Réussite" value={`${rate}%`} />
                            <Metric label="Temps total" value={s.totalTime > 0 ? formatTotalTime(s.totalTime) : '—'} />
                          </div>
                        )}
                      </motion.div>
                    )
                  })}
                </div>
              </>
            ) : (
              <>
                {/* Header + quick-jump buttons */}
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">
                    Classement <span className="text-orange-400/60">· Compétitif</span>
                    {lbTotalCount > 0 && (
                      <span className="ml-1 text-white/20">· {lbTotalCount}</span>
                    )}
                  </p>
                  {lbTotalCount > 0 && (
                    <div className="flex items-center gap-1.5">
                      {lbPage !== 0 && (
                        <button
                          onClick={() => goToPage(0)}
                          disabled={lbLoading}
                          className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-2 py-1 text-[10px] font-bold text-white/40 transition-colors hover:border-white/20 hover:text-white/70 disabled:opacity-30"
                        >
                          ↑ Top
                        </button>
                      )}
                      {userRankInLb !== null && lbPage !== Math.floor((userRankInLb - 1) / PAGE_SIZE) && (
                        <button
                          onClick={() => goToPage(Math.floor((userRankInLb - 1) / PAGE_SIZE))}
                          disabled={lbLoading}
                          className="rounded-lg border border-orange-500/30 bg-orange-500/10 px-2 py-1 text-[10px] font-bold text-orange-400 transition-colors hover:bg-orange-500/20 disabled:opacity-30"
                        >
                          Mon rang #{userRankInLb}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {lbLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
                  </div>
                ) : lbError ? (
                  <p className="text-xs text-game-danger">Erreur de connexion</p>
                ) : leaderboard.length === 0 ? (
                  <p className="text-xs text-white/30">Pas encore de scores publiés pour ce filtre</p>
                ) : (
                  <>
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={lbPageKey}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="flex flex-col gap-1.5"
                      >
                        {leaderboard.map((entry, i) => {
                          const rank = entry.rank ?? (lbPage * PAGE_SIZE + i + 1)
                          const isPlayer = user?.id === entry.user_id
                          const isExpanded = expandedId === entry.id
                          const gameData = expandedData[entry.id]
                          const isLoading = expandLoading === entry.id

                          return (
                            <motion.div
                              key={entry.id}
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.04 }}
                              className={[
                                'overflow-hidden rounded-xl border',
                                isPlayer
                                  ? 'border-orange-500/30 bg-orange-500/10 shadow-[0_0_12px_rgba(249,115,22,0.15)]'
                                  : 'border-white/[0.06] bg-white/[0.02]',
                              ].join(' ')}
                            >
                              {/* Row principale */}
                              <div
                                className={[
                                  'flex items-center gap-3 px-4 py-3 cursor-pointer',
                                  isPlayer ? 'hover:bg-orange-500/10' : 'hover:bg-white/[0.03]',
                                ].join(' ')}
                                onClick={() => handleToggleExpand(entry)}
                              >
                                <span className={`w-6 shrink-0 text-center text-xs font-black ${isPlayer ? 'text-orange-400' : 'text-white/25'}`}>
                                  #{rank}
                                </span>
                                <div className="flex flex-1 items-center gap-1.5 min-w-0">
                                  <span
                                    className={[
                                      'truncate text-sm font-bold text-white',
                                      onViewProfile ? 'cursor-pointer underline decoration-transparent decoration-1 underline-offset-2 transition-colors hover:decoration-neon-violet' : '',
                                    ].join(' ')}
                                    onClick={onViewProfile ? (e) => { e.stopPropagation(); onViewProfile(entry.username) } : undefined}
                                  >
                                    {entry.username}
                                  </span>
                                  {entry.featured_badges && entry.featured_badges.length > 0 && (
                                    <div className="flex shrink-0 items-center gap-0.5">
                                      {entry.featured_badges.map(id => (
                                        <MiniBadge key={id} achievementId={id} size={20} />
                                      ))}
                                    </div>
                                  )}
                                </div>
                                <span className="shrink-0 text-sm font-black tabular-nums text-orange-400">
                                  {entry.score} pts
                                </span>
                                <span className="text-[10px] text-white/20">
                                  {new Date(entry.updated_at).toLocaleDateString('fr-FR')}
                                </span>
                                <motion.svg
                                  animate={{ rotate: isExpanded ? 180 : 0 }}
                                  transition={{ duration: 0.2 }}
                                  width="10" height="10" viewBox="0 0 12 12" fill="none"
                                  className="shrink-0 text-white/20"
                                >
                                  <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                </motion.svg>
                              </div>

                              {/* Détail recap */}
                              <AnimatePresence>
                                {isExpanded && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                                    className="overflow-hidden border-t border-white/[0.05]"
                                  >
                                    <div className="px-4 py-3">
                                      {isLoading ? (
                                        <p className="text-xs text-white/30">Chargement du détail…</p>
                                      ) : !gameData || gameData.length === 0 ? (
                                        <p className="text-xs text-white/30">Récapitulatif non disponible</p>
                                      ) : (
                                        <div className="flex flex-col gap-1">
                                          <div className="mb-1 grid grid-cols-[1fr_auto_auto_auto] gap-2 text-[9px] font-bold uppercase tracking-wider text-white/20">
                                            <span>Question</span>
                                            <span className="text-right">Temps</span>
                                            <span className="text-right">Mult.</span>
                                            <span className="text-right">Pts</span>
                                          </div>
                                          {gameData.map((q, qi) => (
                                            <div
                                              key={qi}
                                              className={[
                                                'grid grid-cols-[1fr_auto_auto_auto] gap-2 rounded-lg border-l-2 py-1.5 pl-2 pr-1',
                                                q.isCorrect ? 'border-l-game-success/60' : 'border-l-game-danger/60',
                                              ].join(' ')}
                                            >
                                              <p className="truncate text-[11px] text-white/50">{q.question}</p>
                                              {q.isCorrect ? (
                                                <>
                                                  <span className="text-[10px] tabular-nums text-white/25">{q.timeSpent.toFixed(1)}s</span>
                                                  <span className={[
                                                    'text-[10px] font-bold tabular-nums',
                                                    q.multiplier >= 3 ? 'text-yellow-400'
                                                    : q.multiplier >= 2 ? 'text-purple-400'
                                                    : q.multiplier >= 1.5 ? 'text-blue-400'
                                                    : 'text-white/30',
                                                  ].join(' ')}>×{q.multiplier}</span>
                                                  <span className="text-[10px] font-bold tabular-nums text-orange-400">+{q.pointsEarned}</span>
                                                </>
                                              ) : (
                                                <>
                                                  <span />
                                                  <span />
                                                  <span className="text-[10px] text-white/25 text-right">0 pts</span>
                                                </>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </motion.div>
                          )
                        })}
                      </motion.div>
                    </AnimatePresence>

                    {/* Pagination */}
                    {lbTotalPages > 1 && (
                      <div className="mt-4 flex items-center justify-center gap-3">
                        <button
                          onClick={() => goToPage(lbPage - 1)}
                          disabled={lbPage === 0 || lbLoading}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-white/50 transition-colors disabled:opacity-30 enabled:hover:border-white/20 enabled:hover:text-white"
                        >
                          ‹
                        </button>

                        <div className="flex items-center gap-1">
                          {Array.from({ length: lbTotalPages }, (_, i) => {
                            const show =
                              i === 0 ||
                              i === lbTotalPages - 1 ||
                              Math.abs(i - lbPage) <= 1

                            if (!show) {
                              const prevShown =
                                i - 1 === 0 ||
                                i - 1 === lbTotalPages - 1 ||
                                Math.abs(i - 1 - lbPage) <= 1
                              if (!prevShown) return null
                              return (
                                <span key={`ellipsis-${i}`} className="px-1 text-xs text-white/20">…</span>
                              )
                            }

                            const isUserPage = userRankInLb !== null && i === Math.floor((userRankInLb - 1) / PAGE_SIZE)
                            return (
                              <button
                                key={i}
                                onClick={() => goToPage(i)}
                                className={[
                                  'h-7 min-w-[28px] rounded-lg px-2 text-xs font-bold transition-colors',
                                  i === lbPage
                                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                                    : isUserPage
                                    ? 'text-orange-400/60 hover:text-orange-400'
                                    : 'text-white/40 hover:text-white/70',
                                ].join(' ')}
                              >
                                {i + 1}
                              </button>
                            )
                          })}
                        </div>

                        <button
                          onClick={() => goToPage(lbPage + 1)}
                          disabled={lbPage >= lbTotalPages - 1 || lbLoading}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-white/50 transition-colors disabled:opacity-30 enabled:hover:border-white/20 enabled:hover:text-white"
                        >
                          ›
                        </button>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
