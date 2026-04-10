import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CATEGORY_LABELS, DIFFICULTY_LABELS, MODE_LABELS, LANGUAGE_LABELS } from '../../constants/quiz'
import { NORMAL_MODE_QUESTIONS } from '../../constants/game'
import { computeBestStreak } from '../../utils/statsStorage'
import { useAuth } from '../../hooks/useAuth'
import type { QuestionResult, GameMode, Difficulty, Category, Language } from '../../types/quiz'

interface Props {
  score: number
  results: QuestionResult[]
  onReplay: () => void
  onBack: () => void
  onShowStats: () => void
  onShowLeaderboard: () => void
  onOpenAuth: () => void
  bestScore: number
  isNewBest: boolean
  gameMode: GameMode
  difficulty: Difficulty
  category: Category
  language: Language
  userRank?: number | null
  rankDelta?: number | null
}

const NORMAL_TIERS = [
  { min: 10, label: 'Parfait !',         color: '#EAB308' },
  { min: 7,  label: 'Impressionnant !',  color: '#8B5CF6' },
  { min: 4,  label: 'Pas mal !',         color: '#3B82F6' },
  { min: 0,  label: 'Retente ta chance', color: '#6B7280' },
]

const COMP_TIERS = [
  { min: 2000, label: 'Légendaire',   color: '#EAB308' },
  { min: 1000, label: 'Élite',        color: '#8B5CF6' },
  { min: 500,  label: 'Compétiteur',  color: '#3B82F6' },
  { min: 0,    label: 'Débutant',     color: '#6B7280' },
]

const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }

