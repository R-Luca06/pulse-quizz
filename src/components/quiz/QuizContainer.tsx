import { motion } from 'framer-motion'
import { useQuiz } from '../../hooks/useQuiz'
import { useTimer } from '../../hooks/useTimer'
import QuestionCard from './QuestionCard'
import TimerBar from './TimerBar'
import StreakIndicator from './StreakIndicator'

interface Props {
  onFinished: (score: number) => void
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
      {/* Timer bar + urgency vignette */}
      <TimerBar progress={progress} timeLeft={phase === 'playing' ? timeLeft : 10} />

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3">
        {/* Question progress */}
        <div className="text-sm font-semibold text-white/40">
          <span className="text-white">{currentIndex + 1}</span>
          <span> / 10</span>
        </div>

        {/* Streak */}
        <StreakIndicator streak={streak} />

        {/* Score */}
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
