import type { ComponentType } from 'react'
import type { AchievementTier } from '../../types/quiz'
import { BraisesAscendantesAnim } from './solarSet'

export type ScreenAnimationProps = Record<string, never>

interface AnimationEntry {
  id: string
  name: string
  tier?: AchievementTier
  description?: string
  Component: ComponentType<ScreenAnimationProps> | null
  setId?: string
}

// ─── Registry ─────────────────────────────────────────────────────────────────

export const DEFAULT_ANIMATION_ID = 'none'

export const ANIMATION_REGISTRY: Record<string, AnimationEntry> = {
  [DEFAULT_ANIMATION_ID]: {
    id:          DEFAULT_ANIMATION_ID,
    name:        'Aucune',
    description: 'Aucune animation en surcouche.',
    Component:   null,
  },
  braises_ascendantes: {
    id:          'braises_ascendantes',
    name:        'Braises Ascendantes',
    tier:        'legendary',
    setId:       'solaire_v1',
    description: 'Overlay de braises dorées ascendantes. Set Héliarque · Vol. 01.',
    Component:   BraisesAscendantesAnim,
  },
}

export function resolveAnimation(id: string | null | undefined): AnimationEntry {
  if (id && ANIMATION_REGISTRY[id]) return ANIMATION_REGISTRY[id]
  return ANIMATION_REGISTRY[DEFAULT_ANIMATION_ID]
}
