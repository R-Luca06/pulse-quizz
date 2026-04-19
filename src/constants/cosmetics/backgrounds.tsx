import type { ComponentType } from 'react'
import type { AchievementTier } from '../../types/quiz'
import { HorizonIncandescentBg } from './solarSet'

export type BackgroundProps = Record<string, never>

interface BackgroundEntry {
  id: string
  name: string
  tier?: AchievementTier
  description?: string
  Component: ComponentType<BackgroundProps> | null
  setId?: string
}

// ─── Registry ─────────────────────────────────────────────────────────────────

export const DEFAULT_BACKGROUND_ID = 'default'

export const BACKGROUND_REGISTRY: Record<string, BackgroundEntry> = {
  [DEFAULT_BACKGROUND_ID]: {
    id:          DEFAULT_BACKGROUND_ID,
    name:        'Aucun',
    description: 'Fond sombre par défaut.',
    Component:   null,
  },
  horizon_incandescent: {
    id:          'horizon_incandescent',
    name:        'Horizon Incandescent',
    tier:        'legendary',
    setId:       'solaire_v1',
    description: 'Aube solaire et braises ascendantes. Set Héliarque · Vol. 01.',
    Component:   HorizonIncandescentBg,
  },
}

export function resolveBackground(id: string | null | undefined): BackgroundEntry {
  if (id && BACKGROUND_REGISTRY[id]) return BACKGROUND_REGISTRY[id]
  return BACKGROUND_REGISTRY[DEFAULT_BACKGROUND_ID]
}
