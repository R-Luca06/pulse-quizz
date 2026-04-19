/* eslint-disable react-refresh/only-export-components */
import type { ComponentType } from 'react'
import { motion } from 'framer-motion'
import type { AchievementTier } from '../../types/quiz'
import { HeliarqueEmblem } from './solarSet'

export interface EmblemProps {
  rank: number | null
}

interface EmblemEntry {
  id: string
  name: string
  tier?: AchievementTier
  description?: string
  Component: ComponentType<EmblemProps>
  setId?: string
}

// ─── Default ──────────────────────────────────────────────────────────────────

function DefaultRankEmblem({ rank }: EmblemProps) {
  const isTop10 = !!rank && rank <= 10
  const isTop50 = !!rank && rank <= 50
  const color = !rank ? 'rgba(255,255,255,0.18)' : isTop10 ? '#f59e0b' : isTop50 ? '#94a3b8' : '#6b7280'

  return (
    <motion.div
      initial={{ opacity: 0, y: -14, scale: 0.85 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.25, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
    >
      {rank && <div style={{ position: 'absolute', inset: -10, background: `radial-gradient(circle, ${color}28 0%, transparent 70%)`, filter: 'blur(8px)', pointerEvents: 'none' }} />}
      <svg width="64" height="74" viewBox="-32 -37 64 74" fill="none">
        <path d="M -24,-33 L 24,-33 L 24,4 C 24,16 9,30 0,36 C -9,30 -24,16 -24,4 Z" fill="rgba(14,10,28,0.95)" stroke={color} strokeWidth="1.5" strokeDasharray={rank ? undefined : '4 3'} />
        <path d="M -19,-28 L 19,-28 L 19,2 C 19,12 7,24 0,29 C -7,24 -19,12 -19,2 Z" fill="none" stroke={color + '55'} strokeWidth="0.8" />
        <circle cx="-24" cy="-33" r="2.5" fill={color + '80'} />
        <circle cx="24" cy="-33" r="2.5" fill={color + '80'} />
        {rank
          ? <>
              <text x="0" y="-4" textAnchor="middle" dominantBaseline="middle" fill={color} fontSize="13" fontWeight="900" letterSpacing="-0.5">#{rank}</text>
              <text x="0" y="12" textAnchor="middle" dominantBaseline="middle" fill={color + 'aa'} fontSize="6" fontWeight="700" letterSpacing="1">RANG</text>
            </>
          : <>
              <text x="0" y="-4" textAnchor="middle" dominantBaseline="middle" fill={color} fontSize="18" fontWeight="900">?</text>
              <text x="0" y="12" textAnchor="middle" dominantBaseline="middle" fill={color + 'aa'} fontSize="5.5" fontWeight="700" letterSpacing="0.8">À CLASSER</text>
            </>
        }
      </svg>
      <div style={{ display: 'flex', gap: 3, marginTop: -2 }}>
        {[0, 1, 2].map(i => <div key={i} style={{ width: 3, height: 3, borderRadius: '50%', background: `${color}60`, border: `1px solid ${color}80` }} />)}
      </div>
      <div style={{ width: 1.5, height: 8, background: `${color}40` }} />
    </motion.div>
  )
}

// ─── Registry ─────────────────────────────────────────────────────────────────

export const DEFAULT_EMBLEM_ID = 'default_rank'

export const EMBLEM_REGISTRY: Record<string, EmblemEntry> = {
  [DEFAULT_EMBLEM_ID]: {
    id:          DEFAULT_EMBLEM_ID,
    name:        'Blason de rang',
    description: 'Affiche ton rang mondial actuel. Blason par défaut.',
    Component:   DefaultRankEmblem,
  },
  heliarque: {
    id:          'heliarque',
    name:        'Héliarque',
    tier:        'legendary',
    setId:       'solaire_v1',
    description: 'Blason solaire couronné. Set Héliarque · Vol. 01.',
    Component:   () => <HeliarqueEmblem />,
  },
}

export function resolveEmblem(id: string | null | undefined): EmblemEntry {
  if (id && EMBLEM_REGISTRY[id]) return EMBLEM_REGISTRY[id]
  return EMBLEM_REGISTRY[DEFAULT_EMBLEM_ID]
}
