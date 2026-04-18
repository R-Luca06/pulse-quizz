import type { ReactNode } from 'react'
import { resolveBackground } from '../../constants/cosmetics/backgrounds'

interface Props {
  equippedId: string | null
  children:   ReactNode
  onClick?:   () => void
}

export default function BackgroundSlot({ equippedId, children, onClick }: Props) {
  const { Component } = resolveBackground(equippedId)
  return (
    <div
      className="relative overflow-hidden rounded-2xl"
      style={{
        background: 'radial-gradient(ellipse at 50% -10%, #241545 0%, #120d28 45%, #080614 100%)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {Component && (
        <div
          aria-hidden
          style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }}
        >
          <Component />
        </div>
      )}
      <div className="relative z-10">{children}</div>
      {onClick && (
        <button
          type="button"
          onClick={onClick}
          aria-label="Modifier le fond"
          className="absolute right-3 top-3 z-20 flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold text-white/70 backdrop-blur-sm transition-all hover:bg-neon-violet/20 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-neon-violet/50"
          style={{ background: 'rgba(12,8,26,0.75)', border: '1px solid rgba(255,255,255,0.12)' }}
        >
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
          Fond
        </button>
      )}
    </div>
  )
}
