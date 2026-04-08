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
    // Phase 3 will replace this timeout with the full explosion animation
    setTimeout(() => setScreen('quiz'), 1200)
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
      <AnimatePresence mode="wait">
        {(screen === 'landing' || screen === 'launching') && (
          <LandingPage key="landing" onStart={handleStart} screen={screen} />
        )}

        {screen === 'quiz' && (
          <QuizContainer key="quiz" onFinished={handleFinished} />
        )}

        {screen === 'result' && (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex min-h-screen flex-col items-center justify-center gap-8 bg-game-bg px-4"
          >
            <p className="text-6xl font-black text-white">
              {finalScore}
              <span className="text-white/30 text-4xl"> / 10</span>
            </p>
            <p className="text-white/50 text-lg">
              Result screen — Phase 6 coming soon
            </p>
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
