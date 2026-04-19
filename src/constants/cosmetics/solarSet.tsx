/**
 * Set Solaire Vol. 01 — Héliarque
 * ─────────────────────────────────────────────────────────
 * Components for the 6 cosmetic pieces + the 3 badge glyphs.
 *
 * The 3 badges (`EruptionGlyph`, `CouronneSolaireGlyph`, `PhenixGlyph`)
 * return only their internal <svg>. The legendary hex shell is provided
 * by `MiniBadge` (cf. components/shared/MiniBadge.tsx).
 */

/* eslint-disable react-refresh/only-export-components */
import React from 'react'

// ═══════════════════════════════════════════════════════════
// Badge 1 — Éruption (inner glyph only)
// ═══════════════════════════════════════════════════════════

export function EruptionGlyph({ size = 40 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="-24 -24 48 48"
      className="animate-[ember-flicker_2.2s_ease-in-out_infinite]"
    >
      <defs>
        <radialGradient id="erupt-core" cx="50%" cy="65%" r="60%">
          <stop offset="0%"   stopColor="#fef3c7" />
          <stop offset="40%"  stopColor="#fbbf24" />
          <stop offset="80%"  stopColor="#ea580c" />
          <stop offset="100%" stopColor="#7c2d12" />
        </radialGradient>
      </defs>
      <path
        d="M 0,-18 C -8,-10 -12,-2 -10,7 C -8,14 -4,18 0,18 C 4,18 8,14 10,7 C 12,-2 8,-10 0,-18 Z"
        fill="url(#erupt-core)"
      />
      <path
        d="M 0,-8 C -4,-3 -5,3 -3,9 C -1,12 1,12 3,9 C 5,3 4,-3 0,-8 Z"
        fill="#fef9c3"
        opacity="0.85"
      />
      {[
        { x: -14, y: -10, d: 0 },
        { x: 13,  y: -8,  d: 0.8 },
        { x: -11, y: 8,   d: 1.4 },
      ].map((s, i) => (
        <circle
          key={i}
          cx={s.x}
          cy={s.y}
          r="1.2"
          fill="#fde68a"
          style={{ animation: `solar-pulse 1.5s ease-in-out ${s.d}s infinite` }}
        />
      ))}
    </svg>
  )
}

// ═══════════════════════════════════════════════════════════
// Badge 2 — Couronne Solaire (inner glyph only)
// ═══════════════════════════════════════════════════════════

export function CouronneSolaireGlyph({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="-24 -24 48 48">
      <defs>
        <radialGradient id="crown-sun" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#fef9c3" />
          <stop offset="60%"  stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#d97706" />
        </radialGradient>
      </defs>
      <g
        className="animate-[solar-spin-slow_22s_linear_infinite]"
        style={{ transformOrigin: '0px 0px' }}
      >
        {Array.from({ length: 12 }).map((_, i) => (
          <rect
            key={i}
            x="-1"
            y="-18"
            width="2"
            height="6"
            rx="1"
            fill="#fbbf24"
            opacity="0.85"
            transform={`rotate(${i * 30})`}
          />
        ))}
      </g>
      <circle
        cx="0"
        cy="0"
        r="8"
        fill="url(#crown-sun)"
        className="origin-center animate-[solar-pulse_2.5s_ease-in-out_infinite]"
      />
      <circle cx="0" cy="0" r="3.5" fill="#fef9c3" opacity="0.6" />
    </svg>
  )
}

// ═══════════════════════════════════════════════════════════
// Badge 3 — Phénix (inner glyph only)
// ═══════════════════════════════════════════════════════════

