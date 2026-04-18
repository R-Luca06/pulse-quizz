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
  description?: string
  Component: ComponentType<CardDesignProps>
}

// ─── Default ──────────────────────────────────────────────────────────────────
// Pas d'effet visuel : on laisse uniquement le rendu de la Nameplate.

function DefaultCardDesign({ children }: CardDesignProps) {
  return <div style={{ position: 'relative', display: 'inline-block', width: 'max-content' }}>{children}</div>
}

// ─── Carte holographique ──────────────────────────────────────────────────────
// Bordure animée arc-en-ciel + shimmer, fond transparent.

function HolographiqueDesign({ children }: CardDesignProps) {
  return (
    <div style={{ position: 'relative', display: 'inline-block', width: 'max-content', borderRadius: 6, background: 'linear-gradient(135deg, rgba(236,72,153,0.18) 0%, rgba(167,139,250,0.16) 35%, rgba(6,182,212,0.16) 70%, rgba(251,191,36,0.16) 100%), #120c24' }}>
      <motion.span
        aria-hidden
        animate={{ backgroundPosition: ['0% 50%', '200% 50%'] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
        style={{
          position: 'absolute',
          inset: -1.5,
          borderRadius: 6,
          padding: 1.5,
          background: 'linear-gradient(120deg, #ec4899, #a78bfa, #06b6d4, #fbbf24, #ec4899)',
          backgroundSize: '200% 100%',
          WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
          WebkitMaskComposite: 'xor',
          mask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
          maskComposite: 'exclude',
          pointerEvents: 'none',
        }}
      />
      <span style={{ position: 'relative', display: 'block', overflow: 'hidden', borderRadius: 4 }}>
        {children}
        <motion.span
          aria-hidden
          animate={{ x: ['-120%', '220%'] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1.2 }}
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            width: '40%',
            background: 'linear-gradient(110deg, transparent 30%, rgba(196,181,253,0.18) 50%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
      </span>
    </div>
  )
}

// ─── Parchemin d'or ───────────────────────────────────────────────────────────

function ParcheminDorDesign({ children }: CardDesignProps) {
  const corner = (top: number | 'auto', right: number | 'auto', bottom: number | 'auto', left: number | 'auto', rotate: number) => (
    <svg width="14" height="14" viewBox="0 0 22 22" style={{ position: 'absolute', top, right, bottom, left, transform: `rotate(${rotate}deg)`, pointerEvents: 'none' }}>
      <path d="M 2,2 L 18,2 L 18,4 L 4,4 L 4,18 L 2,18 Z" fill="#fbbf24" fillOpacity="0.7" />
      <circle cx="6" cy="6" r="1.4" fill="#fbbf24" fillOpacity="0.85" />
    </svg>
  )
  return (
    <div
      style={{
        position: 'relative',
        display: 'inline-block',
        width: 'max-content',
        padding: 2,
        borderRadius: 5,
        border: '1px solid rgba(251,191,36,0.55)',
        background: 'linear-gradient(135deg, rgba(251,191,36,0.18) 0%, rgba(146,64,14,0.30) 100%), #1a1208',
        boxShadow: 'inset 0 0 12px rgba(251,191,36,0.10), 0 0 14px rgba(245,158,11,0.18)',
      }}
    >
      {corner(-2, 'auto', 'auto', -2, 0)}
      {corner(-2, -2, 'auto', 'auto', 90)}
      {corner('auto', -2, -2, 'auto', 180)}
      {corner('auto', 'auto', -2, -2, 270)}
      {children}
    </div>
  )
}

// ─── Carte givrée ─────────────────────────────────────────────────────────────

function GivreDesign({ children }: CardDesignProps) {
  return (
    <div
      style={{
        position: 'relative',
        display: 'inline-block',
        width: 'max-content',
        borderRadius: 5,
        border: '1px solid rgba(103,232,249,0.4)',
        background: 'linear-gradient(135deg, rgba(103,232,249,0.16) 0%, rgba(59,130,246,0.18) 100%), #0a1428',
        boxShadow: 'inset 0 0 10px rgba(103,232,249,0.10), 0 0 14px rgba(59,130,246,0.18)',
      }}
    >
      {children}
      <motion.span
        aria-hidden
        animate={{ x: ['-70%', '170%'] }}
        transition={{ duration: 7.5, repeat: Infinity, ease: 'easeInOut', repeatDelay: 2.5 }}
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 5,
          overflow: 'hidden',
          pointerEvents: 'none',
        }}
      >
        <span style={{
          position: 'absolute', top: 0, bottom: 0, width: '35%',
          background: 'linear-gradient(110deg, transparent 35%, rgba(255,255,255,0.10) 50%, transparent 65%)',
        }} />
      </motion.span>
    </div>
  )
}

