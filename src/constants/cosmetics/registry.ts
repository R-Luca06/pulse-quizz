import type { AchievementTier, CosmeticType } from '../../types/quiz'
import { ACHIEVEMENT_MAP }                       from '../achievements'
import { SHOP_BADGE_REGISTRY }                   from '../shopBadges'
import { EMBLEM_REGISTRY,       DEFAULT_EMBLEM_ID }       from './emblems'
import { TITLE_REGISTRY,        DEFAULT_TITLE_ID }        from './titles'
import { CARD_DESIGN_REGISTRY,  DEFAULT_CARD_DESIGN_ID }  from './cardDesigns'
import { BACKGROUND_REGISTRY,   DEFAULT_BACKGROUND_ID }   from './backgrounds'
import { ANIMATION_REGISTRY,    DEFAULT_ANIMATION_ID }    from './screenAnimations'

export interface CosmeticMeta {
  id:          string
  type:        CosmeticType
  name:        string
  tier:        AchievementTier
  description: string
  isDefault:   boolean
}

const TIER_FALLBACK: AchievementTier = 'common'

export const COSMETIC_TYPE_LABEL: Record<CosmeticType, string> = {
  emblem:           'Blason',
  title:            'Titre',
  card_design:      'Carte',
  background:       'Fond',
  screen_animation: 'Animation',
}

export const COSMETIC_TYPE_LABEL_PLURAL: Record<CosmeticType, string> = {
  emblem:           'Blasons',
  title:            'Titres',
  card_design:      'Cartes',
  background:       'Fonds',
  screen_animation: 'Animations',
}

export const DEFAULT_ID_BY_TYPE: Record<CosmeticType, string> = {
  emblem:           DEFAULT_EMBLEM_ID,
  title:            DEFAULT_TITLE_ID,
  card_design:      DEFAULT_CARD_DESIGN_ID,
  background:       DEFAULT_BACKGROUND_ID,
  screen_animation: DEFAULT_ANIMATION_ID,
}

function registryFor(type: CosmeticType): Record<string, { id: string; name: string; tier?: AchievementTier; description?: string }> {
  switch (type) {
    case 'emblem':           return EMBLEM_REGISTRY
    case 'title':            return TITLE_REGISTRY
    case 'card_design':      return CARD_DESIGN_REGISTRY
    case 'background':       return BACKGROUND_REGISTRY
    case 'screen_animation': return ANIMATION_REGISTRY
  }
}

export function getCosmetic(type: CosmeticType, id: string | null | undefined): CosmeticMeta {
  const reg = registryFor(type)
  const defId = DEFAULT_ID_BY_TYPE[type]
  const entry = (id && reg[id]) || reg[defId]
  return {
    id:          entry.id,
    type,
    name:        entry.name,
    tier:        entry.tier ?? TIER_FALLBACK,
    description: entry.description ?? '',
    isDefault:   entry.id === defId,
  }
}

export function listCosmetics(type: CosmeticType): CosmeticMeta[] {
  const reg = registryFor(type)
  const defId = DEFAULT_ID_BY_TYPE[type]
  return Object.values(reg).map(entry => ({
    id:          entry.id,
    type,
    name:        entry.name,
    tier:        entry.tier ?? TIER_FALLBACK,
    description: entry.description ?? '',
    isDefault:   entry.id === defId,
  }))
}

export interface BadgeMeta {
  id:   string
  name: string
  icon: string
  tier: AchievementTier
}

export function getBadgeMeta(id: string): BadgeMeta | null {
  const ach = ACHIEVEMENT_MAP[id as keyof typeof ACHIEVEMENT_MAP]
  if (ach) return { id: ach.id, name: ach.name, icon: ach.icon, tier: ach.tier }
  const shop = SHOP_BADGE_REGISTRY[id]
  if (shop) return { id: shop.id, name: shop.name, icon: shop.icon, tier: shop.tier }
  return null
}
