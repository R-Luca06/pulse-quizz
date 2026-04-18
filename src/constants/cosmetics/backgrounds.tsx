/* eslint-disable react-refresh/only-export-components */
import type { ComponentType } from 'react'
import { motion } from 'framer-motion'
import type { AchievementTier } from '../../types/quiz'

export type BackgroundProps = Record<string, never>

interface BackgroundEntry {
  id: string
  name: string
  tier?: AchievementTier
  description?: string
  Component: ComponentType<BackgroundProps> | null
}

// ─── Aurore violette ──────────────────────────────────────────────────────────

function AuroreViolette() {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <motion.div
        animate={{ backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute',
          inset: '-20%',
          background: 'radial-gradient(circle at 25% 30%, rgba(139,92,246,0.18) 0%, transparent 45%), radial-gradient(circle at 75% 70%, rgba(59,130,246,0.16) 0%, transparent 50%), radial-gradient(circle at 50% 50%, rgba(196,181,253,0.10) 0%, transparent 60%)',
          backgroundSize: '180% 180%',
          filter: 'blur(40px)',
        }}
      />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 0%, rgba(10,7,20,0.55) 100%)' }} />
    </div>
  )
}

// ─── Constellation ────────────────────────────────────────────────────────────

const STARS = Array.from({ length: 38 }, (_, i) => {
  const seed = (i + 1) * 37
  return {
    x: (seed * 13) % 100,
    y: (seed * 29) % 100,
    size: 0.6 + ((seed * 7) % 18) / 10,
    delay: ((seed * 3) % 40) / 10,
    duration: 2.4 + ((seed * 11) % 30) / 10,
  }
})

function Constellation() {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: 'radial-gradient(ellipse at center, rgba(20,14,38,0.55) 0%, rgba(6,4,14,0.85) 100%)' }}>
      {STARS.map((s, i) => (
        <motion.div
          key={i}
          animate={{ opacity: [0.15, 0.85, 0.15], scale: [0.8, 1.1, 0.8] }}
          transition={{ duration: s.duration, delay: s.delay, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute',
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.size,
            height: s.size,
            borderRadius: '50%',
            background: '#e0e7ff',
            boxShadow: '0 0 4px rgba(196,181,253,0.6)',
          }}
        />
      ))}
    </div>
  )
}

// ─── Grille néon ──────────────────────────────────────────────────────────────

function GrilleNeon() {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, rgba(6,182,212,0.05) 0%, transparent 60%), linear-gradient(0deg, rgba(139,92,246,0.06) 0%, transparent 60%)',
        }}
      />
      <motion.div
        animate={{ backgroundPosition: ['0px 0px', '0px 32px'] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: 'linear' }}
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'linear-gradient(rgba(6,182,212,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.18) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
          maskImage: 'linear-gradient(180deg, transparent 0%, black 25%, black 75%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(180deg, transparent 0%, black 25%, black 75%, transparent 100%)',
          opacity: 0.55,
        }}
      />
    </div>
  )
}

// ─── Nébuleuse dorée ──────────────────────────────────────────────────────────

function NebuleuseDoree() {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: 'radial-gradient(ellipse at top, rgba(40,30,15,0.55) 0%, rgba(6,4,14,0.95) 100%)' }}>
      <motion.div
        animate={{ scale: [1, 1.15, 1], rotate: [0, 6, 0] }}
        transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute',
          top: '15%',
          left: '20%',
          width: '60%',
          height: '60%',
          background: 'radial-gradient(circle, rgba(245,158,11,0.22) 0%, rgba(234,179,8,0.10) 35%, transparent 65%)',
          filter: 'blur(28px)',
        }}
      />
      <motion.div
        animate={{ scale: [1.1, 1, 1.1], rotate: [0, -8, 0] }}
        transition={{ duration: 32, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
        style={{
          position: 'absolute',
          bottom: '10%',
          right: '15%',
          width: '50%',
          height: '50%',
          background: 'radial-gradient(circle, rgba(251,191,36,0.18) 0%, rgba(245,158,11,0.06) 40%, transparent 70%)',
          filter: 'blur(32px)',
        }}
      />
      {Array.from({ length: 14 }).map((_, i) => {
        const x = (i * 73) % 100
        const y = (i * 41) % 100
        const d = 2.6 + ((i * 7) % 18) / 10
        return (
          <motion.div
            key={i}
            animate={{ opacity: [0.2, 0.85, 0.2] }}
            transition={{ duration: d, delay: (i * 0.27) % 4, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              position: 'absolute',
              left: `${x}%`,
              top: `${y}%`,
              width: 1.2,
              height: 1.2,
              borderRadius: '50%',
              background: '#fde68a',
              boxShadow: '0 0 4px rgba(251,191,36,0.7)',
            }}
          />
        )
      })}
    </div>
  )
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
  aurore_violette: {
    id:          'aurore_violette',
    name:        'Aurore violette',
    tier:        'rare',
    description: 'Nuages dégradés violet → bleu qui dérivent lentement derrière ton profil.',
    Component:   AuroreViolette,
  },
  constellation: {
    id:          'constellation',
    name:        'Constellation',
    tier:        'rare',
    description: 'Ciel étoilé scintillant en arrière-plan.',
    Component:   Constellation,
  },
  grille_neon: {
    id:          'grille_neon',
    name:        'Grille néon',
    tier:        'epic',
    description: 'Grille cyberpunk violet électrique.',
    Component:   GrilleNeon,
  },
  nebuleuse_doree: {
    id:          'nebuleuse_doree',
    name:        'Nébuleuse dorée',
    tier:        'legendary',
    description: 'Nébuleuse dorée/ocre, exclusive aux joueurs légendaires.',
    Component:   NebuleuseDoree,
  },
}

export function resolveBackground(id: string | null | undefined): BackgroundEntry {
  if (id && BACKGROUND_REGISTRY[id]) return BACKGROUND_REGISTRY[id]
  return BACKGROUND_REGISTRY[DEFAULT_BACKGROUND_ID]
}
