import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import LandingPage from './components/landing/LandingPage'
import QuizContainer from './components/quiz/QuizContainer'
import ResultScreen from './components/result/ResultScreen'
import StatsPage from './components/stats/StatsPage'
import AuthModal from './components/auth/AuthModal'
import { getBestScore, saveBestScore } from './utils/storage'
import { updateStats, getCategoryStats, getGlobalStats } from './utils/statsStorage'
import { syncCategoryStats, syncGlobalStats } from './services/cloudStats'
import { useSettings } from './hooks/useSettings'
import { useAuth } from './hooks/useAuth'
import type { QuestionResult } from './types/quiz'

export type AppScreen = 'landing' | 'launching' | 'quiz' | 'result' | 'stats'

interface GameResult {
  score: number
  results: QuestionResult[]
  bestScore: number
  isNewBest: boolean
}

export default function App() {
  const { settings, update } = useSettings()
  const { user } = useAuth()

  const [screen, setScreen] = useState<AppScreen>('landing')
  const [gameResult, setGameResult] = useState<GameResult>({ score: 0, results: [], bestScore: 0, isNewBest: false })
  const [returnToSettings, setReturnToSettings] = useState(false)
  const [statsOrigin, setStatsOrigin] = useState<'landing' | 'result'>('landing')
  const [statsDefaultTab, setStatsDefaultTab] = useState<'stats' | 'leaderboard'>('stats')
  const [statsInitialMode, setStatsInitialMode] = useState<typeof settings.mode | undefined>(undefined)
  const [statsInitialDiff, setStatsInitialDiff] = useState<typeof settings.difficulty | undefined>(undefined)
  const [authModalOpen, setAuthModalOpen] = useState(false)

  function handleStart() { setScreen('launching') }

  function handleExplosion() { setScreen('quiz') }

  function handleFinished(score: number, results: QuestionResult[]) {
    const { mode, difficulty, category } = settings
    const prev = getBestScore(mode, difficulty, category)
    const newBest = score > prev
    if (newBest) saveBestScore(mode, difficulty, category, score)
    setGameResult({ score, results, bestScore: newBest ? score : prev, isNewBest: newBest })
    setScreen('result')

    if (user) {
      updateStats(mode, difficulty, category, score, results)
      const catStats = getCategoryStats(mode, difficulty, category)
      const globalStats = getGlobalStats()
      syncCategoryStats(user.id, mode, difficulty, category, catStats).catch(console.error)
      syncGlobalStats(user.id, globalStats).catch(console.error)
    }
  }

  function handleQuit() { setReturnToSettings(false); setScreen('landing') }
  function handleBack() { setReturnToSettings(true); setScreen('landing') }
  function handleReplay() { setScreen('quiz') }

  function handleShowStats(from: 'landing' | 'result', tab: 'stats' | 'leaderboard' = 'stats') {
    setStatsOrigin(from)
    setStatsDefaultTab(tab)
    if (from === 'result' && tab === 'leaderboard') {
      setStatsInitialMode(settings.mode)
      setStatsInitialDiff(settings.difficulty)
    } else {
      setStatsInitialMode(undefined)
      setStatsInitialDiff(undefined)
    }
    setScreen('stats')
  }

  function handleBackFromStats() { setScreen(statsOrigin) }

  return (
    <>
      <div className="min-h-screen bg-game-bg font-game">
        <AnimatePresence mode="sync">
          {(screen === 'landing' || screen === 'launching') && (
            <motion.div
              key="landing"
              exit={{ opacity: 0, transition: { duration: 0.35 } }}
              className="absolute inset-0"
            >
              <LandingPage
                settings={settings}
                onSettingsChange={update}
                onStart={handleStart}
                onExplosion={handleExplosion}
                screen={screen}
                autoOpenSettings={returnToSettings}
                onShowStats={(tab) => handleShowStats('landing', tab)}
                onOpenAuth={() => setAuthModalOpen(true)}
              />
            </motion.div>
          )}

          {screen === 'quiz' && (
            <motion.div
              key="quiz"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { duration: 0.4 } }}
              exit={{ opacity: 0, scale: 0.96, y: -16, transition: { duration: 0.3, ease: 'easeIn' } }}
              className="absolute inset-0"
            >
              <QuizContainer
                onFinished={handleFinished}
                onQuit={handleQuit}
                gameMode={settings.mode}
                difficulty={settings.difficulty}
                language={settings.language}
                category={settings.category}
              />
            </motion.div>
          )}

          {screen === 'result' && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.1, ease: 'easeOut' } }}
              exit={{ opacity: 0, transition: { duration: 0.25 } }}
              className="absolute inset-0"
            >
              <ResultScreen
                score={gameResult.score}
                results={gameResult.results}
                onReplay={handleReplay}
                onBack={handleBack}
                onShowStats={() => handleShowStats('result')}
                onShowLeaderboard={() => handleShowStats('result', 'leaderboard')}
                onOpenAuth={() => setAuthModalOpen(true)}
                bestScore={gameResult.bestScore}
                isNewBest={gameResult.isNewBest}
                gameMode={settings.mode}
                difficulty={settings.difficulty}
                category={settings.category}
              />
            </motion.div>
          )}

          {screen === 'stats' && (
            <motion.div
              key="stats"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.1, ease: 'easeOut' } }}
              exit={{ opacity: 0, transition: { duration: 0.25 } }}
              className="absolute inset-0"
            >
              <StatsPage onBack={handleBackFromStats} defaultTab={statsDefaultTab} initialMode={statsInitialMode} initialDiff={statsInitialDiff} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {authModalOpen && (
          <AuthModal key="auth-modal" onClose={() => setAuthModalOpen(false)} />
        )}
      </AnimatePresence>
    </>
  )
}
