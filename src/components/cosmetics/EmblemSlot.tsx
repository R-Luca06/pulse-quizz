import { resolveEmblem } from '../../constants/cosmetics/emblems'

interface Props {
  equippedId: string | null
  rank:       number | null
  onClick?:   () => void
}

export default function EmblemSlot({ equippedId, rank, onClick }: Props) {
  const { Component } = resolveEmblem(equippedId)
  if (!onClick) return <Component rank={rank} />
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Modifier le blason"
      className="group relative inline-flex items-center justify-center rounded-lg p-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-neon-violet/50"
      style={{ background: 'transparent', border: 'none' }}
    >
      <Component rank={rank} />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-lg opacity-0 transition-opacity group-hover:opacity-100"
        style={{ background: 'rgba(0,0,0,0.55)' }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(196,181,253,0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
      </span>
    </button>
  )
}