export function PhenixGlyph({ size = 40 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="-24 -24 48 48"
      className="animate-[phoenix-float_3.5s_ease-in-out_infinite]"
    >
      <defs>
        <linearGradient id="phenix-body" x1="0" y1="-18" x2="0" y2="18">
          <stop offset="0%"   stopColor="#fcd34d" />
          <stop offset="50%"  stopColor="#ea580c" />
          <stop offset="100%" stopColor="#7c2d12" />
        </linearGradient>
      </defs>
      {[
        { x: -8, y: 10, d: 0,   s: 1.4 },
        { x: 0,  y: 14, d: 0.4, s: 1.8 },
        { x: 8,  y: 10, d: 0.8, s: 1.4 },
      ].map((e, i) => (
        <circle
          key={i}
          cx={e.x}
          cy={e.y}
          r={e.s}
          fill="#fbbf24"
          style={{
            animation: `solar-pulse 1.3s ease-in-out ${e.d}s infinite`,
            filter: 'drop-shadow(0 0 4px #f59e0b)',
          }}
        />
      ))}
      <path d="M -18,-2 C -14,-10 -6,-12 -3,-4 L -3,2 Z" fill="url(#phenix-body)" />
      <path d="M 18,-2 C 14,-10 6,-12 3,-4 L 3,2 Z"      fill="url(#phenix-body)" />
      <ellipse cx="0" cy="0" rx="3.5" ry="8" fill="url(#phenix-body)" />
      <circle  cx="0" cy="-9" r="3"    fill="#fcd34d" />
      <path    d="M -1,-9 L -3,-11 L 0,-10 Z" fill="#7c2d12" />
      <circle  cx="1" cy="-9.5" r="0.6" fill="#431407" />
      <path    d="M 0,-12 L -2,-15 L 0,-13 L 2,-15 L 0,-12 Z" fill="#fbbf24" />
    </svg>
  )
}

// ═══════════════════════════════════════════════════════════
// Emblem — Héliarque (shield)
// ═══════════════════════════════════════════════════════════

export function HeliarqueEmblem({ size = 64 }: { size?: number }) {
  const color = '#f59e0b'
  const width = size
  // Match DefaultRankEmblem ratio (64 → 74) so heliarque fits the same footprint as other emblems
  const height = Math.round(size * (74 / 64))
  const glowInset = Math.round(size * -0.13)
  const glowBlur  = Math.max(6, Math.round(size * 0.13))

  return (
    <div className="relative flex flex-col items-center">
      <div
        className="pointer-events-none absolute animate-[solar-pulse_2.4s_ease-in-out_infinite]"
        style={{
          inset: glowInset,
          background: `radial-gradient(circle, ${color}55 0%, transparent 70%)`,
          filter: `blur(${glowBlur}px)`,
        }}
      />
      <svg width={width} height={height} viewBox="-32 -37 64 74" fill="none">
        <defs>
          <linearGradient id="shield-solar" x1="0" y1="-37" x2="0" y2="37">
            <stop offset="0%"   stopColor="#78350f" stopOpacity="0.45" />
            <stop offset="55%"  stopColor="#0e0a1c" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#070411" />
          </linearGradient>
          <radialGradient id="shield-sun" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#fef9c3" />
            <stop offset="55%"  stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#d97706" />
          </radialGradient>
        </defs>
        <path
          d="M -24,-33 L 24,-33 L 24,4 C 24,16 9,30 0,36 C -9,30 -24,16 -24,4 Z"
          fill="url(#shield-solar)"
          stroke={color}
          strokeWidth="1.5"
        />
        <path
          d="M -19,-28 L 19,-28 L 19,2 C 19,12 7,24 0,29 C -7,24 -19,12 -19,2 Z"
          fill="none"
          stroke={`${color}55`}
          strokeWidth="0.8"
        />
        <circle cx="-24" cy="-33" r="2.5" fill={`${color}80`} />
        <circle cx="24"  cy="-33" r="2.5" fill={`${color}80`} />
        <g
          className="animate-[solar-spin-slow_24s_linear_infinite]"
          style={{ transformOrigin: '0px 0px' }}
        >
          {Array.from({ length: 12 }).map((_, i) => (
            <rect
              key={i}
              x="-0.8"
              y="-15"
              width="1.6"
              height="5"
              rx="0.8"
              fill="#fbbf24"
              opacity="0.9"
              transform={`rotate(${i * 30})`}
            />
          ))}
        </g>
        <circle
          cx="0"
          cy="0"
          r="7"
          fill="url(#shield-sun)"
          className="origin-center animate-[solar-pulse_2.6s_ease-in-out_infinite]"
        />
        <circle cx="0" cy="0" r="3" fill="#fef9c3" opacity="0.55" />
      </svg>
      <div className="flex gap-[3px]" style={{ marginTop: -2 }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: 3,
              height: 3,
              borderRadius: '50%',
              background: `${color}60`,
              border: `1px solid ${color}80`,
            }}
          />
        ))}
      </div>
      <div style={{ width: 1.5, height: 8, background: `${color}40` }} />
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// Title — Héliarque (pure styled text, NO container)
// ═══════════════════════════════════════════════════════════

