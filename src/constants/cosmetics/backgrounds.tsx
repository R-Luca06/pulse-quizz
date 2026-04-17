import type { ComponentType } from 'react'
import type { AchievementTier } from '../../types/quiz'

export type BackgroundProps = Record<string, never>

interface BackgroundEntry {
  id: string
  name: string
  tier?: AchievementTier
  Component: ComponentType<BackgroundProps> | null
}

export const DEFAULT_BACKGROUND_ID = 'default'

export const BACKGROUND_REGISTRY: Record<string, BackgroundEntry> = {
  [DEFAULT_BACKGROUND_ID]: {
    id:        DEFAULT_BACKGROUND_ID,
    name:      'Aucun',
    Component: null,
  },
}

export function resolveBackground(id: string | null | undefined): BackgroundEntry {
  if (id && BACKGROUND_REGISTRY[id]) return BACKGROUND_REGISTRY[id]
  return BACKGROUND_REGISTRY[DEFAULT_BACKGROUND_ID]
}
