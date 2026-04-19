import type { ComponentType } from 'react'
import type { AchievementTier } from '../types/quiz'
import { EruptionGlyph, CouronneSolaireGlyph, PhenixGlyph } from './cosmetics/solarSet'

export interface ShopBadgeMeta {
  id:          string
  name:        string
  icon:        string
  tier:        AchievementTier
  description: string
  glyph?:      ComponentType<{ size?: number }>
  setId?:      string
}

export const SHOP_BADGE_REGISTRY: Record<string, ShopBadgeMeta> = {
  heliarque_eruption: {
    id:          'heliarque_eruption',
    name:        'Éruption',
    icon:        '🔥',
    tier:        'legendary',
    setId:       'solaire_v1',
    description: 'Flamme de forge en éruption. Set Héliarque · Vol. 01.',
    glyph:       EruptionGlyph,
  },
  heliarque_couronne_solaire: {
    id:          'heliarque_couronne_solaire',
    name:        'Couronne Solaire',
    icon:        '☀️',
    tier:        'legendary',
    setId:       'solaire_v1',
    description: 'Soleil couronné à douze rayons. Set Héliarque · Vol. 01.',
    glyph:       CouronneSolaireGlyph,
  },
  heliarque_phenix: {
    id:          'heliarque_phenix',
    name:        'Phénix',
    icon:        '🔆',
    tier:        'legendary',
    setId:       'solaire_v1',
    description: 'Phénix de braise, ailes déployées. Set Héliarque · Vol. 01.',
    glyph:       PhenixGlyph,
  },
}

export function getShopBadge(id: string): ShopBadgeMeta | null {
  return SHOP_BADGE_REGISTRY[id] ?? null
}
