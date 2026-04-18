import type { AchievementTier, ItemType, CosmeticType } from '../../types/quiz'
import { CosmeticPreview } from '../inventory/previews'
import { getBadgeMeta } from '../../constants/cosmetics/registry'

const TIER_STROKE: Record<AchievementTier, string> = {
  legendary: '#fbbf24',
  epic:      '#a78bfa',
  rare:      '#60a5fa',
  common:    'rgba(255,255,255,0.45)',
}

const TIER_GLOW: Record<AchievementTier, string> = {
  legendary: 'drop-shadow(0 0 20px rgba(245,158,11,0.45))',
  epic:      'drop-shadow(0 0 20px rgba(167,139,250,0.4))',
  rare:      'drop-shadow(0 0 18px rgba(96,165,250,0.3))',
  common:    'drop-shadow(0 0 10px rgba(255,255,255,0.15))',
}

interface Props {
  itemType: ItemType
  itemId:   string
  tier:     AchievementTier
  variant?: 'lg' | 'md'
}

export default function LargeItemPreview({ itemType, itemId, tier, variant = 'lg' }: Props) {
  if (itemType === 'badge') return <BadgeHex itemId={itemId} tier={tier} variant={variant} />
  return <CosmeticPreview type={itemType as CosmeticType} id={itemId} size={variant === 'lg' ? 'lg' : 'md'} />
}

function BadgeHex({ itemId, tier, variant }: { itemId: string; tier: AchievementTier; variant: 'lg' | 'md' }) {
  const meta = getBadgeMeta(itemId)
  const icon = meta?.icon ?? '✦'
  const stroke = TIER_STROKE[tier]
  const glow   = TIER_GLOW[tier]
  const w = variant === 'lg' ? 92 : 52
  const h = variant === 'lg' ? 104 : 58
  const fontSize = variant === 'lg' ? 44 : 24

  return (
    <div
      style={{ position: 'relative', width: w, height: h, filter: glow }}
      aria-hidden
    >
      <svg viewBox="0 0 64 72" width={w} height={h} fill="none">
        <defs>
          <linearGradient id={`lip-grad-${itemId}-${variant}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="rgba(255,255,255,0.25)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.18)" />
          </linearGradient>
        </defs>
        <path d="M32 2 L62 20 L62 52 L32 70 L2 52 L2 20 Z" fill="rgba(14,10,28,0.95)" stroke={stroke} strokeWidth="1.8" />
        <path d="M32 2 L62 20 L62 52 L32 70 L2 52 L2 20 Z" fill={`url(#lip-grad-${itemId}-${variant})`} />
      </svg>
      <span
        style={{
          position:       'absolute',
          inset:          0,
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          fontSize,
          userSelect:     'none',
        }}
      >
        {icon}
      </span>
    </div>
  )
}
