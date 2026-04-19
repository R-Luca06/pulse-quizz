/* eslint-disable react-refresh/only-export-components */
import type { ComponentType, ReactNode } from 'react'
import type { AchievementTier } from '../../types/quiz'
import { OrEnFusionCard } from './solarSet'

export interface CardDesignProps {
  children: ReactNode
}

interface CardDesignEntry {
  id: string
  name: string
  tier?: AchievementTier
  description?: string
  Component: ComponentType<CardDesignProps>
  setId?: string
}

// ─── Default ──────────────────────────────────────────────────────────────────
// Pas d'effet visuel : on laisse uniquement le rendu de la Nameplate.

function DefaultCardDesign({ children }: CardDesignProps) {
  return <div style={{ position: 'relative', display: 'inline-block', width: 'max-content' }}>{children}</div>
}

// ─── Registry ─────────────────────────────────────────────────────────────────

export const DEFAULT_CARD_DESIGN_ID = 'default'

export const CARD_DESIGN_REGISTRY: Record<string, CardDesignEntry> = {
  [DEFAULT_CARD_DESIGN_ID]: {
    id:          DEFAULT_CARD_DESIGN_ID,
    name:        'Carte par défaut',
    description: 'La carte de ton pseudo + titre, version standard.',
    Component:   DefaultCardDesign,
  },
  or_en_fusion: {
    id:          'or_en_fusion',
    name:        'Or en Fusion',
    tier:        'legendary',
    setId:       'solaire_v1',
    description: 'Cartouche doré aux bordures fluides. Set Héliarque · Vol. 01.',
    Component:   ({ children }: CardDesignProps) => <OrEnFusionCard>{children}</OrEnFusionCard>,
  },
}

export function resolveCardDesign(id: string | null | undefined): CardDesignEntry {
  if (id && CARD_DESIGN_REGISTRY[id]) return CARD_DESIGN_REGISTRY[id]
  return CARD_DESIGN_REGISTRY[DEFAULT_CARD_DESIGN_ID]
}
