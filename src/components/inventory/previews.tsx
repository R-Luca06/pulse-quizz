import type { CSSProperties } from 'react'
import type { AchievementTier, CosmeticType } from '../../types/quiz'
import { getCosmetic } from '../../constants/cosmetics/registry'

// ─── Emblem (mini SVG shield) ────────────────────────────────────────────────

const EMBLEM_COLOR: Record<string, string> = {
  default_rank:     '#6b7280',
  flamme_dor:       '#fbbf24',
  cristal_de_glace: '#67e8f9',
  eclair_neon:      '#a78bfa',
  rose_cyberpunk:   '#ec4899',
}

const TIER_HEX: Record<AchievementTier, string> = {
  legendary: '#f59e0b',
  epic:      '#a78bfa',
  rare:      '#60a5fa',
  common:    '#6b7280',
}

export function MiniEmblem({ id, size = 44 }: { id: string | null; size?: number }) {
  const meta = getCosmetic('emblem', id)
  const color = EMBLEM_COLOR[meta.id] ?? TIER_HEX[meta.tier]
  const ratio = size / 44
  const height = Math.round(52 * ratio)

  let glyph
  if (meta.id === 'flamme_dor') {
    glyph = (
      <>
        <path d="M 0,-18 C -7,-9 -11,1 -8,9 C -5,16 5,16 8,9 C 11,1 7,-9 0,-18 Z" fill={color} fillOpacity="0.85" />
        <path d="M 0,-8 C -3,-3 -4,3 -2,7 C 0,9 3,8 3,3 C 3,-1 1,-5 0,-8 Z" fill="#fde68a" />
      </>
    )
  } else if (meta.id === 'cristal_de_glace') {
    glyph = (
      <>
        <path d="M 0,-16 L 11,-2 L 0,18 L -11,-2 Z" fill="none" stroke={color} strokeWidth="1.4" />
        <path d="M 0,-10 L 6,-2 L 0,12 L -6,-2 Z" fill={color + '30'} stroke={color + 'aa'} strokeWidth="0.6" />
      </>
    )
  } else if (meta.id === 'eclair_neon') {
    glyph = <path d="M 4,-18 L -8,2 L -1,2 L -5,18 L 8,-2 L 1,-2 Z" fill={color} stroke="#ede9fe" strokeWidth="0.6" />
  } else if (meta.id === 'rose_cyberpunk') {
    glyph = (
      <g>
        {[0, 60, 120, 180, 240, 300].map(a => (
          <path key={a} d="M 0,0 L 6,-4 L 0,-12 L -6,-4 Z" fill={color + '33'} stroke={color} strokeWidth="0.8" transform={`rotate(${a})`} />
        ))}
        <circle cx="0" cy="0" r="3.5" fill="#fbcfe8" stroke={color} strokeWidth="0.8" />
      </g>
    )
  } else {
    glyph = (
      <>
        <text x="0" y="-2" textAnchor="middle" fill={color} fontSize="13" fontWeight="900">#?</text>
        <text x="0" y="14" textAnchor="middle" fill={color + 'aa'} fontSize="6" fontWeight="700" letterSpacing="1">RANG</text>
      </>
    )
  }

  return (
    <svg width={size} height={height} viewBox="-32 -37 64 74" aria-hidden>
      <path d="M -24,-33 L 24,-33 L 24,4 C 24,16 9,30 0,36 C -9,30 -24,16 -24,4 Z" fill="rgba(14,10,28,0.95)" stroke={color} strokeWidth="1.5" />
      {glyph}
    </svg>
  )
}

// ─── Title (mini nameplate) ──────────────────────────────────────────────────

