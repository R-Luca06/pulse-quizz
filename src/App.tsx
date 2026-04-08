import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import LandingPage from './components/landing/LandingPage'
import QuizContainer from './components/quiz/QuizContainer'
import ResultScreen from './components/result/ResultScreen'
import type { QuestionResult } from './types/quiz'

export type AppScreen = 'landing' | 'launching' | 'quiz' | 'result'

export default function App() {
  const [screen, setScreen] = useState<AppScreen>('landing')
  const [finalScore, setFinalScore] = useState(0)
  const [finalResults, setFinalResults] = useState<QuestionResult[]>([])

  function handleStart() { setScreen('launching') }
  function handleExplosion() { setScreen('quiz') }

  function handleFinished(score: number, results: QuestionResult[]) {
    setFinalScore(score)
    setFinalResults(results)
    setScreen('result')
  }

  function handleReplay() { setScreen('quiz') }

  return (
    <div className="min-h-screen bg-game-bg font-game">
      <AnimatePresence mode="sync">
        {(screen === 'landing' || screen === 'launching') && (
          <motion.div
            key="landing"
            exit={{ opacity: 0, transition: { duration: 0.35 } }}
            className="absolute inset-0"
          >
            <LandingPage onStart={handleStart} onExplosion={handleExplosion} screen={screen} />
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
          >
            <ResultScreen score={finalScore} results={finalResults} onReplay={handleReplay} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
