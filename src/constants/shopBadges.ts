import type { AchievementTier } from '../types/quiz'

export interface ShopBadgeMeta {
  id:          string
  name:        string
  icon:        string
  tier:        AchievementTier
  description: string
}

export const SHOP_BADGE_REGISTRY: Record<string, ShopBadgeMeta> = {
  shop_badge_crown:   { id: 'shop_badge_crown',   name: 'Couronne de la Boutique', icon: '👑', tier: 'legendary', description: 'Badge exclusif acheté dans la Boutique.' },
  shop_badge_diamond: { id: 'shop_badge_diamond', name: 'Diamant de la Boutique',  icon: '💎', tier: 'epic',      description: 'Badge exclusif acheté dans la Boutique.' },
}

export function getShopBadge(id: string): ShopBadgeMeta | null {
  return SHOP_BADGE_REGISTRY[id] ?? null
}
