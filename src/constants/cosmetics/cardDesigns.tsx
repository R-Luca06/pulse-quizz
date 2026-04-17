/* eslint-disable react-refresh/only-export-components */
import type { ComponentType, ReactNode } from 'react'
import { motion } from 'framer-motion'
import type { AchievementTier } from '../../types/quiz'

export interface CardDesignProps {
  children: ReactNode
}

interface CardDesignEntry {
  id: string
  name: string
  tier?: AchievementTier
  Component: ComponentType<CardDesignProps>
}

function DefaultCardDesign({ children }: CardDesignProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.18, duration: 0.5 }}
      className="relative overflow-hidden rounded-2xl"
      style={{ background: 'radial-gradient(ellipse at 50% -10%, #241545 0%, #120d28 45%, #080614 100%)', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div style={{ position: 'absolute', top: -30, left: '50%', transform: 'translateX(-50%)', width: 200, height: 100, background: 'radial-gradient(ellipse, rgba(196,181,253,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 0.3, duration: 0.6, ease: 'easeOut' }}
        style={{ position: 'absolute', inset: '44px 0 auto', height: 6, background: 'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)', borderTop: '1px solid rgba(255,255,255,0.12)', borderBottom: '1px solid rgba(255,255,255,0.04)', transformOrigin: 'left' }}
      />
      {children}
    </motion.div>
  )
}

export const DEFAULT_CARD_DESIGN_ID = 'default'

export const CARD_DESIGN_REGISTRY: Record<string, CardDesignEntry> = {
  [DEFAULT_CARD_DESIGN_ID]: {
    id:        DEFAULT_CARD_DESIGN_ID,
    name:      'Salle par défaut',
    Component: DefaultCardDesign,
  },
}

export function resolveCardDesign(id: string | null | undefined): CardDesignEntry {
  if (id && CARD_DESIGN_REGISTRY[id]) return CARD_DESIGN_REGISTRY[id]
  return CARD_DESIGN_REGISTRY[DEFAULT_CARD_DESIGN_ID]
}
