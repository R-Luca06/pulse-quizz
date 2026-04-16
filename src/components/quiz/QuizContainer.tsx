import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuiz } from '../../hooks/useQuiz'
import { useTimer } from '../../hooks/useTimer'
import { playTick } from '../../utils/sounds'
import QuestionCard from './QuestionCard'
import TimerBar from './TimerBar'
import StreakIndicator from './StreakIndicator'

import type { QuestionResult, GameMode, Difficulty, Language, Category } from '../../types/quiz'
import { QUESTION_DURATION, URGENT_THRESHOLD, COMBO_MILESTONES, COMP_SPEED_TIERS } from '../../constants/game'

interface Props {
  onFinished: (score: number, results: QuestionResult[]) => void
  onQuit: () => void
  gameMode: GameMode
  difficulty: Difficulty
  language: Language
  category: Category
  isLoadingRanking?: boolean
}

const FEEDBACK_COLORS: Record<string, string> = {
  correct:  'inset 0 0 160px rgba(34, 197, 94, 0.38)',
  wrong:    'inset 0 0 160px rgba(239, 68, 68, 0.38)',
  timeout:  '',
  idle:     '',
}


interface BallConfig { id: number; top: number; left: number; size: number; opacity: number; floatY: number; duration: number; delay: number }

const BALLS: BallConfig[] = Array.from({ length: 40 }, (_, i) => ({
  id: i,
  top:      Math.floor(Math.random() * 90 + 5),
  left:     Math.floor(Math.random() * 92 + 4),
  size:     Math.floor(6 + Math.random() * 10),
  opacity:  parseFloat((0.1 + Math.random() * 0.22).toFixed(2)),
  floatY:   Math.floor(6 + Math.random() * 10),
  duration: parseFloat((5 + Math.random() * 7).toFixed(1)),
  delay:    parseFloat((-8 + Math.random() * 8).toFixed(1)),
}))

