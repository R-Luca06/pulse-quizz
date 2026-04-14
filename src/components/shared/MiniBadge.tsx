import type { AchievementId } from '../../types/quiz'
import { ACHIEVEMENT_MAP } from '../../constants/achievements'
import { BADGE_FILL, BADGE_TIER, TIER_STROKE } from '../../constants/achievementColors'

interface Props {
  achievementId: string
  size?: number     // largeur en px, hauteur = size * 1.125
  unlocked?: boolean // false = icon grisée (badges non débloqués dans la grille)
}

/**
 * Composant badge universel — hexagone gris + stroke par tier.
 * Utilisé dans le leaderboard, la page achievements, l'overlay d'unlock, etc.
 * Même rendu partout, aucune couleur de fond, stroke = seul différenciateur visuel.
 */
export default function MiniBadge({ achievementId, size = 16, unlocked = true }: Props) {
  const achievement = ACHIEVEMENT_MAP[achievementId as AchievementId]
  if (!achievement) return null

  const h      = Math.round(size * 1.125)
  const tier   = BADGE_TIER[achievementId as AchievementId]
  const stroke = unlocked ? TIER_STROKE[tier] : 'rgba(255,255,255,0.10)'

  return (
    <div
      className="relative shrink-0 flex items-center justify-center"
      style={{ width: size, height: h }}
      title={achievement.name}
    >
      <svg viewBox="0 0 64 72" className="absolute inset-0 h-full w-full" fill="none">
        <path
          d="M32 2 L62 20 L62 52 L32 70 L2 52 L2 20 Z"
          fill={BADGE_FILL}
          stroke={stroke}
          strokeWidth="2.5"
        />
      </svg>
      <span
        className={['relative z-10 select-none leading-none', !unlocked ? 'opacity-25 grayscale' : ''].join(' ')}
        style={{ fontSize: Math.round(size * 0.45) }}
      >
        {achievement.icon}
      </span>
    </div>
  )
}
