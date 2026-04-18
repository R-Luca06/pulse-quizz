import ConnectedHeader from './ConnectedHeader'
import PodiumScene from './podium/PodiumScene'
import type { GameSettings } from '../../hooks/useSettings'

const DEFAULT_SETTINGS: GameSettings = { mode: 'normal', difficulty: 'easy', language: 'fr', category: 'all' }
const noop = () => {}

interface Props {
  onShowStats: (tab?: 'stats' | 'leaderboard' | 'daily') => void
  onShowProfile: (tab?: string) => void
  onShowAchievements: () => void
  onSignOut: () => void
  username: string
  onViewProfile?: (username: string) => void
  settings?: GameSettings
  onPlay?: () => void
  onOpenSettings?: () => void
  onShowSocial?: () => void
  onShowDaily?: () => void
  onShowInventory?: () => void
  onShowShop?: () => void
}

export default function ConnectedLanding({
  onShowStats,
  onShowProfile,
  onShowAchievements,
  onSignOut,
  username,
  onViewProfile,
  settings,
  onPlay,
  onOpenSettings,
  onShowSocial,
  onShowDaily,
  onShowInventory,
  onShowShop,
}: Props) {
  return (
    <>
      <ConnectedHeader
        onShowStats={onShowStats}
        onShowProfile={onShowProfile}
        onShowAchievements={onShowAchievements}
        onSignOut={onSignOut}
        username={username}
        onViewProfile={onViewProfile ?? noop}
        onShowSocial={onShowSocial}
        onShowDaily={onShowDaily}
        onShowInventory={onShowInventory}
        onShowShop={onShowShop}
      />

      <div className="absolute inset-0 z-0">
        <PodiumScene
          onShowStats={onShowStats}
          settings={settings ?? DEFAULT_SETTINGS}
          onPlay={onPlay ?? noop}
          onOpenSettings={onOpenSettings ?? noop}
        />
      </div>
    </>
  )
}
