import { useState, useRef, useEffect, lazy, Suspense } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import LandingPage from './components/landing/LandingPage'
import AchievementUnlockOverlay from './components/achievements/AchievementUnlockOverlay'
import RewardToast from './components/xp/RewardToast'
import { useSettings } from './hooks/useSettings'
import { useAuth } from './hooks/useAuth'
import { useGameOrchestration } from './hooks/useGameOrchestration'
import type { Language, GameResult, RankingData, AchievementWithStatus, AchievementId, PulsesBreakdown, XpBreakdown, AchievementTier, DailyRecapData } from './types/quiz'
import type { ProfileTab } from './components/profile/ProfilePage'
import { trackScreenViewed, trackGameAbandoned } from './services/analytics'
import { addXp } from './services/cloudStats'
import { XP_PER_ACHIEVEMENT } from './constants/xp'
import { PULSES_PER_ACHIEVEMENT, achievementSource } from './constants/pulses'
import { addPulses } from './services/pulses'
import { getPendingDailyRecap, markDailyRecapSeen } from './services/dailyChallenge'


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
const InventoryPage = lazy(() => import('./components/inventory/InventoryPage'))
const ShopPage = lazy(() => import('./components/shop/ShopPage'))
const DailyRecapOverlay = lazy(() => import('./components/daily/DailyRecapOverlay'))

export type AppScreen = 'landing' | 'quiz' | 'ranking' | 'result' | 'stats' | 'profile' | 'achievements' | 'social' | 'daily' | 'inventory' | 'shop'

// Écrans pendant lesquels l'overlay d'achievement doit être mis en attente
const GAME_SCREENS: AppScreen[] = ['quiz', 'ranking']

// Prefetch des chunks de partie dès que le main thread est idle — évite le freeze
// au premier lancement de quiz sur mobile (parse + compile du chunk).
function prefetchGameChunks() {
  void import('./components/quiz/QuizContainer')
  void import('./components/result/ResultScreen')
  void import('./components/ranking/RankingRevealScreen')
}

