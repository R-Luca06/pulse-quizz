import { resolveTitle, resolveTitleStyle } from '../../constants/cosmetics/titles'

interface Props {
  equippedId: string | null
  rank:       number | null
  onClick?:   () => void
}

export default function TitleSlot({ equippedId, rank, onClick }: Props) {
  const content = resolveTitle(equippedId, { rank })
  const style   = resolveTitleStyle(equippedId)
  if (!onClick) return style ? <span style={style}>{content}</span> : <>{content}</>
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Modifier le titre"
      className="group relative inline-block focus:outline-none"
      style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer' }}
    >
      <span className="transition-opacity group-hover:opacity-70" style={style}>{content}</span>
      <span
        aria-hidden
        className="pointer-events-none absolute -right-4 top-1/2 flex h-3.5 w-3.5 -translate-y-1/2 items-center justify-center rounded-full text-white/70 opacity-0 transition-opacity group-hover:opacity-100"
        style={{ background: 'rgba(12,8,26,0.95)', border: '1px solid rgba(196,181,253,0.35)' }}
      >
        <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
      </span>
    </button>
  )
}