export const HELIARQUE_TITLE_STYLE: React.CSSProperties = {
  background:
    'linear-gradient(135deg, #fef3c7 0%, #fbbf24 50%, #ea580c 100%)',
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  color: 'transparent',
  fontWeight: 700,
  letterSpacing: '2px',
  textTransform: 'uppercase',
  filter: 'drop-shadow(0 0 6px rgba(251,191,36,0.35))',
}

// ═══════════════════════════════════════════════════════════
// Card design — Or en Fusion
// Wraps username + title together (static gold border,
// partial shine sweep across the card, not around it).
// ═══════════════════════════════════════════════════════════

interface OrEnFusionCardProps {
  /** Content displayed inside the card (typically username + title stack). */
  children: React.ReactNode
  /** Optional fixed width in px. */
  width?: number
}

export function OrEnFusionCard({ children, width }: OrEnFusionCardProps) {
  return (
    <div
      className="relative inline-block rounded-[6px]"
      style={{ width, padding: 2 }}
    >
      {/* Static gold border (masked) */}
      <span
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          inset: 0,
          borderRadius: 6,
          padding: 1,
          background:
            'linear-gradient(135deg, #fbbf24 0%, #d97706 50%, #fbbf24 100%)',
          WebkitMask:
            'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
          WebkitMaskComposite: 'xor',
          mask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
          maskComposite: 'exclude',
        }}
      />
      {/* Corner ornaments */}
      {([
        [-2, 'auto', 'auto', -2, 0],
        [-2, -2, 'auto', 'auto', 90],
        ['auto', -2, -2, 'auto', 180],
        ['auto', 'auto', -2, -2, 270],
      ] as const).map((c, i) => (
        <svg
          key={i}
          width="8"
          height="8"
          viewBox="0 0 22 22"
          className="pointer-events-none absolute z-[3]"
          style={{
            top: c[0] as number | string,
            right: c[1] as number | string,
            bottom: c[2] as number | string,
            left: c[3] as number | string,
            transform: `rotate(${c[4]}deg)`,
          }}
        >
          <path d="M 2,2 L 8,2 L 8,3.2 L 3.2,3.2 L 3.2,8 L 2,8 Z" fill="#fbbf24" />
          <circle cx="4.5" cy="4.5" r="1" fill="#fde68a" />
        </svg>
      ))}
      {/* Inner panel (no extra padding — hugs the children like the other card designs) */}
      <span
        className="relative block overflow-hidden rounded-[4px]"
        style={{
          background:
            'linear-gradient(135deg, rgba(251,191,36,0.14) 0%, rgba(67,20,7,0.45) 100%), rgba(10,7,20,0.72)',
        }}
      >
        <span className="relative z-[2] block">
          {children}
        </span>
        {/* Partial shine that SWEEPS across the card (not a revolving border) */}
        <span
          aria-hidden
          className="pointer-events-none absolute animate-[card-shine-sweep_4.5s_ease-in-out_infinite]"
          style={{
            top: 0,
            bottom: 0,
            left: 0,
            width: '40%',
            zIndex: 1,
            background:
              'linear-gradient(110deg, transparent 0%, rgba(254,243,199,0.35) 45%, rgba(251,191,36,0.15) 55%, transparent 100%)',
            filter: 'blur(2px)',
          }}
        />
      </span>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// Background — Horizon Incandescent (full-screen bg)
