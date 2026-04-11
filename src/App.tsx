import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import LandingPage from './components/landing/LandingPage'
import QuizContainer from './components/quiz/QuizContainer'
import ResultScreen from './components/result/ResultScreen'
import RankingRevealScreen from './components/ranking/RankingRevealScreen'
import StatsPage from './components/stats/StatsPage'
import AuthModal from './components/auth/AuthModal'
import { useSettings } from './hooks/useSettings'
import { useAuth } from './hooks/useAuth'
import { useGameOrchestration } from './hooks/useGameOrchestration'
import type { Language, GameResult, RankingData } from './types/quiz'

export type AppScreen = 'landing' | 'launching' | 'quiz' | 'ranking' | 'result' | 'stats'

export default function App() {
  const { settings, update } = useSettings()
  const { user, profile } = useAuth()

  const [screen, setScreen] = useState<AppScreen>('landing')
  const [gameResult, setGameResult] = useState<GameResult>({ score: 0, results: [], bestScore: 0, isNewBest: false, userRank: null, rankDelta: null })
  const [rankingData, setRankingData] = useState<RankingData | null>(null)

  const { handleFinished } = useGameOrchestration({ settings, user, profile, setScreen, setGameResult, setRankingData })
  const [returnToSettings, setReturnToSettings] = useState(false)
  const [statsOrigin, setStatsOrigin] = useState<'landing' | 'result'>('landing')
  const [statsDefaultTab, setStatsDefaultTab] = useState<'stats' | 'leaderboard'>('stats')
  const [statsInitialDiff, setStatsInitialDiff] = useState<typeof settings.difficulty | undefined>(undefined)
  const [statsInitialLang, setStatsInitialLang] = useState<Language | undefined>(undefined)
  const [authModalOpen, setAuthModalOpen] = useState(false)

  function handleStart() { setScreen('launching') }

  function handleExplosion() { setScreen('quiz') }

  function handleQuit() { setReturnToSettings(false); setScreen('landing') }

  function handleReplay() { setScreen('quiz') }

  function handleShowStats(from: 'landing' | 'result', tab: 'stats' | 'leaderboard' = 'stats') {
    setStatsOrigin(from)
    setStatsDefaultTab(tab)
    if (from === 'result') {
      setStatsInitialDiff(settings.difficulty)
      setStatsInitialLang(settings.language)
    } else {
      setStatsInitialDiff(undefined)
      setStatsInitialLang(undefined)
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

          {screen === 'ranking' && rankingData && (
            <motion.div
              key="ranking"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { duration: 0.4 } }}
              exit={{ opacity: 0, transition: { duration: 0.4 } }}
              className="absolute inset-0"
            >
              <RankingRevealScreen
                {...rankingData}
                language={settings.language}
                onDone={() => setScreen('result')}
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
                onBack={handleQuit}
                onShowStats={() => handleShowStats('result')}
                onShowLeaderboard={() => handleShowStats('result', 'leaderboard')}
                onOpenAuth={() => setAuthModalOpen(true)}
                bestScore={gameResult.bestScore}
                isNewBest={gameResult.isNewBest}
                gameMode={settings.mode}
                difficulty={settings.difficulty}
                category={settings.category}
                language={settings.language}
                userRank={gameResult.userRank}
                rankDelta={gameResult.rankDelta}
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
              <StatsPage
                onBack={handleBackFromStats}
                defaultTab={statsDefaultTab}
                initialDiff={statsInitialDiff}
                initialLang={statsInitialLang}
              />
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
