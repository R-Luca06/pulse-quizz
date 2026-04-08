import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import LandingPage from './components/landing/LandingPage'
import QuizContainer from './components/quiz/QuizContainer'
import ResultScreen from './components/result/ResultScreen'
import { getBestScore, saveBestScore } from './utils/storage'
import type { QuestionResult, GameMode, Difficulty, Language, Category } from './types/quiz'

export type AppScreen = 'landing' | 'launching' | 'quiz' | 'result'

export default function App() {
  const [screen, setScreen] = useState<AppScreen>('landing')
  const [finalScore, setFinalScore] = useState(0)
  const [finalResults, setFinalResults] = useState<QuestionResult[]>([])
  const [gameMode, setGameMode] = useState<GameMode>('normal')
  const [difficulty, setDifficulty] = useState<Difficulty>('easy')
  const [language, setLanguage] = useState<Language>('en')
  const [category, setCategory] = useState<Category>('all')
  const [bestScore, setBestScore] = useState(0)
  const [isNewBest, setIsNewBest] = useState(false)

  function handleStart(mode: GameMode, diff: Difficulty, lang: Language, cat: Category) {
    setGameMode(mode)
    setDifficulty(diff)
    setLanguage(lang)
    setCategory(cat)
    setScreen('launching')
  }

  function handleExplosion() { setScreen('quiz') }

  function handleFinished(score: number, results: QuestionResult[]) {
    const prev = getBestScore(gameMode, difficulty)
    const newBest = score > prev
    if (newBest) saveBestScore(gameMode, difficulty, score)
    setBestScore(newBest ? score : prev)
    setIsNewBest(newBest)
    setFinalScore(score)
    setFinalResults(results)
    setScreen('result')
  }

  function handleQuit() { setScreen('landing') }

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
            <QuizContainer
              onFinished={handleFinished}
              onQuit={handleQuit}
              gameMode={gameMode}
              difficulty={difficulty}
              language={language}
              category={category}
            />
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
            <ResultScreen
              score={finalScore}
              results={finalResults}
              onReplay={handleReplay}
              bestScore={bestScore}
              isNewBest={isNewBest}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
