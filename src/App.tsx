import { useState, useRef, useEffect, lazy, Suspense } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import LandingPage from './components/landing/LandingPage'
import AchievementUnlockOverlay from './components/achievements/AchievementUnlockOverlay'
import XpToast from './components/xp/XpToast'
import { useSettings } from './hooks/useSettings'
import { useAuth } from './hooks/useAuth'
import { useGameOrchestration } from './hooks/useGameOrchestration'
import type { Language, GameResult, RankingData, AchievementWithStatus, AchievementId } from './types/quiz'
import type { ProfileTab } from './components/profile/ProfilePage'
import { trackScreenViewed, trackGameAbandoned } from './services/analytics'
import { addXp } from './services/cloudStats'
import { XP_PER_ACHIEVEMENT } from './constants/xp'


const QuizContainer = lazy(() => import('./components/quiz/QuizContainer'))
const ResultScreen = lazy(() => import('./components/result/ResultScreen'))
const RankingRevealScreen = lazy(() => import('./components/ranking/RankingRevealScreen'))
const StatsPage = lazy(() => import('./components/stats/StatsPage'))
const AuthModal = lazy(() => import('./components/auth/AuthModal'))
const ProfilePage = lazy(() => import('./components/profile/ProfilePage'))
const AchievementsPage = lazy(() => import('./components/achievements/AchievementsPage'))
const UserProfilePanel = lazy(() => import('./pages/PublicProfilePage'))
const SocialPage = lazy(() => import('./components/social/SocialPage'))
const DailyChallengePage = lazy(() => import('./components/daily/DailyChallengePage'))
const DailyChallengeModal = lazy(() => import('./components/daily/DailyChallengeModal'))
const CollectionPage = lazy(() => import('./components/collection/CollectionPage'))

export type AppScreen = 'landing' | 'launching' | 'quiz' | 'ranking' | 'result' | 'stats' | 'profile' | 'achievements' | 'social' | 'daily' | 'collection'

// Écrans pendant lesquels l'overlay d'achievement doit être mis en attente
const GAME_SCREENS: AppScreen[] = ['quiz', 'launching', 'ranking']