export default function ResultScreen({ score, results, onReplay, onBack, onShowStats, onShowLeaderboard, onOpenAuth, bestScore, isNewBest, gameMode, difficulty, category, language, userRank, rankDelta }: Props) {
  const { user } = useAuth()
  const isCompetitif = gameMode === 'compétitif'
  const tiers = isCompetitif ? COMP_TIERS : NORMAL_TIERS
  const tier = tiers.find(t => score >= t.min) ?? tiers[tiers.length - 1]
  const [displayed, setDisplayed] = useState(0)
  const [recapOpen, setRecapOpen] = useState(false)
  useEffect(() => {
    if (score === 0) return
    let current = 0
    const step = Math.max(1, Math.ceil(score / 20))
    const id = setInterval(() => {
      current = Math.min(current + step, score)
      setDisplayed(current)
      if (current >= score) clearInterval(id)
    }, 50)
    return () => clearInterval(id)
  }, [score])

  const total = results.length
  const correct = results.filter(r => r.isCorrect).length
  const timeout = results.filter(r => r.userAnswer === null).length
  const wrong = total - correct - timeout
  const bestStreak = computeBestStreak(results)

  const contextPills = isCompetitif
    ? [MODE_LABELS[gameMode], LANGUAGE_LABELS[language]]
    : [MODE_LABELS[gameMode], DIFFICULTY_LABELS[difficulty], CATEGORY_LABELS[String(category)] ?? String(category)]

  return (
    <div className="relative flex min-h-screen flex-col items-center overflow-y-auto bg-game-bg px-4 py-6 sm:py-10">
      {/* Background blob */}
      <div className="pointer-events-none fixed inset-0">
        <div
          className="absolute left-1/2 top-1/3 h-[250px] w-[250px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl sm:h-[400px] sm:w-[400px] md:h-[500px] md:w-[500px]"
          style={{ background: `${tier.color}15` }}
        />
        {/* Thème chaud pour le mode compétitif */}
        {isCompetitif && (
          <div className="absolute right-1/4 bottom-1/4 h-64 w-64 translate-x-1/2 translate-y-1/2 rounded-full bg-orange-500/5 blur-3xl" />
        )}
      </div>

      <div className="relative z-10 flex w-full max-w-lg flex-col gap-6">

        {/* Header */}
        <div className="flex w-full items-center justify-between">
          <motion.button
            onClick={onBack}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, delay: 0.1 }}
            className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/40 transition-colors hover:border-white/20 hover:text-white/70"
          >
            ← Accueil
          </motion.button>
          <motion.div
            className="flex gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.35, delay: 0.15 }}
          >
            <button
              onClick={onShowLeaderboard}
              aria-label="Voir le classement"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/30 transition-colors hover:border-white/20 hover:text-white/60"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 6h8M8 12h8M8 18h8M3 6h.01M3 12h.01M3 18h.01"/>
              </svg>
            </button>
            <button
              onClick={onShowStats}
              aria-label="Voir les statistiques"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/30 transition-colors hover:border-white/20 hover:text-white/60"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="18" y="3" width="4" height="18" rx="1"/>
                <rect x="10" y="8" width="4" height="13" rx="1"/>
                <rect x="2" y="13" width="4" height="8" rx="1"/>
              </svg>
            </button>
          </motion.div>
          <motion.button
            onClick={onReplay}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, delay: 0.1 }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            className={[
              'rounded-full px-4 py-1.5 text-xs font-bold text-white',
              isCompetitif
                ? 'bg-gradient-to-r from-orange-500 to-red-500 shadow-[0_0_12px_rgba(249,115,22,0.4)]'
                : 'bg-gradient-to-r from-neon-violet to-neon-blue shadow-neon-violet',
            ].join(' ')}
          >
            ↺ Rejouer
          </motion.button>
        </div>

        <motion.div
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1, delayChildren: 0.2 } } }}
          initial="hidden"
          animate="show"
          className="flex w-full flex-col items-center gap-6"
        >
          {/* Score */}
          <motion.div variants={fadeUp} className="flex flex-col items-center gap-2 text-center">
            <div className="flex items-end gap-2">
              <span className="text-5xl font-black leading-none tabular-nums sm:text-7xl md:text-8xl" style={{ color: tier.color }}>
                {displayed}
              </span>
              {isCompetitif ? (
                <span className="mb-2 text-xl font-black text-white/20 sm:text-2xl">pts</span>
              ) : (
                <span className="mb-2 text-2xl font-black text-white/20 sm:text-3xl md:text-4xl">/10</span>
              )}
            </div>
            {isNewBest ? (
              <motion.span
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.4 }}
                className="rounded-full bg-yellow-400/15 px-3 py-1 text-xs font-bold uppercase tracking-widest text-yellow-400"
              >
                Nouveau record !
              </motion.span>
            ) : bestScore > 0 ? (
              <span className="text-xs text-white/25">
                {isCompetitif ? `Record : ${bestScore} pts` : `Record : ${bestScore}/10`}
              </span>
            ) : null}
          </motion.div>

          {/* Score dots — mode normal uniquement */}
          {!isCompetitif && (
            <motion.div variants={fadeUp} className="flex gap-2">
              {Array.from({ length: 10 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="h-2 w-5 rounded-full"
                  initial={{ scaleX: 0, backgroundColor: '#1E1E2E' }}
                  animate={{ scaleX: 1, backgroundColor: i < score ? tier.color : '#1E1E2E' }}
                  transition={{ delay: 0.35 + i * 0.06, duration: 0.22 }}
                  style={{ originX: 0 }}
                />
              ))}
            </motion.div>
          )}

          {/* Performance label */}
          <motion.div variants={fadeUp} className="flex flex-col items-center gap-1 text-center">
            <p className="text-xl font-bold text-white sm:text-2xl">{tier.label}</p>
            <p className="text-sm text-white/30">
              {isCompetitif
                ? `${correct} bonne${correct > 1 ? 's' : ''} réponse${correct > 1 ? 's' : ''} · ${score} pts`
                : score === NORMAL_MODE_QUESTIONS
                  ? 'Tu as répondu juste à toutes les questions !'
                  : score === 0
                  ? 'Toutes les questions ont eu raison de toi.'
                  : `${score} bonne${score > 1 ? 's' : ''} réponse${score > 1 ? 's' : ''} sur ${NORMAL_MODE_QUESTIONS}`}
            </p>
          </motion.div>

          {/* Context pills */}
          <motion.div variants={fadeUp} className="flex flex-wrap items-center justify-center gap-1.5">
            {contextPills.map((label, i) => (
              <span
                key={i}
                className={[
                  'rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider',
                  isCompetitif && i === 0
                    ? 'border-orange-500/30 bg-orange-500/10 text-orange-400/70'
                    : 'border-white/10 bg-white/5 text-white/30',
                ].join(' ')}
              >
                {isCompetitif && i === 0 ? '🔥 ' : ''}{label}
              </span>
            ))}
          </motion.div>

          {/* Stats */}
          {total > 0 && (
            <motion.div variants={fadeUp} className="w-full">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-white/30">Statistiques</p>

              {/* Breakdown bar */}
              <div className="mb-4 flex h-2 w-full overflow-hidden rounded-full bg-white/5">
                {correct > 0 && (
                  <motion.div
                    className="h-full bg-game-success"
                    initial={{ width: 0 }}
                    animate={{ width: `${(correct / total) * 100}%` }}
                    transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
                  />
                )}
                {wrong > 0 && (
                  <motion.div
                    className="h-full bg-game-danger"
                    initial={{ width: 0 }}
                    animate={{ width: `${(wrong / total) * 100}%` }}
                    transition={{ duration: 0.6, delay: 0.4, ease: 'easeOut' }}
                  />
                )}
                {timeout > 0 && (
                  <motion.div
                    className="h-full bg-white/20"
                    initial={{ width: 0 }}
                    animate={{ width: `${(timeout / total) * 100}%` }}
                    transition={{ duration: 0.6, delay: 0.5, ease: 'easeOut' }}
                  />
                )}
              </div>

              {/* Counters row */}
              <div className="grid grid-cols-4 gap-2">
                <div className="flex flex-col items-center gap-1 rounded-xl border border-white/8 bg-white/3 py-3">
                  <span className="text-lg font-black text-game-success">{correct}</span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-white/30">Correct</span>
                </div>
                <div className="flex flex-col items-center gap-1 rounded-xl border border-white/8 bg-white/3 py-3">
                  <span className="text-lg font-black text-game-danger">{wrong}</span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-white/30">Faux</span>
                </div>
                <div className="flex flex-col items-center gap-1 rounded-xl border border-white/8 bg-white/3 py-3">
                  <span className="text-lg font-black text-white/40">{timeout}</span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-white/30">Timeout</span>
                </div>
                <div className="flex flex-col items-center gap-1 rounded-xl border border-white/8 bg-white/3 py-3">
                  <span className="text-lg font-black text-yellow-400">{bestStreak}×</span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-white/30">Série</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Classement — section différente selon le mode */}
          <motion.div variants={fadeUp} className="w-full">
            {isCompetitif ? (
              /* Mode compétitif — publication automatique */
              !user ? (
                <div className="flex flex-col gap-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Classement</p>
                  <button
                    onClick={onOpenAuth}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-orange-500/20 bg-orange-500/5 px-4 py-2.5 text-xs font-semibold text-orange-400/70 transition-colors hover:border-orange-500/40 hover:text-orange-400"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                    Connecte-toi pour apparaître dans le classement
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Classement</p>
                  <div className="flex items-center justify-between rounded-lg border border-orange-500/15 bg-orange-500/5 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-black text-white">
                        {userRank === null || userRank === undefined ? (
                          <span className="text-sm font-semibold text-white/40">Calcul…</span>
                        ) : (
                          `#${userRank}`
                        )}
                      </span>
                      {rankDelta !== null && rankDelta !== undefined && rankDelta !== 0 && (
                        <span className={`text-xs font-bold ${rankDelta > 0 ? 'text-game-success' : 'text-game-danger'}`}>
                          {rankDelta > 0 ? `↑ ${rankDelta}` : `↓ ${Math.abs(rankDelta)}`}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={onShowLeaderboard}
                      className="text-xs text-orange-400 underline underline-offset-2 hover:text-orange-300"
                    >
                      Voir le classement →
                    </button>
                  </div>
                </div>
              )
            ) : null}
          </motion.div>

          {/* Récapitulatif toggle */}
          {results.length > 0 && (
            <motion.div variants={fadeUp} className="w-full">
              <button
                onClick={() => setRecapOpen(v => !v)}
                className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-semibold uppercase tracking-widest text-white/30 transition-colors hover:text-white/50"
              >
                <span>Récapitulatif</span>
                <motion.svg
                  animate={{ rotate: recapOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  width="12" height="12" viewBox="0 0 12 12" fill="none"
                >
                  <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </motion.svg>
              </button>

              <AnimatePresence>
                {recapOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="flex flex-col gap-2 pt-2">
                      {results.map((r, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -12 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.04, duration: 0.25 }}
                          className={[
                            'rounded-xl border border-white/[0.08] border-l-2 bg-white/[0.03] px-4 py-3',
                            r.isCorrect ? 'border-l-game-success' : 'border-l-game-danger',
                          ].join(' ')}
                        >
                          <div className="flex items-start gap-3">
                            <span className={`mt-0.5 text-xs font-black tabular-nums ${r.isCorrect ? 'text-game-success' : 'text-game-danger'}`}>
                              {String(i + 1).padStart(2, '0')}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="line-clamp-2 text-xs leading-snug text-white/40">{r.question}</p>
                              <div className="mt-2 flex flex-col gap-1">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-1.5">
                                    <span className={`text-[10px] font-bold uppercase tracking-wider ${r.isCorrect ? 'text-game-success/60' : 'text-game-danger/60'}`}>
                                      {r.userAnswer === null ? 'Timeout' : r.isCorrect ? 'Correct' : 'Faux'}
                                    </span>
                                    <span className={`text-sm font-semibold ${r.isCorrect ? 'text-game-success' : r.userAnswer === null ? 'italic text-white/30' : 'text-game-danger'}`}>
                                      {r.userAnswer ?? '—'}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    {/* Multiplicateur et points — mode compétitif */}
                                    {isCompetitif && r.isCorrect && r.multiplier !== undefined && r.pointsEarned !== undefined && (
                                      <>
                                        <span className={[
                                          'rounded-full px-1.5 py-0.5 text-[10px] font-black',
                                          r.multiplier >= 3 ? 'bg-yellow-500/15 text-yellow-400'
                                          : r.multiplier >= 2 ? 'bg-purple-500/15 text-purple-400'
                                          : r.multiplier >= 1.5 ? 'bg-blue-500/15 text-blue-400'
                                          : 'bg-white/5 text-white/30',
                                        ].join(' ')}>
                                          ×{r.multiplier}
                                        </span>
                                        <span className="text-[10px] font-bold text-orange-400">+{r.pointsEarned}</span>
                                      </>
                                    )}
                                    <span className="text-[10px] font-semibold tabular-nums text-white/20">
                                      {r.timeSpent.toFixed(1)}s
                                    </span>
                                  </div>
                                </div>
                                {!r.isCorrect && (
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-game-success/50">Réponse</span>
                                    <span className="text-sm font-semibold text-game-success/80">{r.correctAnswer}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
