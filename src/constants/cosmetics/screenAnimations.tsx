import type { ComponentType } from 'react'
import type { AchievementTier } from '../../types/quiz'

export type ScreenAnimationProps = Record<string, never>

interface AnimationEntry {
  id: string
  name: string
  tier?: AchievementTier
  Component: ComponentType<ScreenAnimationProps> | null
}

export const DEFAULT_ANIMATION_ID = 'none'

export const ANIMATION_REGISTRY: Record<string, AnimationEntry> = {
  [DEFAULT_ANIMATION_ID]: {
    id:        DEFAULT_ANIMATION_ID,
    name:      'Aucune',
    Component: null,
  },
}

export function resolveAnimation(id: string | null | undefined): AnimationEntry {
  if (id && ANIMATION_REGISTRY[id]) return ANIMATION_REGISTRY[id]
  return ANIMATION_REGISTRY[DEFAULT_ANIMATION_ID]
}
