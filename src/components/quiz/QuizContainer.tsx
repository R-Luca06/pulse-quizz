import { motion } from 'framer-motion'
import { useQuiz } from '../../hooks/useQuiz'
import QuestionCard from './QuestionCard'

interface Props {
  onFinished: (score: number) => void
}

export default function QuizContainer({ onFinished }: Props) {
  const { phase, currentQuestion, currentIndex, score, streak, selectedAnswer, answerState, handleAnswer } =
    useQuiz(onFinished)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex min-h-screen flex-col bg-game-bg"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4">
        {/* Question progress */}
        <div className="text-sm font-semibold text-white/40">
          <span className="text-white">{currentIndex + 1}</span>
          <span> / 10</span>
        </div>

        {/* Streak */}
        {streak >= 2 && (
          <motion.div
            key={streak}
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-center gap-1.5 rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-1 text-sm font-bold text-yellow-400"
          >
            🔥 {streak} streak
          </motion.div>
        )}

        {/* Score */}
        <div className="text-sm font-semibold">
          <span className="text-neon-violet">{score}</span>
          <span className="text-white/40"> pts</span>
        </div>
      </div>

      {/* Progress bar (placeholder — Phase 5 adds the timer) */}
      <div className="h-1 w-full bg-white/5">
        <motion.div
          className="h-full bg-gradient-to-r from-neon-violet to-neon-blue"
          animate={{ width: `${((currentIndex) / 10) * 100}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>

      {/* Main content */}
      <div className="flex flex-1 items-center justify-center px-4 py-8">
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
            <p className="text-white/40 text-sm tracking-widest uppercase">Loading questions…</p>
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
