import type { AchievementId } from '../../types/quiz'
import { ACHIEVEMENT_MAP } from '../../constants/achievements'
import { BADGE_TIER, TIER_STROKE } from '../../constants/achievementColors'

interface Props {
  achievementId: string
  size?: number     // largeur en px, hauteur = size * 1.125
  unlocked?: boolean // false = icon grisée (badges non débloqués dans la grille)
}

// Clip-path hexagone (coordonnées % depuis le viewBox SVG 64×72)
const HEX_CLIP = 'polygon(50% 2.8%, 96.9% 27.8%, 96.9% 72.2%, 50% 97.2%, 3.1% 72.2%, 3.1% 27.8%)'
// Même chemin en SVG units (viewBox 0 0 64 72, périmètre ≈ 204)
const HEX_PATH = 'M32 2 L62 20 L62 52 L32 70 L2 52 L2 20 Z'

/**
 * Composant badge universel — hexagone avec fond glass + stroke par tier.
 * Utilisé dans le leaderboard, la page achievements, l'overlay d'unlock, etc.
 *
 * Visuels par tier :
 *   common    — contour blanc très subtil, pas d'animation
 *   rare      — contour bleu ciel, pas d'animation
 *   epic      — contour violet + running light + glow pulsant (badge-electric)
 *   legendary — contour or + 2 running lights + glow pulsant (badge-gold)
 */
export default function MiniBadge({ achievementId, size = 16, unlocked = true }: Props) {
  const achievement = ACHIEVEMENT_MAP[achievementId as AchievementId]
  if (!achievement) return null

  const h      = Math.round(size * 1.125)
  const tier   = BADGE_TIER[achievementId as AchievementId]
  const stroke = unlocked ? TIER_STROKE[tier] : 'rgba(255,255,255,0.10)'

  // Glow pulsant via filter:drop-shadow sur le container (tailwind animate-badge-*)
  // Ces classes génèrent le @keyframes + la classe CSS nécessaire.
  const glowClass = unlocked
    ? tier === 'epic'      ? 'animate-badge-electric'
    : tier === 'legendary' ? 'animate-badge-gold'
    : ''
    : ''

  return (
    <div
      className={`relative shrink-0 flex items-center justify-center ${glowClass}`}
      style={{ width: size, height: h }}
      title={achievement.name}
    >
      {/* ── Glass background — clip-path hexagone ──────────────────────────── */}
      {/* Gradient subtil qui simule un verre dépoli sur fond sombre */}
      <div
        className="absolute inset-0"
        style={{
          clipPath: HEX_CLIP,
          background: 'linear-gradient(160deg, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0.03) 55%, rgba(255,255,255,0.01) 100%)',
        }}
      />

      {/* ── SVG : contour de base + running lights (épique/légendaire) ─────── */}
      <svg viewBox="0 0 64 72" className="absolute inset-0 h-full w-full" fill="none">
        {/* Contour de base — stroke par tier */}
        <path d={HEX_PATH} stroke={stroke} strokeWidth="2.5" />

        {/* Épique : un point lumineux violet qui parcourt le contour (5s/tour) */}
        {unlocked && tier === 'epic' && (
          <path
            d={HEX_PATH}
            stroke="#c4b5fd"
            strokeWidth="2.5"
            strokeDasharray="25 179"
            strokeLinecap="round"
            style={{ animation: 'stroke-flow 5s linear infinite' }}
          />
        )}

        {/* Légendaire : deux points or opposés à 180° (3.5s/tour) */}
        {unlocked && tier === 'legendary' && (
          <>
            <path
              d={HEX_PATH}
              stroke="#fcd34d"
              strokeWidth="2.5"
              strokeDasharray="28 176"
              strokeLinecap="round"
              style={{ animation: 'stroke-flow 3.5s linear infinite' }}
            />
            <path
              d={HEX_PATH}
              stroke="#fbbf24"
              strokeWidth="2.5"
              strokeDasharray="28 176"
              strokeLinecap="round"
              style={{ animation: 'stroke-flow-b 3.5s linear infinite' }}
            />
          </>
        )}
      </svg>

      {/* ── Icône ──────────────────────────────────────────────────────────── */}
      <span
        className={['relative z-10 select-none leading-none', !unlocked ? 'opacity-25 grayscale' : ''].join(' ')}
        style={{ fontSize: Math.round(size * 0.45) }}
      >
        {achievement.icon}
      </span>
    </div>
  )
}
