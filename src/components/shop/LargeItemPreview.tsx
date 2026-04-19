import type { AchievementTier, ItemType, CosmeticType } from '../../types/quiz'
import { CosmeticPreview } from '../inventory/previews'
import MiniBadge from '../shared/MiniBadge'
import { BACKGROUND_REGISTRY } from '../../constants/cosmetics/backgrounds'
import { ANIMATION_REGISTRY }  from '../../constants/cosmetics/screenAnimations'

interface Props {
  itemType: ItemType
  itemId:   string
  tier:     AchievementTier
  variant?: 'lg' | 'md'
}

export default function LargeItemPreview({ itemType, itemId, variant = 'lg' }: Props) {
  if (itemType === 'badge') {
    return <MiniBadge achievementId={itemId} size={variant === 'lg' ? 92 : 52} />
  }
  if (itemType === 'background' && variant === 'lg') {
    return <LiveBackgroundPreview itemId={itemId} />
  }
  if (itemType === 'screen_animation' && variant === 'lg') {
    return <LiveAnimationPreview itemId={itemId} />
  }
  return <CosmeticPreview type={itemType as CosmeticType} id={itemId} size={variant === 'lg' ? 'lg' : 'md'} />
}

function LiveBackgroundPreview({ itemId }: { itemId: string }) {
  const entry = BACKGROUND_REGISTRY[itemId]
  const Comp  = entry?.Component
  return (
    <div
      style={{
        position:     'relative',
        width:        160,
        height:       110,
        borderRadius: 10,
        overflow:     'hidden',
        border:       '1px solid rgba(255,255,255,0.08)',
        background:   '#0a0a15',
      }}
      aria-hidden
    >
      {Comp && <Comp />}
    </div>
  )
}

function LiveAnimationPreview({ itemId }: { itemId: string }) {
  const entry = ANIMATION_REGISTRY[itemId]
  const Comp  = entry?.Component
  return (
    <div
      style={{
        position:     'relative',
        width:        160,
        height:       110,
        borderRadius: 10,
        overflow:     'hidden',
        border:       '1px solid rgba(255,255,255,0.08)',
        background:   'rgba(10,7,20,0.85)',
      }}
      aria-hidden
    >
      {Comp && <Comp />}
    </div>
  )
}