export function MiniTitle({ id, compact = false }: { id: string | null; compact?: boolean }) {
  const meta = getCosmetic('title', id)
  const label = meta.name === 'Titre de rang' ? 'RANG' : meta.name.toUpperCase()
  return (
    <span
      style={{
        padding:        compact ? '3px 10px' : '4px 12px',
        background:     'linear-gradient(180deg, rgba(255,255,255,0.065), rgba(255,255,255,0.03))',
        border:         '1px solid rgba(255,255,255,0.13)',
        borderRadius:   2,
        fontSize:       compact ? 8 : 9,
        fontWeight:     700,
        letterSpacing:  '0.16em',
        color:          'rgba(255,255,255,0.6)',
        whiteSpace:     'nowrap',
      }}
    >
      {label}
    </span>
  )
}

// ─── Card design (mini rectangle) ────────────────────────────────────────────

const CARD_STYLE: Record<string, CSSProperties> = {
  default: {
    background:   'linear-gradient(180deg, rgba(20,14,38,0.75), rgba(10,7,20,0.92))',
    borderColor:  'rgba(255,255,255,0.08)',
  },
  holographique: {
    background:   'linear-gradient(135deg, rgba(236,72,153,0.22), rgba(6,182,212,0.22), rgba(234,179,8,0.2))',
    borderColor:  'rgba(236,72,153,0.4)',
  },
  parchemin_dor: {
    background:   'linear-gradient(135deg, rgba(251,191,36,0.25), rgba(146,64,14,0.25))',
    borderColor:  'rgba(251,191,36,0.5)',
  },
  givre: {
    background:   'linear-gradient(135deg, rgba(103,232,249,0.18), rgba(59,130,246,0.12))',
    borderColor:  'rgba(103,232,249,0.4)',
  },
  rune_arcane: {
    background:   'radial-gradient(circle at 30% 30%, rgba(167,139,250,0.3), rgba(10,10,15,0.9))',
    borderColor:  'rgba(167,139,250,0.45)',
  },
}

export function MiniCardDesign({ id, size = 'md' }: { id: string | null; size?: 'sm' | 'md' | 'lg' }) {
  const meta = getCosmetic('card_design', id)
  const style = CARD_STYLE[meta.id] ?? CARD_STYLE.default
  const dims =
    size === 'lg' ? { w: 72, h: 54 } :
    size === 'sm' ? { w: 46, h: 36 } :
                    { w: 54, h: 42 }
  return (
    <div
      style={{
        width:        dims.w,
        height:       dims.h,
        borderRadius: 6,
        border:       `1px solid ${style.borderColor ?? 'rgba(255,255,255,0.1)'}`,
        background:   style.background,
        position:     'relative',
        overflow:     'hidden',
      }}
      aria-hidden
    >
      <div
        style={{
          position:     'absolute',
          inset:        2,
          borderRadius: 4,
          border:       '1px dashed rgba(255,255,255,0.12)',
        }}
      />
    </div>
  )
}

// ─── Background (mini patch) ─────────────────────────────────────────────────

const BG_STYLE: Record<string, CSSProperties> = {
  default: {
    background: '#0a0a15',
  },
  aurore_violette: {
    background: 'radial-gradient(circle at 20% 30%, rgba(139,92,246,0.55), transparent 60%), radial-gradient(circle at 80% 70%, rgba(59,130,246,0.45), transparent 60%), #0a0a15',
  },
  constellation: {
    background: 'radial-gradient(circle at 25% 30%, #fff 1px, transparent 2px), radial-gradient(circle at 70% 60%, #fff 1px, transparent 2px), radial-gradient(circle at 45% 80%, #fff 1px, transparent 2px), radial-gradient(circle at 85% 25%, #fff 1px, transparent 2px), #0a0a15',
  },
  grille_neon: {
    background:
      'linear-gradient(rgba(139,92,246,0.35) 1px, transparent 1px) 0 0 / 10px 10px, linear-gradient(90deg, rgba(139,92,246,0.35) 1px, transparent 1px) 0 0 / 10px 10px, #060610',
  },
  nebuleuse_doree: {
    background:
      'radial-gradient(circle at 40% 50%, rgba(234,179,8,0.55), transparent 55%), radial-gradient(circle at 70% 30%, rgba(251,146,60,0.35), transparent 60%), #140d05',
  },
}

