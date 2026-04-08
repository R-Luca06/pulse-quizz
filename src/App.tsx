import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import LandingPage from './components/landing/LandingPage'
import QuizContainer from './components/quiz/QuizContainer'

export type AppScreen = 'landing' | 'launching' | 'quiz' | 'result'

export default function App() {
  const [screen, setScreen] = useState<AppScreen>('landing')
  const [finalScore, setFinalScore] = useState(0)

  function handleStart() {
    setScreen('launching')
    // Cards converge in 0.5s → switch to quiz at 0.5s so the fade-out overlaps cleanly
    setTimeout(() => setScreen('quiz'), 500)
  }

  function handleFinished(score: number) {
    setFinalScore(score)
    setScreen('result')
  }

  function handleReplay() {
    setScreen('quiz')
  }

  return (
    <div className="min-h-screen bg-game-bg font-game">
      {/* mode="sync": quiz fades in while landing fades out — no frozen gap */}
      <AnimatePresence mode="sync">
        {(screen === 'landing' || screen === 'launching') && (
          <motion.div
            key="landing"
            exit={{ opacity: 0, transition: { duration: 0.35 } }}
            className="absolute inset-0"
          >
            <LandingPage onStart={handleStart} screen={screen} />
          </motion.div>
        )}

        {screen === 'quiz' && (
          <motion.div
            key="quiz"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.4 } }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
            className="absolute inset-0"
          >
            <QuizContainer onFinished={handleFinished} />
          </motion.div>
        )}

        {screen === 'result' && (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center gap-8 px-4"
          >
            <p className="text-6xl font-black text-white">
              {finalScore}
              <span className="text-4xl text-white/30"> / 10</span>
            </p>
            <p className="text-lg text-white/50">Result screen — Phase 6 coming soon</p>
            <button
              onClick={handleReplay}
              className="rounded-full bg-gradient-to-r from-neon-violet to-neon-blue px-8 py-3 font-bold text-white shadow-neon-violet"
            >
              Play again
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
