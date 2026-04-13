import type { AchievementId } from '../../types/quiz'
import { ACHIEVEMENT_MAP } from '../../constants/achievements'
import { BADGE_COLOR_HEX } from '../../constants/achievementColors'

interface Props {
  achievementId: string
  size?: number  // largeur en px, hauteur = size * 1.125
}

export default function MiniBadge({ achievementId, size = 16 }: Props) {
  const hex = BADGE_COLOR_HEX[achievementId as AchievementId]
  const achievement = ACHIEVEMENT_MAP[achievementId as AchievementId]
  if (!hex || !achievement) return null

  const h = Math.round(size * 1.125)

  return (
    <div
      className="relative flex shrink-0 items-center justify-center"
      style={{ width: size, height: h }}
      title={achievement.name}
    >
      <svg viewBox="0 0 64 72" className="absolute inset-0 h-full w-full" fill="none">
        <path
          d="M32 2 L62 20 L62 52 L32 70 L2 52 L2 20 Z"
          fill={hex}
          stroke="rgba(255,255,255,0.18)"
          strokeWidth="2"
        />
      </svg>
      <span
        className="relative z-10 select-none leading-none"
        style={{ fontSize: Math.round(size * 0.55) }}
      >
        {achievement.icon}
      </span>
    </div>
  )
}
