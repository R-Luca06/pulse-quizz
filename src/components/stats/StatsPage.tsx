import { useState } from 'react'
import { motion } from 'framer-motion'
import { getCategoryStats, getGlobalStats } from '../../utils/statsStorage'
import { CATEGORIES, MODES, DIFFICULTIES } from '../../constants/quiz'
import type { GameMode, Difficulty } from '../../types/quiz'

interface Props {
  onBack: () => void
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

export default function StatsPage({ onBack }: Props) {
  const [filterMode, setFilterMode] = useState<GameMode>('normal')
  const [filterDiff, setFilterDiff] = useState<Difficulty>('easy')

  const global = getGlobalStats()
  const globalRate = global.totalQuestions > 0
    ? Math.round((global.totalCorrect / global.totalQuestions) * 100)
    : 0

  const catsWithStats = CATEGORIES.map(cat => ({
    ...cat,
    stats: getCategoryStats(filterMode, filterDiff, cat.value),
  }))

  const sorted = [
    ...catsWithStats.filter(c => c.stats.gamesPlayed > 0),
    ...catsWithStats.filter(c => c.stats.gamesPlayed === 0),
  ]

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
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="text-[10px] font-bold uppercase tracking-widest text-white/30"
          >
            Statistiques
          </motion.p>
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
            {/* Bloc global */}
            <motion.div variants={fadeUp}>
              <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-white/30">Global</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2">
                <StatTile label="Parties" value={global.gamesPlayed} />
                <StatTile label="Réussite" value={`${globalRate}%`} accent="text-neon-violet" />
                <StatTile label="Série max" value={`${global.bestStreak}×`} accent="text-yellow-400" />
                <StatTile
                  label="Parfait en"
                  value={global.fastestPerfect !== null ? `${global.fastestPerfect.toFixed(1)}s` : '—'}
                  accent={global.fastestPerfect !== null ? 'text-game-success' : 'text-white/30'}
                />
              </div>
            </motion.div>

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

          {/* Colonne droite — Cards catégories */}
          <motion.div
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05, delayChildren: 0.2 } } }}
            initial="hidden"
            animate="show"
            className="pb-8"
          >
            <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-white/30">Par catégorie</p>

            {/* Grille : 1 col mobile, 2 cols lg */}
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
          </motion.div>
        </div>
      </div>
    </div>
  )
}
