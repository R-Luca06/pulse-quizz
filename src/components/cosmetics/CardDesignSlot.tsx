import type { ReactNode } from 'react'
import { resolveCardDesign } from '../../constants/cosmetics/cardDesigns'

interface Props {
  equippedId: string | null
  children:   ReactNode
  onClick?:   () => void
}

export default function CardDesignSlot({ equippedId, children, onClick }: Props) {
  const { Component } = resolveCardDesign(equippedId)
  if (!onClick) return <Component>{children}</Component>
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <Component>{children}</Component>
      <button
        type="button"
        onClick={onClick}
        aria-label="Modifier la carte"
        className="absolute -right-2 -top-2 z-10 flex h-5 w-5 items-center justify-center rounded-full text-white/70 transition-all hover:bg-neon-violet/20 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-neon-violet/50"
        style={{ background: 'rgba(12,8,26,0.95)', border: '1px solid rgba(196,181,253,0.45)' }}
      >
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
      </button>
    </div>
  )
}
