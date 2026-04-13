import { motion } from 'framer-motion'
import { AvatarContainer } from '../avatar'

interface ConnectedHeaderProps {
  onShowStats: (tab?: 'stats' | 'leaderboard') => void
  onShowProfile: () => void
  onShowAchievements: () => void
  onSignOut: () => void
  username: string
}

const navLinkClass =
  'rounded-md px-2 py-1 text-sm font-bold tracking-wide text-white/75 transition-colors hover:text-white focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neon-violet/60'

export default function ConnectedHeader({
  onShowStats,
  onShowProfile,
  onShowAchievements,
  onSignOut,
  username,
}: ConnectedHeaderProps) {
  return (
    <motion.nav
      className="absolute inset-x-0 top-0 z-10 flex h-14 items-center justify-between border-b border-white/10 bg-game-bg/70 px-4 backdrop-blur-md sm:px-8"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      {/* Gauche : logo + nav */}
      <div className="flex items-center gap-8">
        <span className="select-none text-base font-black tracking-tight text-white">
          Pulse<span className="text-neon-violet">Quizz</span>
        </span>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onShowStats('leaderboard')}
            aria-label="Voir le classement"
            className={navLinkClass}
          >
            Classement
          </button>
          <button
            type="button"
            onClick={() => onShowStats('stats')}
            aria-label="Voir les statistiques"
            className={navLinkClass}
          >
            Stats
          </button>
          <button
            type="button"
            onClick={onShowAchievements}
            aria-label="Voir les achievements"
            className={navLinkClass}
          >
            Achievements
          </button>
        </div>
      </div>

      {/* Droite : chip user (avatar + @pseudo + déconnexion groupés) */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onShowProfile}
          aria-label={`Ouvrir le profil de ${username}`}
          className="group flex items-center gap-2 rounded-full py-1 pl-1 pr-3 text-sm font-semibold text-white/80 transition-colors hover:text-white focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neon-violet/60"
        >
          {/* Avatar miniature à la place de l'icône personne */}
          <AvatarContainer className="h-7 w-7 flex-shrink-0" />
          <span className="underline decoration-white/20 decoration-1 underline-offset-4 transition-colors group-hover:decoration-neon-violet">
            @{username}
          </span>
        </button>

        {/* Déconnexion collée au chip */}
        <button
          type="button"
          onClick={onSignOut}
          aria-label="Se déconnecter"
          className="flex h-7 w-7 items-center justify-center rounded-full text-white/40 transition-colors hover:text-white/80 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neon-violet/60"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </div>
    </motion.nav>
  )
}
