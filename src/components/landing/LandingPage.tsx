import { useEffect, useState } from 'react'
import { motion, useAnimationControls, AnimatePresence } from 'framer-motion'
import SettingsModal from './SettingsModal'
import RulesModal from './RulesModal'
import ConnectedLanding from './ConnectedLanding'
import GuestLanding from './GuestLanding'
import GameDock from './GameDock'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../contexts/ToastContext'
import type { AppScreen } from '../../App'
import type { GameSettings } from '../../hooks/useSettings'

export type LaunchPhase = 'idle' | 'converging' | 'shaking' | 'exploding'

interface Props {
  settings: GameSettings
  onSettingsChange: (patch: Partial<GameSettings>) => void
  onStart: () => void
  onExplosion: () => void
  screen: AppScreen
  autoOpenSettings?: boolean
  onShowStats: (tab?: 'stats' | 'leaderboard') => void
  onOpenSignIn: () => void
  onOpenSignUp: () => void
  onShowProfile: () => void
  onShowAchievements: () => void
}

export default function LandingPage({
  settings,
  onSettingsChange,
  onStart,
  onExplosion,
  screen,
  autoOpenSettings,
  onShowStats,
  onOpenSignIn,
  onOpenSignUp,
  onShowProfile,
  onShowAchievements,
}: Props) {
  const { user, profile, loading, signOut } = useAuth()
  const toast = useToast()
  const [openSettings, setOpenSettings] = useState(autoOpenSettings ?? false)
  const [showRules, setShowRules] = useState(false)

  // Loading guard : évite le flash vitrine → connectée au chargement initial
  // pour un utilisateur déjà authentifié (AuthContext passe user=null pendant getSession).
  if (loading) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-game-bg">
        <div
          role="status"
          aria-label="Chargement"
          className="h-8 w-8 animate-spin rounded-full border-2 border-neon-violet border-t-transparent"
        />
      </div>
    )
  }

  // AnimatePresence mode="wait" : bascule fluide vitrine ↔ connectée après auth (AC 3).
  // Pas de initial={false} : il propageait blockInitialAnimation via PresenceContext et
  // gelait les keyframes descendantes (trajectoire avatar, etc.) au reload. Le léger fade
  // d'entrée (200 ms) est un compromis acceptable.
  return (
    <AnimatePresence mode="wait">
      {user ? (
        <motion.div
          key="connected"
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <ConnectedBranch
            screen={screen}
            settings={settings}
            onSettingsChange={onSettingsChange}
            onStart={onStart}
            onExplosion={onExplosion}
            openSettings={openSettings}
            setOpenSettings={setOpenSettings}
            showRules={showRules}
            setShowRules={setShowRules}
            onShowStats={onShowStats}
            onShowProfile={onShowProfile}
            onShowAchievements={onShowAchievements}
            username={profile?.username ?? ''}
            onSignOut={() => signOut().then(() => toast.success('Déconnecté'))}
          />
        </motion.div>
      ) : (
        <motion.div
          key="guest"
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <GuestBranch
            settings={settings}
            onSettingsChange={onSettingsChange}
            onExplosion={onExplosion}
            openSettings={openSettings}
            setOpenSettings={setOpenSettings}
            showRules={showRules}
            setShowRules={setShowRules}
            onOpenSignIn={onOpenSignIn}
            onOpenSignUp={onOpenSignUp}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ─── Guest branch : vitrine simple, scrollable, sans background animé ─────────

interface GuestBranchProps {
  settings: GameSettings
  onSettingsChange: (patch: Partial<GameSettings>) => void
  onExplosion: () => void
  openSettings: boolean
  setOpenSettings: (v: boolean) => void
  showRules: boolean
  setShowRules: (v: boolean) => void
  onOpenSignIn: () => void
  onOpenSignUp: () => void
}

function GuestBranch({
  settings,
  onSettingsChange,
  onExplosion,
  openSettings,
  setOpenSettings,
  showRules,
  setShowRules,
  onOpenSignIn,
  onOpenSignUp,
}: GuestBranchProps) {
  function handleLaunch() {
    setOpenSettings(false)
    onExplosion()
  }

  function handleRequireAuth() {
    setOpenSettings(false)
    onOpenSignUp()
  }

  return (
    <div className="absolute inset-0 overflow-y-auto bg-[#0B0820] text-white">
      <GuestLanding
        onOpenSettings={() => setOpenSettings(true)}
        onOpenSignIn={onOpenSignIn}
        onOpenSignUp={onOpenSignUp}
      />

      <AnimatePresence>
        {openSettings && (
          <SettingsModal
            key="settings"
            settings={settings}
            onSettingsChange={onSettingsChange}
            onLaunch={handleLaunch}
            onClose={() => setOpenSettings(false)}
            onShowRules={() => setShowRules(true)}
            onRequireAuth={handleRequireAuth}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showRules && <RulesModal key="rules" onClose={() => setShowRules(false)} />}
      </AnimatePresence>
    </div>
  )
}

// ─── Connected branch : layout original avec ArenaBackground + shake ──────────

interface ConnectedBranchProps {
  screen: AppScreen
  settings: GameSettings
  onSettingsChange: (patch: Partial<GameSettings>) => void
  onStart: () => void
  onExplosion: () => void
  openSettings: boolean
  setOpenSettings: (v: boolean) => void
  showRules: boolean
  setShowRules: (v: boolean) => void
  onShowStats: (tab?: 'stats' | 'leaderboard') => void
  onShowProfile: () => void
  onShowAchievements: () => void
  username: string
  onSignOut: () => void
}

function ConnectedBranch({
  screen,
  settings,
  onSettingsChange,
  onStart,
  onExplosion,
  openSettings,
  setOpenSettings,
  showRules,
  setShowRules,
  onShowStats,
  onShowProfile,
  onShowAchievements,
  username,
  onSignOut,
}: ConnectedBranchProps) {
  const isLaunching = screen === 'launching'
  const [launchPhase, setLaunchPhase] = useState<LaunchPhase>('idle')
  const shakeControls = useAnimationControls()

  useEffect(() => {
    if (!isLaunching) {
      queueMicrotask(() => setLaunchPhase('idle'))
      return
    }
    queueMicrotask(() => setLaunchPhase('converging'))
    const t = setTimeout(async () => {
      setLaunchPhase('shaking')
      await shakeControls.start({
        x: [0, -18, 18, -14, 14, -9, 9, -5, 5, 0],
        transition: { duration: 0.32, ease: 'linear' },
      })
      setLaunchPhase('exploding')
      onExplosion()
    }, 380)
    return () => clearTimeout(t)
  }, [isLaunching, shakeControls, onExplosion])

  function handleLaunch() {
    setOpenSettings(false)
    onStart()
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-game-bg">
      {launchPhase === 'exploding' && (
        <motion.div
          className="pointer-events-none absolute inset-0 z-20 bg-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.3, 0] }}
          transition={{ duration: 0.45 }}
        />
      )}

      <ConnectedLanding
        isLaunching={isLaunching}
        onShowStats={onShowStats}
        onShowProfile={onShowProfile}
        onShowAchievements={onShowAchievements}
        onSignOut={onSignOut}
        username={username}
        shakeControls={shakeControls}
        settings={settings}
        onPlay={handleLaunch}
        onOpenSettings={() => setOpenSettings(true)}
      />

      {/* GameDock : desktop uniquement (lg+) — le mobile a son dock dans PodiumScene */}
      {!isLaunching && (
        <div className="hidden lg:block">
          <GameDock settings={settings} onPlay={handleLaunch} onOpenSettings={() => setOpenSettings(true)} />
        </div>
      )}

      <AnimatePresence>
        {openSettings && (
          <SettingsModal
            key="settings"
            settings={settings}
            onSettingsChange={onSettingsChange}
            onLaunch={handleLaunch}
            onClose={() => setOpenSettings(false)}
            onShowRules={() => setShowRules(true)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showRules && <RulesModal key="rules" onClose={() => setShowRules(false)} />}
      </AnimatePresence>
    </div>
  )
}