// ═══════════════════════════════════════════════════════════

const HORIZON_PARTICLES = Array.from({ length: 18 }, (_, i) => {
  const seed = (i + 1) * 29
  return {
    left: (seed * 13) % 100,
    delay: ((seed * 7) % 50) / 10,
    duration: 7 + ((seed * 3) % 40) / 10,
    drift: -10 + ((seed * 5) % 20),
    size: 1.3 + ((seed * 5) % 14) / 10,
  }
})

export function HorizonIncandescentBg() {
  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{
        background:
          'radial-gradient(ellipse at 50% 110%, rgba(234,88,12,0.35) 0%, rgba(245,158,11,0.12) 25%, rgba(6,4,14,0.95) 65%)',
      }}
    >
      <div
        className="absolute left-0 right-0 bottom-0 animate-[horizon-pulse_5s_ease-in-out_infinite]"
        style={{
          height: '50%',
          background:
            'linear-gradient(0deg, rgba(245,158,11,0.22) 0%, rgba(234,88,12,0.12) 35%, transparent 75%)',
          transformOrigin: 'center bottom',
        }}
      />
      <div
        className="absolute animate-[solar-pulse_4s_ease-in-out_infinite]"
        style={{
          left: '50%',
          bottom: '28%',
          transform: 'translateX(-50%)',
          width: 180,
          height: 180,
          background:
            'radial-gradient(circle, rgba(251,191,36,0.55) 0%, rgba(245,158,11,0.18) 35%, transparent 65%)',
          filter: 'blur(12px)',
        }}
      />
      <div
        className="absolute inset-0 animate-[heat-shimmer_3s_ease-in-out_infinite]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 8px, rgba(251,191,36,0.03) 8px, rgba(251,191,36,0.03) 10px)',
        }}
      />
      {HORIZON_PARTICLES.map((p, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${p.left}%`,
            bottom: '-4px',
            width: p.size,
            height: p.size,
            background: '#fbbf24',
            boxShadow: '0 0 5px rgba(245,158,11,0.8)',
            animation: `ember-rise ${p.duration}s linear ${p.delay}s infinite`,
            // @ts-expect-error - CSS custom property
            '--ember-drift': `${p.drift}px`,
          }}
        />
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// Screen animation — Braises Ascendantes (overlay, pointer-events:none)
// ═══════════════════════════════════════════════════════════

const BRAISES_EMBERS = Array.from({ length: 28 }, (_, i) => {
  const seed = (i + 1) * 37
  return {
    left: (seed * 11) % 100,
    delay: ((seed * 5) % 60) / 10,
    duration: 4.5 + ((seed * 3) % 30) / 10,
    drift: -18 + ((seed * 7) % 36),
    size: 3 + ((seed * 5) % 30) / 10,
  }
})

export function BraisesAscendantesAnim() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {BRAISES_EMBERS.map((e, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${e.left}%`,
            bottom: '-10px',
            width: e.size,
            height: e.size,
            background: '#fef3c7',
            boxShadow:
              '0 0 10px rgba(254,243,199,1), 0 0 22px rgba(251,191,36,0.9), 0 0 40px rgba(245,158,11,0.6), 0 0 60px rgba(234,88,12,0.35)',
            animation: `ember-rise ${e.duration}s linear ${e.delay}s infinite`,
            // @ts-expect-error - CSS custom property
            '--ember-drift': `${e.drift}px`,
          }}
        />
      ))}
    </div>
  )
}