// ─── Rune arcane ──────────────────────────────────────────────────────────────

const RUNES = ['◇', '✦', '◈', '✧']

function RuneArcaneDesign({ children }: CardDesignProps) {
  return (
    <div
      style={{
        position: 'relative',
        display: 'inline-block',
        width: 'max-content',
        borderRadius: 5,
        border: '1px solid rgba(167,139,250,0.55)',
        background: 'radial-gradient(circle at 30% 30%, rgba(167,139,250,0.25) 0%, rgba(10,7,20,0.95) 70%)',
        boxShadow: '0 0 14px rgba(139,92,246,0.20)',
      }}
    >
      {children}
      <span
        aria-hidden
        style={{ position: 'absolute', top: -10, left: 6, fontSize: 9, color: 'rgba(196,181,253,0.7)', textShadow: '0 0 4px rgba(139,92,246,0.6)', pointerEvents: 'none' }}
      >
        {RUNES[0]}
      </span>
      <span
        aria-hidden
        style={{ position: 'absolute', top: -10, right: 6, fontSize: 9, color: 'rgba(196,181,253,0.7)', textShadow: '0 0 4px rgba(139,92,246,0.6)', pointerEvents: 'none' }}
      >
        {RUNES[1]}
      </span>
      <span
        aria-hidden
        style={{ position: 'absolute', bottom: -10, left: 6, fontSize: 9, color: 'rgba(196,181,253,0.7)', textShadow: '0 0 4px rgba(139,92,246,0.6)', pointerEvents: 'none' }}
      >
        {RUNES[2]}
      </span>
      <span
        aria-hidden
        style={{ position: 'absolute', bottom: -10, right: 6, fontSize: 9, color: 'rgba(196,181,253,0.7)', textShadow: '0 0 4px rgba(139,92,246,0.6)', pointerEvents: 'none' }}
      >
        {RUNES[3]}
      </span>
    </div>
  )
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
  holographique: {
    id:          'holographique',
    name:        'Carte holographique',
    tier:        'epic',
    description: 'Bordure animée aux reflets holographiques prismatiques.',
    Component:   HolographiqueDesign,
  },
  parchemin_dor: {
    id:          'parchemin_dor',
    name:        "Parchemin d'or",
    tier:        'legendary',
    description: 'Bordure dorée ornée de coins sculptés.',
    Component:   ParcheminDorDesign,
  },
  givre: {
    id:          'givre',
    name:        'Carte givrée',
    tier:        'rare',
    description: 'Bordure cyan glacée avec un reflet qui balaie le titre.',
    Component:   GivreDesign,
  },
  rune_arcane: {
    id:          'rune_arcane',
    name:        'Rune arcane',
    tier:        'epic',
    description: 'Glyphes runiques qui flottent autour de la carte.',
    Component:   RuneArcaneDesign,
  },
}

export function resolveCardDesign(id: string | null | undefined): CardDesignEntry {
  if (id && CARD_DESIGN_REGISTRY[id]) return CARD_DESIGN_REGISTRY[id]
  return CARD_DESIGN_REGISTRY[DEFAULT_CARD_DESIGN_ID]
}