export default function App() {
  const { settings, update, updateTemp, reset } = useSettings()
  const { user, profile, pendingAchievements, clearPendingAchievements, refreshStats, showRewardGain, bumpPulses, bumpXp } = useAuth()

  const [screen, setScreen] = useState<AppScreen>('landing')
  const [showDailyModal, setShowDailyModal] = useState(false)
  const [gameResult, setGameResult] = useState<GameResult>({ score: 0, results: [], bestScore: 0, isNewBest: false, userRank: null, rankDelta: null, xpBreakdown: null, pulsesBreakdown: null, achievementXp: 0, achievementPulses: 0 })
  const [rankingData, setRankingData] = useState<RankingData | null>(null)
  const [newAchievements, setNewAchievements] = useState<AchievementWithStatus[]>([])
  const [pendingAchievementId, setPendingAchievementId] = useState<AchievementId | null>(null)
  const [pendingBadgeRect, setPendingBadgeRect] = useState<DOMRect | null>(null)
  const [dailyRecap, setDailyRecap] = useState<DailyRecapData | null>(null)

  // Capture la page active au moment où les achievements sont débloqués
  // (pour y revenir après l'animation, quel que soit le screen parcouru)
  const screenRef = useRef<AppScreen>('landing')
  useEffect(() => { screenRef.current = screen }, [screen])

  // Récompenses en attente à déclencher après la fermeture de l'overlay achievement
  interface PendingRewards {
    gameXp: XpBreakdown | null
    achievementXp: number
    gamePulses: PulsesBreakdown | null
    achievementPulses: number
    // Pour les achievements hors-partie : les credits cloud (addXp/addPulses) n'ont pas
    // encore été faits — on les déclenche à la fermeture de l'overlay.
    creditOnShow: boolean
  }
  const pendingRewardsRef = useRef<PendingRewards | null>(null)
  function storePendingRewards(p: { gameXp: XpBreakdown | null; achievementXp: number; gamePulses: PulsesBreakdown | null; achievementPulses: number }) {
    pendingRewardsRef.current = { ...p, creditOnShow: false }
  }

  // Analytics — screen views
  useEffect(() => {
    const trackable: AppScreen[] = ['landing', 'result', 'ranking', 'stats', 'profile', 'achievements', 'social', 'daily', 'inventory', 'shop']
    if (trackable.includes(screen)) trackScreenViewed(screen)
  }, [screen])

  // Prefetch game chunks on idle — 1ʳᵉ partie sans lag de parse
  useEffect(() => {
    const ric = (window as Window & { requestIdleCallback?: (cb: () => void) => number }).requestIdleCallback
    if (ric) ric(prefetchGameChunks)
    else setTimeout(prefetchGameChunks, 1500)
  }, [])
  const overlayOriginRef = useRef<AppScreen>('result')

  function handleNewAchievements(unlocked: AchievementWithStatus[], fromGame = false) {
    if (unlocked.length > 0) {
      // Si les achievements arrivent pendant une partie, l'overlay retourne vers 'result'
      // sauf pour le mode daily où on revient sur la page journalière
      const origin = screenRef.current
      overlayOriginRef.current = GAME_SCREENS.includes(origin)
        ? (settings.mode === 'daily' ? 'landing' : 'result')
        : origin
      // Pour les achievements hors partie, mémoriser XP+Pulses à déclencher après l'animation
      if (!fromGame && user) {
        const xp     = unlocked.reduce((sum, a) => sum + XP_PER_ACHIEVEMENT[a.tier], 0)
        const pulses = unlocked.reduce<Record<AchievementTier, number>>((acc, a) => {
          acc[a.tier] = (acc[a.tier] ?? 0) + 1
          return acc
        }, { common: 0, rare: 0, epic: 0, legendary: 0 })
        const pulsesTotal = (Object.keys(pulses) as AchievementTier[]).reduce(
          (sum, tier) => sum + pulses[tier] * PULSES_PER_ACHIEVEMENT[tier], 0,
        )
        pendingRewardsRef.current = {
          gameXp:            null,
          achievementXp:     xp,
          gamePulses:        null,
          achievementPulses: pulsesTotal,
          creditOnShow:      true,
        }
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

  // Daily recap — fetch la dernière entry non vue d'une date passée à la reconnexion
  useEffect(() => {
    if (!user) { setDailyRecap(null); return }
    let cancelled = false
    getPendingDailyRecap(user.id)
      .then(data => { if (!cancelled && data) setDailyRecap(data) })
      .catch(console.error)
    return () => { cancelled = true }
  }, [user])

  function handleCloseRecap() {
    if (dailyRecap) markDailyRecapSeen(dailyRecap.entry.date).catch(console.error)
    setDailyRecap(null)
  }

  function handlePlayDailyFromRecap() {
    handleCloseRecap()
    handleShowDaily()
  }

  const [cheatAlert, setCheatAlert] = useState(false)

  // Auto-dismiss de l'alerte anti-triche — démarre uniquement quand l'utilisateur est de retour
  useEffect(() => {
    if (!cheatAlert) return
    let timer: ReturnType<typeof setTimeout> | null = null
    const startDismiss = () => {
      if (timer) return
      timer = setTimeout(() => setCheatAlert(false), 6000)
    }
    if (!document.hidden) startDismiss()
    const onVisibilityChange = () => { if (!document.hidden) startDismiss() }
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
      if (timer) clearTimeout(timer)
    }
  }, [cheatAlert])

  const [isLoadingRanking, setIsLoadingRanking] = useState(false)
  const { handleFinished } = useGameOrchestration({ settings, user, profile, setScreen, setGameResult, setRankingData, setNewAchievements: handleNewGameAchievements, setLoadingRanking: setIsLoadingRanking, showRewardGain, storePendingRewards, onDailyComplete: handleDailyComplete, bumpPulses, bumpXp })
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
    // Déclencher le toast Récompenses après la fermeture de l'overlay (game ou hors-partie)
    const pending = pendingRewardsRef.current
    pendingRewardsRef.current = null
    if (pending) {
      const totalXpDelta     = (pending.gameXp?.total ?? 0) + pending.achievementXp
      const totalPulsesDelta = (pending.gamePulses?.total ?? 0) + pending.achievementPulses
      if (totalXpDelta > 0 || totalPulsesDelta > 0) {
        // Achievements hors-partie : crédits cloud non encore faits — on les déclenche ici
        if (pending.creditOnShow) {
          if (pending.achievementXp > 0) addXp(pending.achievementXp).catch(console.error)
          // Crédite les Pulses par tier, en parallèle (source `achievement_{tier}`)
          const byTier = newAchievements.reduce<Record<AchievementTier, AchievementWithStatus[]>>((acc, a) => {
            if (!acc[a.tier]) acc[a.tier] = []
            acc[a.tier].push(a)
            return acc
          }, { common: [], rare: [], epic: [], legendary: [] })
          for (const tier of Object.keys(byTier) as AchievementTier[]) {
            const list = byTier[tier]
            if (list.length === 0) continue
            const amount = list.length * PULSES_PER_ACHIEVEMENT[tier]
            addPulses(amount, achievementSource(tier), list.map(a => a.id).join(',')).catch(console.error)
          }
          if (pending.achievementPulses > 0) bumpPulses(pending.achievementPulses)
        }
        showRewardGain({
          gameXp:            pending.gameXp,
          achievementXp:     pending.achievementXp,
          gamePulses:        pending.gamePulses,
          achievementPulses: pending.achievementPulses,
        })
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
    setScreen('quiz')
  }

  function handleStart() { setScreen('quiz') }

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

  function handleShowInventory() { setScreen('inventory') }

  function handleShowShop() { setScreen('shop') }

  return (
    <>
      <div className="min-h-screen bg-game-bg font-game">
        <Suspense fallback={<div className="absolute inset-0 bg-game-bg" />}>
        <AnimatePresence mode="sync">
          {screen === 'landing' && (
            <motion.div
              key="landing"
              exit={{ opacity: 0, transition: { duration: 0.35 } }}
              className="absolute inset-0 z-0"
            >
              <LandingPage
                settings={settings}
                onSettingsChange={update}
                onStart={handleStart}
                autoOpenSettings={returnToSettings}
                onShowStats={(tab) => handleShowStats('landing', tab)}
                onOpenSignIn={openSignIn}
                onOpenSignUp={openSignUp}
                onShowProfile={handleShowProfile}
                onShowAchievements={() => handleShowAchievements('landing')}
                onShowSocial={() => setScreen('social')}
                onViewProfile={setViewingUsername}
                onShowDaily={handleShowDaily}
                onShowInventory={handleShowInventory}
                onShowShop={handleShowShop}
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
                onCheatDetected={() => setCheatAlert(true)}
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
                xpBreakdown={gameResult.xpBreakdown}
                pulsesBreakdown={gameResult.pulsesBreakdown}
                achievementXp={gameResult.achievementXp}
                achievementPulses={gameResult.achievementPulses}
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

          {screen === 'inventory' && (
            <motion.div
              key="inventory"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.1, ease: 'easeOut' } }}
              exit={{ opacity: 0, transition: { duration: 0.25 } }}
              className="absolute inset-0 z-10"
            >
              <Suspense fallback={<div className="absolute inset-0 bg-game-bg" />}>
                <InventoryPage onBack={() => setScreen('landing')} />
              </Suspense>
            </motion.div>
          )}

          {screen === 'shop' && (
            <motion.div
              key="shop"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.1, ease: 'easeOut' } }}
              exit={{ opacity: 0, transition: { duration: 0.25 } }}
              className="absolute inset-0 z-10"
            >
              <Suspense fallback={<div className="absolute inset-0 bg-game-bg" />}>
                <ShopPage onBack={() => setScreen('landing')} onGoToInventory={() => setScreen('inventory')} />
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
        {newAchievements.length > 0 && !dailyRecap && screen !== 'quiz' && screen !== 'ranking' && (
          <AchievementUnlockOverlay
            key="achievement-overlay"
            achievements={newAchievements}
            onNavigateToAchievements={handleNavigateToAchievements}
            onDone={handleAchievementsDone}
            pendingBadgeRect={pendingBadgeRect}
          />
        )}
      </AnimatePresence>

      {/* ── Daily Recap — overlay cinématique pour un défi passé non vu ──── */}
      <AnimatePresence>
        {dailyRecap && (
          <Suspense fallback={null}>
            <DailyRecapOverlay
              key="daily-recap"
              data={dailyRecap}
              onClose={handleCloseRecap}
              onPlayDailyToday={handlePlayDailyFromRecap}
            />
          </Suspense>
        )}
      </AnimatePresence>

      {/* ── Alerte anti-triche — changement d'onglet détecté pendant un quiz ── */}
      <AnimatePresence>
        {cheatAlert && (
          <motion.div
            key="cheat-alert"
            className="fixed inset-x-0 top-6 z-[70] flex justify-center px-4"
            initial={{ opacity: 0, y: -24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 420, damping: 28 }}
          >
            <div className="flex items-start gap-3 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 shadow-[0_0_40px_rgba(239,68,68,0.35)] backdrop-blur-md">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0 text-red-400">
                <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              <div className="flex flex-col gap-0.5">
                <p className="text-sm font-bold text-red-300">Changement d'onglet détecté</p>
                <p className="text-xs text-white/70">Question comptée comme ratée (anti-triche).</p>
              </div>
              <button
                onClick={() => setCheatAlert(false)}
                aria-label="Fermer"
                className="ml-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-white/40 transition-colors hover:bg-white/5 hover:text-white/80"
              >
                <svg width="12" height="12" viewBox="0 0 10 10" fill="none">
                  <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Toast XP — notification globale après chaque gain d'XP ───────── */}
      <RewardToast />

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
