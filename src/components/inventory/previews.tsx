import type { CSSProperties } from 'react'
import type { AchievementTier, CosmeticType } from '../../types/quiz'
import { getCosmetic } from '../../constants/cosmetics/registry'

// ─── Emblem (mini SVG shield) ────────────────────────────────────────────────

const EMBLEM_COLOR: Record<string, string> = {
  default_rank: '#6b7280',
  heliarque:    '#f59e0b',
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
  if (meta.id === 'heliarque') {
    glyph = (
      <g>
        {Array.from({ length: 12 }).map((_, i) => (
          <rect key={i} x="-0.8" y="-15" width="1.6" height="5" rx="0.8" fill="#fbbf24" opacity="0.9" transform={`rotate(${i * 30})`} />
        ))}
        <circle cx="0" cy="0" r="7" fill="#fbbf24" />
        <circle cx="0" cy="0" r="3" fill="#fef9c3" opacity="0.7" />
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
  or_en_fusion: {
    background:   'linear-gradient(135deg, rgba(251,191,36,0.35), rgba(234,88,12,0.25))',
    borderColor:  'rgba(251,191,36,0.6)',
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
  horizon_incandescent: {
    background:
      'radial-gradient(ellipse at 50% 110%, rgba(234,88,12,0.6) 0%, rgba(245,158,11,0.25) 35%, rgba(6,4,14,0.95) 75%), #06040e',
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
  braises_ascendantes: { dot: '#fef3c7', glow: '#ea580c' },
  none:                { dot: 'rgba(255,255,255,0.2)', glow: 'rgba(255,255,255,0.1)' },
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
