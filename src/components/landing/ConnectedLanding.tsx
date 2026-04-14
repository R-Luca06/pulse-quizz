import { motion, useAnimationControls } from 'framer-motion'
import ConnectedHeader from './ConnectedHeader'
import PodiumScene from './podium/PodiumScene'
import type { GameSettings } from '../../hooks/useSettings'

type ShakeControls = ReturnType<typeof useAnimationControls>

interface Props {
  isLaunching: boolean
  onShowStats: (tab?: 'stats' | 'leaderboard') => void
  onShowProfile: () => void
  onShowAchievements: () => void
  onSignOut: () => void
  username: string
  shakeControls?: ShakeControls
  settings: GameSettings
  onPlay: () => void
  onOpenSettings: () => void
}

export default function ConnectedLanding({
  isLaunching,
  onShowStats,
  onShowProfile,
  onShowAchievements,
  onSignOut,
  username,
  shakeControls,
  settings,
  onPlay,
  onOpenSettings,
}: Props) {
  return (
    <>
      <ConnectedHeader
        onShowStats={onShowStats}
        onShowProfile={onShowProfile}
        onShowAchievements={onShowAchievements}
        onSignOut={onSignOut}
        username={username}
      />

      <motion.div
        className="absolute inset-0 z-0"
        animate={shakeControls}
      >
        <PodiumScene
          isLaunching={isLaunching}
          onShowStats={onShowStats}
          settings={settings}
          onPlay={onPlay}
          onOpenSettings={onOpenSettings}
        />
      </motion.div>
    </>
  )
}
