import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuiz } from '../../hooks/useQuiz'
import { useTimer } from '../../hooks/useTimer'
import { playTick } from '../../utils/sounds'
import QuestionCard from './QuestionCard'
import TimerBar from './TimerBar'
import StreakIndicator from './StreakIndicator'

import type { QuestionResult } from '../../types/quiz'

interface Props {
  onFinished: (score: number, results: QuestionResult[]) => void
}

const FEEDBACK_COLORS = {
  correct: 'inset 0 0 160px rgba(34, 197, 94, 0.38)',
  wrong:   'inset 0 0 160px rgba(239, 68, 68, 0.38)',
}

const COMBO_MILESTONES = [3, 5, 7, 10]

export default function QuizContainer({ onFinished }: Props) {
  const {
    phase,
    isRetrying,
    currentQuestion,
    currentIndex,
    score,
    streak,
    selectedAnswer,
    answerState,
    handleAnswer,
    handleTimeout,
    retry,
  } = useQuiz(onFinished)

  const { timeLeft, progress } = useTimer(
    10,
    phase === 'playing',
    currentIndex,
    handleTimeout,
  )

  const isUrgent = timeLeft <= 3 && timeLeft > 0 && phase === 'playing'
  const showFeedback = answerState === 'correct' || answerState === 'wrong'

  // Tick once per second during the urgent zone (Math.ceil changes only at each integer boundary)
  const urgentSecond = isUrgent ? Math.ceil(timeLeft) : 0
  useEffect(() => {
    if (urgentSecond > 0) playTick()
  }, [urgentSecond])

  // Combo overlay at milestone streaks
  const [comboVisible, setComboVisible] = useState(false)
  const [comboValue, setComboValue] = useState(0)
  const prevStreakRef = useRef(streak)

  useEffect(() => {
    const prev = prevStreakRef.current
    prevStreakRef.current = streak
    if (streak > prev && COMBO_MILESTONES.includes(streak)) {
      setComboValue(streak)
      setComboVisible(true)
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
      {/* Ambient background blobs — color shifts with timer */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <motion.div
          className="absolute left-1/4 top-1/3 h-[480px] w-[480px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
          animate={{
            background: isUrgent
              ? 'rgba(239,68,68,0.13)'
              : timeLeft <= 6
              ? 'rgba(249,115,22,0.09)'
              : 'rgba(139,92,246,0.09)',
            x: [0, 24, -16, 0],
            y: [0, -18, 12, 0],
          }}
          transition={{
            background: { duration: 1.2 },
            x: { duration: 18, repeat: Infinity, ease: 'easeInOut' },
            y: { duration: 14, repeat: Infinity, ease: 'easeInOut' },
          }}
        />
        <motion.div
          className="absolute right-1/4 top-2/3 h-[360px] w-[360px] translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
          animate={{
            background: isUrgent
              ? 'rgba(220,38,38,0.10)'
              : timeLeft <= 6
              ? 'rgba(234,179,8,0.07)'
              : 'rgba(59,130,246,0.08)',
            x: [0, -20, 14, 0],
            y: [0, 14, -20, 0],
          }}
          transition={{
            background: { duration: 1.2 },
            x: { duration: 22, repeat: Infinity, ease: 'easeInOut' },
            y: { duration: 17, repeat: Infinity, ease: 'easeInOut' },
          }}
        />
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
            style={{ boxShadow: FEEDBACK_COLORS[answerState as 'correct' | 'wrong'] }}
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
        <div className="text-sm font-semibold text-white/40">
          <span className="text-white">{currentIndex + 1}</span>
          <span> / 10</span>
        </div>
        <StreakIndicator streak={streak} />
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
          <div className="flex w-full max-w-2xl flex-col gap-2">
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
