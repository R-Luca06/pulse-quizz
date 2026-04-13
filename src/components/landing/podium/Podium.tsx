import type { ReactNode } from 'react'

interface Props {
  className?: string
  children?: ReactNode
}

// Surface sombre des plateaux (disque du haut) — gris foncé avec reflet doux
const DARK_TOP =
  'radial-gradient(ellipse at 50% 28%, #55555A 0%, #2E2E33 42%, #18181B 100%)'

// Bande chrome/argent : gradient vertical (base) + reflet horizontal (overlay)
const CHROME_BG = [
  'linear-gradient(to right, #4B5563 0%, #E5E7EB 24%, #F9FAFB 50%, #E5E7EB 76%, #4B5563 100%)',
  'linear-gradient(to bottom, #F3F4F6 0%, #9CA3AF 55%, #4B5563 100%)',
].join(', ')

// Bande dorée : gradient vertical (base) + reflet horizontal métallique
const GOLD_BG = [
  'linear-gradient(to right, rgba(120, 53, 15, 0.65) 0%, rgba(253, 224, 71, 0.22) 20%, rgba(255, 255, 255, 0.55) 50%, rgba(253, 224, 71, 0.22) 80%, rgba(120, 53, 15, 0.65) 100%)',
  'linear-gradient(to bottom, #FCD34D 0%, #F59E0B 35%, #D97706 80%, #B45309 100%)',
].join(', ')

export default function Podium({ className = '', children }: Props) {
  return (
    <div
      data-testid="podium"
      className={`relative flex flex-col items-center ${className}`}
    >
      {/* ─── Étage supérieur (étroit) ─── */}
      <Tier size="upper" />

      {/* ─── Étage inférieur (large) ─── */}
      <div className="-mt-2 sm:-mt-3">
        <Tier size="lower" />
      </div>

      {/* Ombre portée au sol */}
      <div
        aria-hidden="true"
        className="absolute left-1/2 h-5 w-[95%] -translate-x-1/2 rounded-[50%] bg-black/75 blur-lg"
        style={{ bottom: '-22px' }}
      />

      {children}
    </div>
  )
}

function Tier({ size }: { size: 'upper' | 'lower' }) {
  const widths =
    size === 'upper' ? 'w-64 sm:w-[22rem]' : 'w-[22rem] sm:w-[32rem]'

  // Hauteurs : étage supérieur un peu plus fin, inférieur un peu plus épais
  const top = size === 'upper' ? 'h-8 sm:h-10' : 'h-10 sm:h-12'
  const chrome = size === 'upper' ? 'h-2 sm:h-3' : 'h-3 sm:h-3.5'
  const gold = size === 'upper' ? 'h-10 sm:h-12' : 'h-12 sm:h-14'

  const topOverlap = size === 'upper' ? '-mt-4 sm:-mt-5' : '-mt-5 sm:-mt-6'

  return (
    <div className={`relative ${widths}`}>
      {/* Disque supérieur (surface foncée) */}
      <div
        className={`relative ${top} rounded-[50%]`}
        style={{
          background: DARK_TOP,
          border: '1px solid #101013',
          boxShadow:
            'inset 0 3px 8px rgba(255, 255, 255, 0.18), inset 0 -3px 8px rgba(0, 0, 0, 0.6), 0 2px 6px rgba(0, 0, 0, 0.45)',
        }}
      />

      {/* Bande chrome/argent (rim) */}
      <div
        className={`relative ${topOverlap} ${chrome}`}
        style={{
          background: CHROME_BG,
          backgroundBlendMode: 'overlay, normal',
          boxShadow:
            '0 1px 2px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.65)',
        }}
      />

      {/* Bande dorée (corps principal) */}
      <div
        className={`relative ${gold}`}
        style={{
          background: GOLD_BG,
          backgroundBlendMode: 'overlay, normal',
          boxShadow:
            'inset 0 -8px 14px rgba(120, 53, 15, 0.55), inset 0 2px 4px rgba(255, 255, 255, 0.25), 0 6px 14px rgba(0, 0, 0, 0.5)',
        }}
      />
    </div>
  )
}
