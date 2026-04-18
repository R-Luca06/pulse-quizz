/* eslint-disable react-refresh/only-export-components */
import type { ComponentType } from 'react'
import { motion } from 'framer-motion'
import type { AchievementTier } from '../../types/quiz'

export type ScreenAnimationProps = Record<string, never>

interface AnimationEntry {
  id: string
  name: string
  tier?: AchievementTier
  description?: string
  Component: ComponentType<ScreenAnimationProps> | null
}

// ─── Pluie de Pulses ◈ ────────────────────────────────────────────────────────

const PULSES_DROPS = Array.from({ length: 14 }, (_, i) => {
  const seed = (i + 1) * 17
  return {
    left: (seed * 7) % 100,
    delay: ((seed * 5) % 60) / 10,
    duration: 6 + ((seed * 3) % 30) / 10,
    size: 9 + ((seed * 11) % 7),
  }
})

function PluiePulses() {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {PULSES_DROPS.map((d, i) => (
        <motion.span
          key={i}
          initial={{ y: '-10%', opacity: 0 }}
          animate={{ y: '110%', opacity: [0, 0.85, 0.85, 0] }}
          transition={{ duration: d.duration, delay: d.delay, repeat: Infinity, ease: 'linear' }}
          style={{
            position: 'absolute',
            left: `${d.left}%`,
            fontSize: d.size,
            color: '#a78bfa',
            textShadow: '0 0 6px rgba(167,139,250,0.7), 0 0 12px rgba(139,92,246,0.4)',
            fontWeight: 900,
          }}
        >
          ◈
        </motion.span>
      ))}
    </div>
  )
}

// ─── Étincelles dorées ────────────────────────────────────────────────────────

const SPARKS = Array.from({ length: 18 }, (_, i) => {
  const seed = (i + 1) * 23
  return {
    x: (seed * 13) % 100,
    y: (seed * 31) % 100,
    delay: ((seed * 9) % 50) / 10,
    duration: 1.8 + ((seed * 7) % 18) / 10,
    size: 1.6 + ((seed * 5) % 12) / 10,
  }
})

function EtincellesDorees() {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {SPARKS.map((s, i) => (
        <motion.span
          key={i}
          animate={{ opacity: [0, 1, 0], scale: [0.4, 1.2, 0.4] }}
          transition={{ duration: s.duration, delay: s.delay, repeat: Infinity, ease: 'easeOut' }}
          style={{
            position: 'absolute',
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.size,
            height: s.size,
            borderRadius: '50%',
            background: '#fde68a',
            boxShadow: '0 0 6px rgba(251,191,36,0.85), 0 0 12px rgba(245,158,11,0.45)',
          }}
        />
      ))}
    </div>
  )
}

// ─── Particules violet néon ───────────────────────────────────────────────────

const PARTICLES = Array.from({ length: 22 }, (_, i) => {
  const seed = (i + 1) * 19
  return {
    left: (seed * 11) % 100,
    delay: ((seed * 7) % 80) / 10,
    duration: 9 + ((seed * 5) % 40) / 10,
    drift: -10 + ((seed * 3) % 20),
    size: 1.4 + ((seed * 5) % 14) / 10,
  }
})

function ParticulesViolet() {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {PARTICLES.map((p, i) => (
        <motion.div
          key={i}
          initial={{ y: '110%', x: 0, opacity: 0 }}
          animate={{ y: '-10%', x: p.drift, opacity: [0, 0.7, 0.7, 0] }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: 'linear' }}
          style={{
            position: 'absolute',
            left: `${p.left}%`,
            bottom: 0,
            width: p.size,
            height: p.size,
            borderRadius: '50%',
            background: '#c4b5fd',
            boxShadow: '0 0 5px rgba(167,139,250,0.7)',
          }}
        />
      ))}
    </div>
  )
}

// ─── Éclairs occasionnels ─────────────────────────────────────────────────────

const FLASHES = [
  { delay: 2.4,  duration: 0.45 },
  { delay: 7.8,  duration: 0.4  },
  { delay: 13.5, duration: 0.5  },
]

function EclairsOccasionnels() {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {FLASHES.map((f, i) => (
        <motion.div
          key={i}
          animate={{ opacity: [0, 0.55, 0, 0.35, 0] }}
          transition={{
            duration: f.duration,
            delay: f.delay,
            repeat: Infinity,
            repeatDelay: 16,
            ease: 'easeOut',
            times: [0, 0.15, 0.45, 0.6, 1],
          }}
          style={{
            position: 'absolute',
            inset: 0,
            background:
              i === 0
                ? 'radial-gradient(circle at 30% 20%, rgba(167,139,250,0.55) 0%, transparent 55%)'
                : i === 1
                  ? 'radial-gradient(circle at 70% 30%, rgba(96,165,250,0.50) 0%, transparent 55%)'
                  : 'radial-gradient(circle at 50% 15%, rgba(196,181,253,0.55) 0%, transparent 60%)',
            mixBlendMode: 'screen',
          }}
        />
      ))}
      <motion.svg
        animate={{ opacity: [0, 0.85, 0] }}
        transition={{ duration: 0.4, delay: 13.55, repeat: Infinity, repeatDelay: 16, ease: 'easeOut' }}
        viewBox="0 0 100 200"
        preserveAspectRatio="xMidYMin slice"
        style={{ position: 'absolute', top: 0, left: '45%', width: 60, height: 200, pointerEvents: 'none' }}
      >
        <path
          d="M 50,0 L 42,50 L 58,55 L 36,120 L 54,118 L 28,200"
          fill="none"
          stroke="#ede9fe"
          strokeWidth="1.4"
          strokeLinejoin="round"
          style={{ filter: 'drop-shadow(0 0 4px #a78bfa) drop-shadow(0 0 10px #8b5cf6)' }}
        />
      </motion.svg>
    </div>
  )
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
  pluie_pulses: {
    id:          'pluie_pulses',
    name:        'Pluie de Pulses ◈',
    tier:        'rare',
    description: 'Des symboles ◈ tombent lentement en surcouche.',
    Component:   PluiePulses,
  },
  etincelles_dorees: {
    id:          'etincelles_dorees',
    name:        'Étincelles dorées',
    tier:        'epic',
    description: 'Pluie d’étincelles dorées qui flottent sur l’écran.',
    Component:   EtincellesDorees,
  },
  particules_violet: {
    id:          'particules_violet',
    name:        'Particules violet néon',
    tier:        'common',
    description: 'Particules violettes qui dérivent doucement.',
    Component:   ParticulesViolet,
  },
  eclairs: {
    id:          'eclairs',
    name:        'Éclairs occasionnels',
    tier:        'legendary',
    description: 'Éclairs spectaculaires apparaissant ponctuellement.',
    Component:   EclairsOccasionnels,
  },
}

export function resolveAnimation(id: string | null | undefined): AnimationEntry {
  if (id && ANIMATION_REGISTRY[id]) return ANIMATION_REGISTRY[id]
  return ANIMATION_REGISTRY[DEFAULT_ANIMATION_ID]
}
