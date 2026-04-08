import { motion, AnimatePresence } from 'framer-motion'
import { useQuiz } from '../../hooks/useQuiz'
import { useTimer } from '../../hooks/useTimer'
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

export default function QuizContainer({ onFinished }: Props) {
  const {
    phase,
    currentQuestion,
    currentIndex,
    score,
    streak,
    selectedAnswer,
    answerState,
    handleAnswer,
    handleTimeout,
  } = useQuiz(onFinished)

  const { timeLeft, progress } = useTimer(
    10,
    phase === 'playing',
    currentIndex,
    handleTimeout,
  )

  const isUrgent = timeLeft <= 3 && timeLeft > 0 && phase === 'playing'
  const showFeedback = answerState === 'correct' || answerState === 'wrong'

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
      {/* Answer feedback vignette — brief green/red flash on answer */}
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

      {/* Timer bar + urgency vignette */}
      <TimerBar progress={progress} timeLeft={phase === 'playing' ? timeLeft : 10} />

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3">
        <div className="text-sm font-semibold text-white/40">
          <span className="text-white">{currentIndex + 1}</span>
          <span> / 10</span>
        </div>
        <StreakIndicator streak={streak} />
        <div className="text-sm font-semibold">
          <span className="text-neon-violet">{score}</span>
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
            <p className="text-sm uppercase tracking-widest text-white/40">Loading questions…</p>
          </motion.div>
        )}

        {(phase === 'playing' || phase === 'feedback') && currentQuestion && (
          <div className="w-full max-w-2xl">
            <QuestionCard
              question={currentQuestion}
              currentIndex={currentIndex}
              answerState={answerState}
              selectedAnswer={selectedAnswer}
              onAnswer={handleAnswer}
            />
          </div>
        )}
      </div>
    </motion.div>
  )
}