export default function QuizContainer({ onFinished, onQuit, gameMode, difficulty, language, category, isLoadingRanking = false }: Props) {
  const {
    phase,
    isRetrying,
    currentQuestion,
    currentIndex,
    score,
    streak,
    selectedAnswer,
    answerState,
    totalAnswered,
    currentMultiplier,
    handleAnswer,
    handleTimeout,
    retry,
  } = useQuiz(onFinished, { gameMode, difficulty, language, category })

  const { timeLeft, progress } = useTimer(
    QUESTION_DURATION,
    phase === 'playing',
    currentIndex,
    handleTimeout,
  )

  const isUrgent = timeLeft <= URGENT_THRESHOLD && timeLeft > 0 && phase === 'playing'
  const showFeedback = answerState === 'correct' || answerState === 'wrong'

  // Tick once per second during the urgent zone (Math.ceil changes only at each integer boundary)
  const urgentSecond = isUrgent ? Math.ceil(timeLeft) : 0
  useEffect(() => {
    if (urgentSecond > 0) playTick()
  }, [urgentSecond])


  // Daily info overlay
  const [showDailyInfo, setShowDailyInfo] = useState(false)

  // Combo overlay at milestone streaks
  const [comboVisible, setComboVisible] = useState(false)
  const [comboValue, setComboValue] = useState(0)
  const prevStreakRef = useRef(streak)

  useEffect(() => {
    const prev = prevStreakRef.current
    prevStreakRef.current = streak
    if (streak > prev && COMBO_MILESTONES.includes(streak)) {
      queueMicrotask(() => {
        setComboValue(streak)
        setComboVisible(true)
      })
      const id = setTimeout(() => setComboVisible(false), 900)
      return () => clearTimeout(id)
    }
  }, [streak])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{
        opacity: 1,
        scale: isUrgent ? [1, 1.004, 1] : 1,
      }}
      exit={{ opacity: 0 }}
      transition={
        isUrgent
          ? { scale: { duration: 0.7, repeat: Infinity, ease: 'easeInOut' } }
          : undefined
      }
      className="flex min-h-screen flex-col bg-game-bg"
    >
      {/* Ambient balls — scattered, float slowly, color shifts with timer */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        {BALLS.map((ball) => (
          <motion.div
            key={ball.id}
            className="absolute rounded-full"
            style={{
              top: `${ball.top}%`,
              left: `${ball.left}%`,
              width: ball.size,
              height: ball.size,
              opacity: ball.opacity,
            }}
            animate={{
              backgroundColor:
                answerState === 'correct' ? '#22C55E'
                : answerState === 'wrong' || answerState === 'timeout' ? '#EF4444'
                : isUrgent ? '#EF4444'
                : timeLeft <= 6 ? '#F97316'
                : '#8B5CF6',
              y: [0, -ball.floatY, 0],
            }}
            transition={{
              backgroundColor: { duration: 0.4 },
              y: { duration: ball.duration, delay: ball.delay, repeat: Infinity, ease: 'easeInOut' },
            }}
          />
        ))}
      </div>

      {/* Answer feedback vignette */}
      <AnimatePresence>
        {showFeedback && (
          <motion.div
            key={`feedback-${currentIndex}-${answerState}`}
            className="pointer-events-none fixed inset-0 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.55, ease: 'easeOut', times: [0, 0.2, 1] }}
            style={{ boxShadow: FEEDBACK_COLORS[answerState] }}
          />
        )}
      </AnimatePresence>

      {/* Combo milestone overlay */}
      <AnimatePresence>
        {comboVisible && (
          <motion.div
            key={`combo-${comboValue}`}
            className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: [0.4, 1.15, 1], opacity: [0, 1, 1] }}
              exit={{ scale: 1.3, opacity: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="flex flex-col items-center gap-1 text-center"
            >
              <span className="text-5xl font-black tracking-tight text-yellow-400 drop-shadow-[0_0_24px_rgba(234,179,8,0.8)]">
                ×{comboValue}
              </span>
              <span className="text-xs font-bold uppercase tracking-widest text-yellow-400/70">
                Combo !
              </span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Timer bar */}
      <TimerBar progress={progress} timeLeft={phase === 'playing' ? timeLeft : 10} />

      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 sm:px-6 sm:py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onQuit}
            aria-label="Quitter la partie"
            className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/30 transition-colors hover:border-white/20 hover:text-white/60"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
          {gameMode === 'daily' && (
            <button
              onClick={() => setShowDailyInfo(true)}
              aria-label="Règles du défi journalier"
              className="flex h-6 w-6 items-center justify-center rounded-full border border-neon-violet/30 bg-[#0d0d18] text-xs font-bold text-neon-violet/70 transition-colors hover:border-neon-violet/60 hover:text-neon-violet"
            >
              i
            </button>
          )}
          <div className="text-sm font-semibold text-white/40">
            <span className="text-white">
              {gameMode === 'compétitif' ? totalAnswered + 1 : currentIndex + 1}
            </span>
            {gameMode === 'normal' && <span> / 10</span>}
            {gameMode === 'daily'  && <span> / 10</span>}
          </div>
        </div>
        <StreakIndicator streak={streak} />
        <div className="flex items-center gap-2">
          {/* Badge multiplicateur — compétitif + daily */}
          {(gameMode === 'compétitif' || gameMode === 'daily') && phase === 'playing' && (
            <motion.div
              key={currentMultiplier}
              initial={{ scale: 1.3, opacity: 0.6 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 22 }}
              className={[
                'rounded-lg border px-2 py-0.5 text-xs font-black',
                currentMultiplier >= 3
                  ? 'border-yellow-500/40 bg-yellow-500/15 text-yellow-400'
                  : currentMultiplier >= 2
                  ? 'border-purple-500/40 bg-purple-500/15 text-purple-400'
                  : currentMultiplier >= 1.5
                  ? 'border-blue-500/40 bg-blue-500/15 text-blue-400'
                  : currentMultiplier >= 1.2
                  ? 'border-white/15 bg-white/5 text-white/40'
                  : 'border-white/10 bg-white/3 text-white/25',
              ].join(' ')}
            >
              ×{currentMultiplier % 1 === 0 ? currentMultiplier : currentMultiplier}
            </motion.div>
          )}
          <div className="text-sm font-semibold">
            <motion.span
              key={score}
              className="inline-block text-neon-violet"
              initial={{ scale: 1.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 22 }}
            >
              {score}
            </motion.span>
            <span className="text-white/40"> pts</span>
          </div>
        </div>
      </div>

      {/* Overlay info daily */}
      <AnimatePresence>
        {showDailyInfo && (
          <>
            <motion.div
              key="daily-info-backdrop"
              className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => setShowDailyInfo(false)}
            />
            <motion.div
              key="daily-info-modal"
              className="fixed inset-0 z-[70] flex items-center justify-center px-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <motion.div
                className="relative w-full max-w-sm rounded-2xl border border-neon-violet/20 bg-[#0d0d18] p-6 shadow-[0_0_40px_rgba(139,92,246,0.15)]"
                initial={{ scale: 0.92, y: 16 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 8 }}
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">📅</span>
                    <h2 className="text-base font-black text-neon-violet">Défi Journalier</h2>
                  </div>
                  <button
                    onClick={() => setShowDailyInfo(false)}
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/40 transition-colors hover:border-white/20 hover:text-white/70"
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>
                <div className="flex flex-col gap-3 text-sm text-white/60">
                  <div className="flex flex-col gap-2">
                    {[
                      { icon: '📅', text: '10 questions thématiques — une seule tentative par jour' },
                      { icon: '⚡', text: 'Réponds vite pour multiplier tes points — même système que le mode compétitif' },
                      { icon: '✓', text: 'Pas d\'élimination — la partie continue même sur une mauvaise réponse' },
                      { icon: '🔥', text: 'Ton multiplicateur XP augmente avec ta série de jours consécutifs' },
                    ].map((rule, i) => (
                      <div key={i} className="flex items-start gap-3 rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2.5">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center text-base leading-none">{rule.icon}</span>
                        <span className="leading-snug">{rule.text}</span>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-xl border border-neon-violet/15 bg-neon-violet/5 p-3">
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-neon-violet/60">Multiplicateurs de vitesse</p>
                    <div className="flex flex-col gap-1">
                      {COMP_SPEED_TIERS.map(t => {
                        const label = t.maxTime === Infinity ? '> 8s' : `≤ ${t.maxTime}s`
                        const color = t.multiplier >= 3 ? 'text-yellow-400' : t.multiplier >= 2 ? 'text-purple-400' : t.multiplier >= 1.5 ? 'text-blue-400' : t.multiplier >= 1.2 ? 'text-white/50' : 'text-white/30'
                        return (
                          <div key={t.maxTime} className="flex items-center justify-between">
                            <span className="text-xs text-white/40">{label}</span>
                            <span className={`text-xs font-bold ${color}`}>×{t.multiplier}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
                <motion.button
                  onClick={() => setShowDailyInfo(false)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="mt-5 w-full rounded-xl bg-gradient-to-r from-neon-violet to-neon-blue py-2.5 text-sm font-bold text-white shadow-[0_0_20px_rgba(139,92,246,0.3)]"
                >
                  Compris !
                </motion.button>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Overlay chargement classement (mode compétitif) */}
      <AnimatePresence>
        {isLoadingRanking && (
          <motion.div
            key="loading-ranking"
            className="pointer-events-none fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-game-bg/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <motion.div
              className="h-12 w-12 rounded-full border-2 border-neon-violet/30 border-t-neon-violet"
              animate={{ rotate: 360 }}
              transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
            />
            <p className="text-sm uppercase tracking-widest text-white/40">Chargement du classement…</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex flex-1 items-center justify-center px-4 py-6">
        {phase === 'loading' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-4"
          >
            <motion.div
              className="h-12 w-12 rounded-full border-2 border-neon-violet/30 border-t-neon-violet"
              animate={{ rotate: 360 }}
              transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
            />
            <p className="text-sm uppercase tracking-widest text-white/40">
            {isRetrying ? 'Trop de requêtes — nouvel essai dans 5s…' : 'Chargement…'}
          </p>
          </motion.div>
        )}

        {phase === 'error' && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-5 text-center"
          >
            <p className="text-lg font-bold text-white">Impossible de charger les questions</p>
            <p className="text-sm text-white/40">Vérifie ta connexion et réessaie.</p>
            <motion.button
              onClick={retry}
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.96 }}
              className="rounded-full bg-gradient-to-r from-neon-violet to-neon-blue px-8 py-3 text-sm font-bold text-white shadow-neon-violet"
            >
              Réessayer
            </motion.button>
          </motion.div>
        )}

        {(phase === 'playing' || phase === 'feedback') && currentQuestion && (
          <div className="flex w-full max-w-2xl flex-col gap-2 lg:max-w-3xl">
            <QuestionCard
              question={currentQuestion}
              currentIndex={currentIndex}
              answerState={answerState}
              selectedAnswer={selectedAnswer}
              onAnswer={handleAnswer}
            />
            {/* Next-question progress bar during feedback */}
            <div className="h-0.5 w-full overflow-hidden rounded-full bg-white/5">
              <AnimatePresence>
                {phase === 'feedback' && (
                  <motion.div
                    key={`progress-${currentIndex}`}
                    className={`h-full rounded-full ${answerState === 'correct' ? 'bg-game-success' : 'bg-game-danger'}`}
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.45, ease: 'linear' }}
                  />
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}