export default function App() {
  const { settings, update, updateTemp, reset } = useSettings()
  const { user, profile, pendingAchievements, clearPendingAchievements, refreshStats, showXpGain } = useAuth()

  const [screen, setScreen] = useState<AppScreen>('landing')
  const [showDailyModal, setShowDailyModal] = useState(false)
  const [gameResult, setGameResult] = useState<GameResult>({ score: 0, results: [], bestScore: 0, isNewBest: false, userRank: null, rankDelta: null, xpBreakdown: null })
  const [rankingData, setRankingData] = useState<RankingData | null>(null)
  const [newAchievements, setNewAchievements] = useState<AchievementWithStatus[]>([])
  const [pendingAchievementId, setPendingAchievementId] = useState<AchievementId | null>(null)
  const [pendingBadgeRect, setPendingBadgeRect] = useState<DOMRect | null>(null)

  // Capture la page active au moment où les achievements sont débloqués
  // (pour y revenir après l'animation, quel que soit le screen parcouru)
  const screenRef = useRef<AppScreen>('landing')
  useEffect(() => { screenRef.current = screen }, [screen])

  // XP en attente à déclencher après la fermeture de l'overlay achievement
  const pendingXpRef = useRef<{ gameXp: import('./types/quiz').XpBreakdown | null; achievementXp: number } | null>(null)
  function storePendingXp(p: { gameXp: import('./types/quiz').XpBreakdown | null; achievementXp: number }) {
    pendingXpRef.current = p
  }

  // Analytics — screen views (on exclut 'launching' qui est un état transitoire)
  useEffect(() => {
    const trackable: AppScreen[] = ['landing', 'result', 'ranking', 'stats', 'profile', 'achievements', 'social', 'daily']
    if (trackable.includes(screen)) trackScreenViewed(screen)
  }, [screen])
  const overlayOriginRef = useRef<AppScreen>('result')

  function handleNewAchievements(unlocked: AchievementWithStatus[], fromGame = false) {
    if (unlocked.length > 0) {
      // Si les achievements arrivent pendant une partie, l'overlay retourne vers 'result'
      // sauf pour le mode daily où on revient sur la page journalière
      const origin = screenRef.current
      overlayOriginRef.current = GAME_SCREENS.includes(origin)
        ? (settings.mode === 'daily' ? 'landing' : 'result')
        : origin
      // Pour les achievements hors partie, mémoriser l'XP à déclencher après l'animation
      if (!fromGame && user) {
        const xp = unlocked.reduce((sum, a) => sum + XP_PER_ACHIEVEMENT[a.tier], 0)
        pendingXpRef.current = { gameXp: null, achievementXp: xp }
      }
    }
    setNewAchievements(unlocked)
  }

  // Wrapper passé à useGameOrchestration — marque les achievements comme venant d'une partie
  function handleNewGameAchievements(unlocked: AchievementWithStatus[]) {
    handleNewAchievements(unlocked, true)
  }

  // Achievements débloqués depuis AuthContext (ex: inscription → premiers_pas)
  useEffect(() => {
    if (pendingAchievements.length > 0) {
      handleNewAchievements(pendingAchievements, false)
      clearPendingAchievements()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingAchievements])

  const [isLoadingRanking, setIsLoadingRanking] = useState(false)
  const { handleFinished } = useGameOrchestration({ settings, user, profile, setScreen, setGameResult, setRankingData, setNewAchievements: handleNewGameAchievements, setLoadingRanking: setIsLoadingRanking, showXpGain, storePendingXp, onDailyComplete: handleDailyComplete })
  const [returnToSettings, setReturnToSettings] = useState(false)
  const [statsOrigin, setStatsOrigin] = useState<'landing' | 'result'>('landing')
  const [statsDefaultTab, setStatsDefaultTab] = useState<'stats' | 'leaderboard' | 'daily'>('leaderboard')
  const [statsInitialDiff, setStatsInitialDiff] = useState<typeof settings.difficulty | undefined>(undefined)
  const [statsInitialLang, setStatsInitialLang] = useState<Language | undefined>(undefined)
  const [authModal, setAuthModal] = useState<{ open: boolean; tab: 'signin' | 'signup' }>({ open: false, tab: 'signin' })
  const openSignIn = () => setAuthModal({ open: true, tab: 'signin' })
  const openSignUp = () => setAuthModal({ open: true, tab: 'signup' })
  const closeAuth = () => setAuthModal(a => ({ ...a, open: false }))
  const [achievementsOrigin, setAchievementsOrigin] = useState<'landing' | 'profile' | 'result'>('landing')
  const [profileDefaultTab, setProfileDefaultTab] = useState<ProfileTab>('general')
  const [viewingUsername, setViewingUsername] = useState<string | null>(null)
  const closeProfile = () => setViewingUsername(null)

  function handleShowAchievements(from: 'landing' | 'profile' = 'landing') {
    setAchievementsOrigin(from)
    setScreen('achievements')
  }

  function handleBackFromAchievements() {
    setScreen(achievementsOrigin === 'result' ? 'result' : achievementsOrigin)
  }

  function handleNavigateToAchievements(id: AchievementId) {
    setPendingBadgeRect(null) // reset avant navigation pour que le poll de l'overlay parte de zéro
    setPendingAchievementId(id)
    // Ne change l'origine que si on N'est PAS déjà sur la page achievements,
    // pour éviter de casser le bouton retour et la redirection post-animation.
    if (screen !== 'achievements') {
      setAchievementsOrigin('result')
      setScreen('achievements')
    }
  }

  function handleAchievementsDone() {
    // Déclencher l'XP toast après la fermeture de l'overlay (game ou hors-partie)
    const pending = pendingXpRef.current
    pendingXpRef.current = null
    if (pending) {
      const total = (pending.gameXp?.total ?? 0) + pending.achievementXp
      if (total > 0) {
        // addXp déjà appelé pour les achievements de partie (dans useGameOrchestration)
        // Pour les achievements hors-partie, il faut l'appeler ici
        if (!pending.gameXp && pending.achievementXp > 0) addXp(pending.achievementXp).catch(console.error)
        showXpGain(pending)
      }
    }
    setNewAchievements([])
    setPendingAchievementId(null)
    setPendingBadgeRect(null)
    refreshStats()
    // Retour sur la page où on était avant l'animation (pas forcément 'result')
    setScreen(overlayOriginRef.current)
  }

  function handleShowDaily() { setShowDailyModal(true) }

  function handleCloseDailyModal() { setShowDailyModal(false) }

  function handleShowDailyLeaderboard() {
    setShowDailyModal(false)
    handleShowStats('landing', 'daily')
  }

  // Called when a daily game completes: restore persisted settings, go back to landing
  function handleDailyComplete() { reset(); setScreen('landing'); setShowDailyModal(true) }

  function handleStartDailyGame() {
    setShowDailyModal(false)
    // updateTemp : n'écrase PAS localStorage, pour préserver les préférences normales
    updateTemp({ mode: 'daily', difficulty: 'mixed', category: 'all' })
    setScreen('launching')
  }

  function handleStart() { setScreen('launching') }

  function handleExplosion() { setScreen('quiz') }

  function handleQuit() {
    if (screenRef.current === 'quiz' && settings.mode !== 'daily') {
      trackGameAbandoned({ mode: settings.mode, difficulty: settings.difficulty, category: settings.category, language: settings.language })
    }
    setReturnToSettings(false); setNewAchievements([]); setPendingAchievementId(null)
    if (settings.mode === 'daily') {
      reset()
      setScreen('landing')
      setShowDailyModal(true)
    } else {
      setScreen('landing')
    }
  }

  function handleReplay() { setNewAchievements([]); setPendingAchievementId(null); setScreen('quiz') }

  function handleShowStats(from: 'landing' | 'result', tab: 'stats' | 'leaderboard' | 'daily' = 'leaderboard') {
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

  function handleShowProfile(tab?: string) {
    if (tab) {
      sessionStorage.removeItem('profile_active_tab')
      setProfileDefaultTab(tab as ProfileTab)
    }
    setScreen('profile')
  }

  function handleShowCollection() { setScreen('collection') }

  return (
    <>
      <div className="min-h-screen bg-game-bg font-game">
        <Suspense fallback={<div className="absolute inset-0 bg-game-bg" />}>
        <AnimatePresence mode="sync">
          {(screen === 'landing' || screen === 'launching') && (
            <motion.div
              key="landing"
              exit={{ opacity: 0, transition: { duration: 0.35 } }}
              className="absolute inset-0 z-0"
            >
              <LandingPage
                settings={settings}
                onSettingsChange={update}
                onStart={handleStart}
                onExplosion={handleExplosion}
                screen={screen}
                autoOpenSettings={returnToSettings}
                onShowStats={(tab) => handleShowStats('landing', tab)}
                onOpenSignIn={openSignIn}
                onOpenSignUp={openSignUp}
                onShowProfile={handleShowProfile}
                onShowAchievements={() => handleShowAchievements('landing')}
                onShowSocial={() => setScreen('social')}
                onViewProfile={setViewingUsername}
                onShowDaily={handleShowDaily}
                onShowCollection={handleShowCollection}
              />
            </motion.div>
          )}

          {screen === 'quiz' && (
            <motion.div
              key="quiz"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { duration: 0.4 } }}
              exit={{ opacity: 0, scale: 0.96, y: -16, transition: { duration: 0.3, ease: 'easeIn' } }}
              className="absolute inset-0 z-10"
            >
              <QuizContainer
                onFinished={handleFinished}
                onQuit={handleQuit}
                gameMode={settings.mode}
                difficulty={settings.difficulty}
                language={settings.language}
                category={settings.category}
                isLoadingRanking={isLoadingRanking}
              />
            </motion.div>
          )}

          {screen === 'ranking' && rankingData && (
            <motion.div
              key="ranking"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { duration: 0.4 } }}
              exit={{ opacity: 0, transition: { duration: 0.4 } }}
              className="absolute inset-0 z-10"
            >
              <RankingRevealScreen
                {...rankingData}
                language={settings.language}
                onDone={() => setScreen('result')}
                onViewProfile={setViewingUsername}
              />
            </motion.div>
          )}

          {screen === 'result' && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.1, ease: 'easeOut' } }}
              exit={{ opacity: 0, transition: { duration: 0.25 } }}
              className="absolute inset-0 z-10"
            >
              <ResultScreen
                score={gameResult.score}
                results={gameResult.results}
                onReplay={handleReplay}
                onBack={handleQuit}
                onShowStats={() => handleShowStats('result')}
                onShowLeaderboard={() => handleShowStats('result', 'leaderboard')}
                onOpenAuth={openSignIn}
                onOpenSignUp={openSignUp}
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

          {screen === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.1, ease: 'easeOut' } }}
              exit={{ opacity: 0, transition: { duration: 0.25 } }}
              className="absolute inset-0 z-10"
            >
              <ProfilePage
                onBack={() => setScreen('landing')}
                defaultTab={profileDefaultTab}
                onViewProfile={setViewingUsername}
              />
            </motion.div>
          )}

          {screen === 'achievements' && (
            <motion.div
              key="achievements"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.1, ease: 'easeOut' } }}
              exit={{ opacity: 0, transition: { duration: 0.25 } }}
              className="absolute inset-0 z-10"
            >
              <AchievementsPage
                onBack={handleBackFromAchievements}
                hideBack={achievementsOrigin === 'result' && newAchievements.length > 0}
                pendingAchievementId={pendingAchievementId}
                onBadgeReady={setPendingBadgeRect}
              />
            </motion.div>
          )}

          {screen === 'stats' && (
            <motion.div
              key="stats"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.1, ease: 'easeOut' } }}
              exit={{ opacity: 0, transition: { duration: 0.25 } }}
              className="absolute inset-0 z-10"
            >
              <StatsPage
                onBack={handleBackFromStats}
                defaultTab={statsDefaultTab}
                initialDiff={statsInitialDiff}
                initialLang={statsInitialLang}
                onViewProfile={setViewingUsername}
              />
            </motion.div>
          )}

          {screen === 'social' && (
            <motion.div
              key="social"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.1, ease: 'easeOut' } }}
              exit={{ opacity: 0, transition: { duration: 0.25 } }}
              className="absolute inset-0 z-10"
            >
              <Suspense fallback={<div className="absolute inset-0 bg-game-bg" />}>
                <SocialPage
                  onBack={() => setScreen('landing')}
                  onViewProfile={setViewingUsername}
                />
              </Suspense>
            </motion.div>
          )}

          {screen === 'daily' && (
            <motion.div
              key="daily"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.1, ease: 'easeOut' } }}
              exit={{ opacity: 0, transition: { duration: 0.25 } }}
              className="absolute inset-0 z-10"
            >
              <Suspense fallback={<div className="absolute inset-0 bg-game-bg" />}>
                <DailyChallengePage
                  onBack={() => setScreen('landing')}
                  onStartGame={handleStartDailyGame}
                />
              </Suspense>
            </motion.div>
          )}

          {screen === 'collection' && (
            <motion.div
              key="collection"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.1, ease: 'easeOut' } }}
              exit={{ opacity: 0, transition: { duration: 0.25 } }}
              className="absolute inset-0 z-10"
            >
              <Suspense fallback={<div className="absolute inset-0 bg-game-bg" />}>
                <CollectionPage onBack={() => setScreen('landing')} />
              </Suspense>
            </motion.div>
          )}
        </AnimatePresence>
        </Suspense>
      </div>

      {/* ── Daily challenge dropdown (below nav bar, like notifications) ──── */}
      <AnimatePresence>
        {showDailyModal && (
          <motion.div
            key="daily-modal-overlay"
            className="fixed inset-0 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {/* Invisible backdrop — click outside to dismiss */}
            <div className="absolute inset-0" onClick={handleCloseDailyModal} />
            {/* Dropdown panel anchored below the nav bar + sub-header */}
            <div
              className={[
                'absolute left-4 z-10 w-[360px] max-w-[calc(100vw-32px)]',
                'max-h-[calc(100vh-120px)] overflow-y-auto',
                user ? 'top-[90px]' : 'top-[60px]',
              ].join(' ')}
            >
              <Suspense fallback={<div className="h-48 w-full rounded-2xl bg-game-card animate-pulse" />}>
                <DailyChallengeModal
                  onClose={handleCloseDailyModal}
                  onStartGame={handleStartDailyGame}
                  onShowLeaderboard={handleShowDailyLeaderboard}
                />
              </Suspense>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Suspense fallback={null}>
        <AnimatePresence>
          {authModal.open && (
            <AuthModal key="auth-modal" onClose={closeAuth} defaultTab={authModal.tab} />
          )}
        </AnimatePresence>
      </Suspense>

      <AnimatePresence>
        {newAchievements.length > 0 && screen !== 'quiz' && screen !== 'launching' && screen !== 'ranking' && (
          <AchievementUnlockOverlay
            key="achievement-overlay"
            achievements={newAchievements}
            onNavigateToAchievements={handleNavigateToAchievements}
            onDone={handleAchievementsDone}
            pendingBadgeRect={pendingBadgeRect}
          />
        )}
      </AnimatePresence>

      {/* ── Toast XP — notification globale après chaque gain d'XP ───────── */}
      <XpToast />

      {/* ── Profil utilisateur — overlay glissant depuis la droite ────────── */}
      <AnimatePresence>
        {viewingUsername && (
          <motion.div
            key="user-profile"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 38 }}
            className="fixed inset-0 z-40 overflow-hidden bg-game-bg"
          >
            <Suspense fallback={<div className="absolute inset-0 bg-game-bg" />}>
              <UserProfilePanel username={viewingUsername} onClose={closeProfile} />
            </Suspense>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
