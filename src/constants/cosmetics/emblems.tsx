/* eslint-disable react-refresh/only-export-components */
import type { ComponentType } from 'react'
import { motion } from 'framer-motion'
import type { AchievementTier } from '../../types/quiz'

export interface EmblemProps {
  rank: number | null
}

interface EmblemEntry {
  id: string
  name: string
  tier?: AchievementTier
  description?: string
  Component: ComponentType<EmblemProps>
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ShieldFrame({ color, gradientId, children }: { color: string; gradientId: string; children: React.ReactNode }) {
  return (
    <svg width="64" height="74" viewBox="-32 -37 64 74" fill="none">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="-37" x2="0" y2="37" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="55%" stopColor="#0e0a1c" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#070411" stopOpacity="1" />
        </linearGradient>
      </defs>
      <path d="M -24,-33 L 24,-33 L 24,4 C 24,16 9,30 0,36 C -9,30 -24,16 -24,4 Z" fill={`url(#${gradientId})`} stroke={color} strokeWidth="1.5" />
      <path d="M -19,-28 L 19,-28 L 19,2 C 19,12 7,24 0,29 C -7,24 -19,12 -19,2 Z" fill="none" stroke={color + '55'} strokeWidth="0.8" />
      <circle cx="-24" cy="-33" r="2.5" fill={color + '80'} />
      <circle cx="24" cy="-33" r="2.5" fill={color + '80'} />
      {children}
    </svg>
  )
}

function EmblemFooter({ color }: { color: string }) {
  return (
    <>
      <div style={{ display: 'flex', gap: 3, marginTop: -2 }}>
        {[0, 1, 2].map(i => <div key={i} style={{ width: 3, height: 3, borderRadius: '50%', background: `${color}60`, border: `1px solid ${color}80` }} />)}
      </div>
      <div style={{ width: 1.5, height: 8, background: `${color}40` }} />
    </>
  )
}

// ─── Flamme d'or ──────────────────────────────────────────────────────────────

function FlamedorEmblem() {
  const color = '#fbbf24'
  return (
    <motion.div
      initial={{ opacity: 0, y: -14, scale: 0.85 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.25, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
    >
      <motion.div
        animate={{ opacity: [0.45, 0.85, 0.45] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        style={{ position: 'absolute', inset: -12, background: `radial-gradient(circle, ${color}50 0%, transparent 70%)`, filter: 'blur(10px)', pointerEvents: 'none' }}
      />
      <ShieldFrame color={color} gradientId="emblem-flame-grad">
        <motion.path
          d="M 0,-18 C -7,-9 -11,1 -8,9 C -5,16 5,16 8,9 C 11,1 7,-9 0,-18 Z"
          fill={color}
          fillOpacity="0.85"
          animate={{ opacity: [0.85, 1, 0.85], scale: [1, 1.05, 1] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          style={{ transformOrigin: 'center' }}
        />
        <path d="M 0,-8 C -3,-3 -4,3 -2,7 C 0,9 3,8 3,3 C 3,-1 1,-5 0,-8 Z" fill="#fde68a" />
        <text x="0" y="22" textAnchor="middle" dominantBaseline="middle" fill={color + 'cc'} fontSize="5" fontWeight="700" letterSpacing="1.4">FLAMME</text>
      </ShieldFrame>
      <EmblemFooter color={color} />
    </motion.div>
  )
}

// ─── Cristal de glace ─────────────────────────────────────────────────────────

function CristalDeGlaceEmblem() {
  const color = '#67e8f9'
  return (
    <motion.div
      initial={{ opacity: 0, y: -14, scale: 0.85 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.25, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
    >
      <motion.div
        animate={{ opacity: [0.35, 0.7, 0.35] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        style={{ position: 'absolute', inset: -10, background: `radial-gradient(circle, ${color}40 0%, transparent 70%)`, filter: 'blur(9px)', pointerEvents: 'none' }}
      />
      <ShieldFrame color={color} gradientId="emblem-crystal-grad">
        <motion.g
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
          style={{ transformOrigin: '0px 0px' }}
        >
          <path d="M 0,-16 L 11,-2 L 0,18 L -11,-2 Z" fill="none" stroke={color} strokeWidth="1.4" />
          <path d="M 0,-10 L 6,-2 L 0,12 L -6,-2 Z" fill={color + '20'} stroke={color + 'aa'} strokeWidth="0.6" />
          <line x1="-11" y1="-2" x2="11" y2="-2" stroke={color + '88'} strokeWidth="0.6" />
        </motion.g>
        <motion.circle
          cx="0" cy="-2" r="1.5" fill="#ecfeff"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <text x="0" y="26" textAnchor="middle" dominantBaseline="middle" fill={color + 'cc'} fontSize="4.8" fontWeight="700" letterSpacing="1.3">CRISTAL</text>
      </ShieldFrame>
      <EmblemFooter color={color} />
    </motion.div>
  )
}

// ─── Éclair néon ──────────────────────────────────────────────────────────────

function EclairNeonEmblem() {
  const color = '#a78bfa'
  return (
    <motion.div
      initial={{ opacity: 0, y: -14, scale: 0.85 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.25, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
    >
      <motion.div
        animate={{ opacity: [0.3, 0.85, 0.3] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
        style={{ position: 'absolute', inset: -10, background: `radial-gradient(circle, ${color}55 0%, transparent 70%)`, filter: 'blur(9px)', pointerEvents: 'none' }}
      />
      <ShieldFrame color={color} gradientId="emblem-bolt-grad">
        <motion.path
          d="M 4,-18 L -8,2 L -1,2 L -5,18 L 8,-2 L 1,-2 Z"
          fill={color}
          stroke="#ede9fe"
          strokeWidth="0.6"
          strokeLinejoin="round"
          animate={{ opacity: [0.85, 1, 0.85] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
        />
        <text x="0" y="26" textAnchor="middle" dominantBaseline="middle" fill={color + 'cc'} fontSize="5" fontWeight="700" letterSpacing="1.4">VOLT</text>
      </ShieldFrame>
      <EmblemFooter color={color} />
    </motion.div>
  )
}

// ─── Rose cyberpunk ───────────────────────────────────────────────────────────

function RoseCyberpunkEmblem() {
  const color = '#ec4899'
  return (
    <motion.div
      initial={{ opacity: 0, y: -14, scale: 0.85 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.25, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
    >
      <motion.div
        animate={{ opacity: [0.4, 0.75, 0.4] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
        style={{ position: 'absolute', inset: -10, background: `radial-gradient(circle, ${color}48 0%, transparent 70%)`, filter: 'blur(10px)', pointerEvents: 'none' }}
      />
      <ShieldFrame color={color} gradientId="emblem-rose-grad">
        <g>
          {[0, 60, 120, 180, 240, 300].map(angle => (
            <path
              key={angle}
              d="M 0,0 L 6,-4 L 0,-12 L -6,-4 Z"
              fill={color + '33'}
              stroke={color}
              strokeWidth="0.8"
              transform={`rotate(${angle})`}
            />
          ))}
          <circle cx="0" cy="0" r="3.5" fill="#fbcfe8" stroke={color} strokeWidth="0.8" />
          <motion.circle
            cx="0" cy="0" r="6"
            fill="none"
            stroke={color + '66'}
            strokeWidth="0.5"
            strokeDasharray="2 2"
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
            style={{ transformOrigin: '0px 0px' }}
          />
        </g>
        <text x="0" y="26" textAnchor="middle" dominantBaseline="middle" fill={color + 'cc'} fontSize="5" fontWeight="700" letterSpacing="1.4">ROSE</text>
      </ShieldFrame>
      <EmblemFooter color={color} />
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
  flamme_dor: {
    id:          'flamme_dor',
    name:        "Flamme d'or",
    tier:        'legendary',
    description: "Un blason enflammé qui scintille en permanence. Démarque-toi au classement.",
    Component:   FlamedorEmblem,
  },
  cristal_de_glace: {
    id:          'cristal_de_glace',
    name:        'Cristal de glace',
    tier:        'epic',
    description: 'Un cristal rotatif aux reflets cyan, glacé et précis.',
    Component:   CristalDeGlaceEmblem,
  },
  eclair_neon: {
    id:          'eclair_neon',
    name:        'Éclair néon',
    tier:        'rare',
    description: 'Un éclair pulsant dans les tons violets, pour les joueurs rapides.',
    Component:   EclairNeonEmblem,
  },
  rose_cyberpunk: {
    id:          'rose_cyberpunk',
    name:        'Rose cyberpunk',
    tier:        'epic',
    description: 'Une rose géométrique rose néon avec halo tournant.',
    Component:   RoseCyberpunkEmblem,
  },
}

export function resolveEmblem(id: string | null | undefined): EmblemEntry {
  if (id && EMBLEM_REGISTRY[id]) return EMBLEM_REGISTRY[id]
  return EMBLEM_REGISTRY[DEFAULT_EMBLEM_ID]
}