export function MiniBackground({ id, size = 'md' }: { id: string | null; size?: 'sm' | 'md' | 'lg' }) {
  const meta = getCosmetic('background', id)
  const style = BG_STYLE[meta.id] ?? BG_STYLE.default
  const dims =
    size === 'lg' ? { w: 132, h: 88 } :
    size === 'sm' ? { w: 48, h: 36 } :
                    { w: 58, h: 44 }
  return (
    <div
      style={{
        width:        dims.w,
        height:       dims.h,
        borderRadius: 6,
        border:       '1px solid #1E1E2E',
        position:     'relative',
        overflow:     'hidden',
        ...style,
      }}
      aria-hidden
    />
  )
}

// ─── Screen animation (mini particle patch) ──────────────────────────────────

const ANIM_COLOR: Record<string, { dot: string; glow: string }> = {
  pluie_pulses:      { dot: '#67e8f9', glow: '#67e8f9' },
  etincelles_dorees: { dot: '#fde68a', glow: '#fbbf24' },
  particules_violet: { dot: '#c4b5fd', glow: '#8b5cf6' },
  eclairs:           { dot: '#fbbf24', glow: '#fbbf24' },
  none:              { dot: 'rgba(255,255,255,0.2)', glow: 'rgba(255,255,255,0.1)' },
}

const PARTICLE_POS: { left: string; delay: string }[] = [
  { left: '10%', delay: '0s' },
  { left: '30%', delay: '.6s' },
  { left: '50%', delay: '1.2s' },
  { left: '70%', delay: '.3s' },
  { left: '88%', delay: '1.5s' },
]

export function MiniScreenAnim({ id, size = 'md' }: { id: string | null; size?: 'sm' | 'md' | 'lg' }) {
  const meta = getCosmetic('screen_animation', id)
  const colors = ANIM_COLOR[meta.id] ?? ANIM_COLOR.none
  const dims =
    size === 'lg' ? { w: 132, h: 88 } :
    size === 'sm' ? { w: 48, h: 36 } :
                    { w: 58, h: 44 }
  const isDefault = meta.isDefault

  return (
    <div
      style={{
        width:        dims.w,
        height:       dims.h,
        borderRadius: 6,
        border:       '1px solid #1E1E2E',
        background:   'rgba(10,10,15,0.9)',
        position:     'relative',
        overflow:     'hidden',
      }}
      aria-hidden
    >
      {!isDefault && PARTICLE_POS.map((p, i) => (
        <span
          key={i}
          style={{
            position:     'absolute',
            left:         p.left,
            width:        3,
            height:       3,
            borderRadius: '50%',
            background:   `radial-gradient(circle, ${colors.dot}, transparent 70%)`,
            boxShadow:    `0 0 4px ${colors.glow}`,
            animation:    `invmini-fall 2.4s linear infinite`,
            animationDelay: p.delay,
          }}
        />
      ))}
      <style>{`@keyframes invmini-fall { from { top: -6px; opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } to { top: 100%; opacity: 0; } }`}</style>
    </div>
  )
}

// ─── Generic dispatch ────────────────────────────────────────────────────────

export function CosmeticPreview({ type, id, size = 'md' }: { type: CosmeticType; id: string | null; size?: 'sm' | 'md' | 'lg' }) {
  switch (type) {
    case 'emblem':
      return <MiniEmblem id={id} size={size === 'lg' ? 60 : size === 'sm' ? 36 : 44} />
    case 'title':
      return <MiniTitle id={id} compact={size === 'sm'} />
    case 'card_design':
      return <MiniCardDesign id={id} size={size} />
    case 'background':
      return <MiniBackground id={id} size={size} />
    case 'screen_animation':
      return <MiniScreenAnim id={id} size={size} />
  }
}
