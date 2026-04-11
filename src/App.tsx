import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import LandingPage from './components/landing/LandingPage'
import QuizContainer from './components/quiz/QuizContainer'
import ResultScreen from './components/result/ResultScreen'
import RankingRevealScreen from './components/ranking/RankingRevealScreen'
import StatsPage from './components/stats/StatsPage'
import AuthModal from './components/auth/AuthModal'
import { incrementCategoryStats, incrementGlobalStats, getCloudBestScore } from './services/cloudStats'
import { submitScore, getUserBestScore, getUserRank } from './services/leaderboard'
import { useSettings } from './hooks/useSettings'
import { useAuth } from './hooks/useAuth'
import type { QuestionResult, Language } from './types/quiz'

export type AppScreen = 'landing' | 'launching' | 'quiz' | 'ranking' | 'result' | 'stats'

interface GameResult {
  score: number
  results: QuestionResult[]
  bestScore: number
  isNewBest: boolean
  userRank: number | null
  rankDelta: number | null
}

interface RankingData {
  userRank: number | null
  rankDelta: number | null
  userId: string
  username: string
  userScore: number
}

export default function App() {
  const { settings, update } = useSettings()
  const { user, profile } = useAuth()

  const [screen, setScreen] = useState<AppScreen>('landing')
  const [gameResult, setGameResult] = useState<GameResult>({ score: 0, results: [], bestScore: 0, isNewBest: false, userRank: null, rankDelta: null })
  const [rankingData, setRankingData] = useState<RankingData | null>(null)
  const [returnToSettings, setReturnToSettings] = useState(false)
  const [statsOrigin, setStatsOrigin] = useState<'landing' | 'result'>('landing')
  const [statsDefaultTab, setStatsDefaultTab] = useState<'stats' | 'leaderboard'>('stats')
  const [statsInitialDiff, setStatsInitialDiff] = useState<typeof settings.difficulty | undefined>(undefined)
  const [statsInitialLang, setStatsInitialLang] = useState<Language | undefined>(undefined)
  const [authModalOpen, setAuthModalOpen] = useState(false)

  function handleStart() { setScreen('launching') }

  function handleExplosion() { setScreen('quiz') }

  async function handleFinished(score: number, results: QuestionResult[]) {
    const { mode, difficulty, category, language } = settings

    // Fetch previous best from cloud (0 if not logged in or no entry)
    let prevBest = 0
    let prevRank: number | null = null
    if (user) {
      if (mode === 'normal') {
        prevBest = await getCloudBestScore(user.id, mode, difficulty, category)
      } else if (mode === 'compétitif') {
        ;[prevBest, prevRank] = await Promise.all([
          getUserBestScore(user.id, language),
          getUserRank(user.id, language),
        ])
      }
    }

    const isNewBest = score > prevBest
    const baseResult: GameResult = {
      score,
      results,
      bestScore: isNewBest ? score : prevBest,
      isNewBest,
      userRank: null,
      rankDelta: null,
    }
    setGameResult(baseResult)

    // Non-competitive or unauthenticated — fast path
    if (!user || mode !== 'compétitif' || !profile) {
      if (user && mode === 'normal') {
        incrementCategoryStats(user.id, mode, difficulty, category, score, results).catch(console.error)
        incrementGlobalStats(user.id, results, score, mode).catch(console.error)
      }
      setScreen('result')
      return
    }

    // Competitive + authenticated — await all data then show ranking reveal
    try {
      await submitScore({
        userId: user.id,
        username: profile.username,
        score,
        mode,
        difficulty: 'mixed',
        language,
        gameData: results.map(r => ({
          question: r.question,
          correctAnswer: r.correctAnswer,
          userAnswer: r.userAnswer,
          isCorrect: r.isCorrect,
          timeSpent: r.timeSpent,
          pointsEarned: r.pointsEarned ?? 0,
          multiplier: r.multiplier ?? 1,
        })),
      })
      const newRank = await getUserRank(user.id, language)
      const delta = newRank !== null && prevRank !== null ? prevRank - newRank : null
      setGameResult(prev => ({ ...prev, userRank: newRank, rankDelta: delta }))
      setRankingData({
        userRank: newRank,
        rankDelta: delta,
        userId: user.id,
        username: profile.username,
        userScore: score,
      })
      setScreen('ranking')
    } catch (err) {
      console.error(err)
      setScreen('result')
    }
  }

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
