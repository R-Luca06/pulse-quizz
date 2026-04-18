import { useState, lazy, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import GameDock from './GameDock'

const SettingsModal = lazy(() => import('./SettingsModal'))
const RulesModal = lazy(() => import('./RulesModal'))
const ConnectedLanding = lazy(() => import('./ConnectedLanding'))
const GuestLanding = lazy(() => import('./GuestLanding'))

export type LaunchPhase = 'idle' | 'converging' | 'shaking' | 'exploding'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../contexts/ToastContext'
import type { GameSettings } from '../../hooks/useSettings'

interface Props {
  settings: GameSettings
  onSettingsChange: (patch: Partial<GameSettings>) => void
  onStart: () => void
  autoOpenSettings?: boolean
  onShowStats: (tab?: 'stats' | 'leaderboard' | 'daily') => void
  onOpenSignIn: () => void
  onOpenSignUp: () => void
  onShowProfile: (tab?: string) => void
  onShowAchievements: () => void
  onShowSocial?: () => void
  onViewProfile: (username: string) => void
  onShowDaily?: () => void
  onShowCollection?: () => void
}

export default function LandingPage({
  settings,
  onSettingsChange,
  onStart,
  autoOpenSettings,
  onShowStats,
  onOpenSignIn,
  onOpenSignUp,
  onShowProfile,
  onShowAchievements,
  onShowSocial,
  onViewProfile,
  onShowDaily,
  onShowCollection,
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
            settings={settings}
            onSettingsChange={onSettingsChange}
            onStart={onStart}
            openSettings={openSettings}
            setOpenSettings={setOpenSettings}
            showRules={showRules}
            setShowRules={setShowRules}
            onShowStats={onShowStats}
            onShowProfile={onShowProfile}
            onShowAchievements={onShowAchievements}
            username={profile?.username ?? ''}
            onSignOut={() => signOut().then(() => toast.success('Déconnecté'))}
            onShowSocial={onShowSocial}
            onViewProfile={onViewProfile}
            onShowDaily={onShowDaily}
            onShowCollection={onShowCollection}
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
            onStart={onStart}
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
  onStart: () => void
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
  onStart,
  openSettings,
  setOpenSettings,
  showRules,
  setShowRules,
  onOpenSignIn,
  onOpenSignUp,
}: GuestBranchProps) {
  function handleLaunch() {
    setOpenSettings(false)
    onStart()
  }

  function handleRequireAuth() {
    setOpenSettings(false)
    onOpenSignUp()
  }

  return (
    <div className="absolute inset-0 overflow-y-auto bg-[#0B0820] text-white">
      <Suspense fallback={null}>
        <GuestLanding
          onOpenSettings={() => setOpenSettings(true)}
          onOpenSignIn={onOpenSignIn}
          onOpenSignUp={onOpenSignUp}
        />
      </Suspense>

      <AnimatePresence>
        {openSettings && (
          <Suspense key="settings" fallback={null}>
            <SettingsModal
              settings={settings}
              onSettingsChange={onSettingsChange}
              onLaunch={handleLaunch}
              onClose={() => setOpenSettings(false)}
              onShowRules={() => setShowRules(true)}
              onRequireAuth={handleRequireAuth}
            />
          </Suspense>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showRules && (
          <Suspense key="rules" fallback={null}>
            <RulesModal onClose={() => setShowRules(false)} />
          </Suspense>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Connected branch : layout avec ConstellationBackground ──────────────────

interface ConnectedBranchProps {
  settings: GameSettings
  onSettingsChange: (patch: Partial<GameSettings>) => void
  onStart: () => void
  openSettings: boolean
  setOpenSettings: (v: boolean) => void
  showRules: boolean
  setShowRules: (v: boolean) => void
  onShowStats: (tab?: 'stats' | 'leaderboard' | 'daily') => void
  onShowProfile: (tab?: string) => void
  onShowAchievements: () => void
  username: string
  onSignOut: () => void
  onShowSocial?: () => void
  onViewProfile: (username: string) => void
  onShowDaily?: () => void
  onShowCollection?: () => void
}

function ConnectedBranch({
  settings,
  onSettingsChange,
  onStart,
  openSettings,
  setOpenSettings,
  showRules,
  setShowRules,
  onShowStats,
  onShowProfile,
  onShowAchievements,
  username,
  onSignOut,
  onShowSocial,
  onViewProfile,
  onShowDaily,
  onShowCollection,
}: ConnectedBranchProps) {
  function handleLaunch() {
    setOpenSettings(false)
    onStart()
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-game-bg">
      <Suspense fallback={null}>
        <ConnectedLanding
          onShowStats={onShowStats}
          onShowProfile={onShowProfile}
          onShowAchievements={onShowAchievements}
          onSignOut={onSignOut}
          username={username}
          onViewProfile={onViewProfile}
          settings={settings}
          onPlay={handleLaunch}
          onOpenSettings={() => setOpenSettings(true)}
          onShowSocial={onShowSocial}
          onShowDaily={onShowDaily}
          onShowCollection={onShowCollection}
        />
      </Suspense>

      {/* GameDock : desktop uniquement (lg+) — le mobile a son dock dans PodiumScene */}
      <div className="hidden lg:block">
        <GameDock settings={settings} onPlay={handleLaunch} onOpenSettings={() => setOpenSettings(true)} />
      </div>

      <AnimatePresence>
        {openSettings && (
          <Suspense key="settings" fallback={null}>
            <SettingsModal
              settings={settings}
              onSettingsChange={onSettingsChange}
              onLaunch={handleLaunch}
              onClose={() => setOpenSettings(false)}
              onShowRules={() => setShowRules(true)}
            />
          </Suspense>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showRules && (
          <Suspense key="rules" fallback={null}>
            <RulesModal onClose={() => setShowRules(false)} />
          </Suspense>
        )}
      </AnimatePresence>
    </div>
  )
}
