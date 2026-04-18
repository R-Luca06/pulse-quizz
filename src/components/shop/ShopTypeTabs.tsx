import type { ItemType } from '../../types/quiz'
import { BadgeIcon, ShieldIcon, TitleIcon, CardIcon, BgIcon, SparklesIcon, AvatarIcon } from './icons'

export type TypeFilter = 'all' | ItemType

const TABS: { key: TypeFilter; label: string; icon: React.ReactNode }[] = [
  { key: 'all',              label: 'Tous',       icon: null },
  { key: 'badge',            label: 'Badges',     icon: <BadgeIcon /> },
  { key: 'emblem',           label: 'Blasons',    icon: <ShieldIcon /> },
  { key: 'title',            label: 'Titres',     icon: <TitleIcon /> },
  { key: 'card_design',      label: 'Cartes',     icon: <CardIcon /> },
  { key: 'background',       label: 'Fonds',      icon: <BgIcon /> },
  { key: 'screen_animation', label: 'Animations', icon: <SparklesIcon /> },
]

interface Props {
  value:  TypeFilter
  onChange: (v: TypeFilter) => void
  counts: Record<TypeFilter, number>
}

export default function ShopTypeTabs({ value, onChange, counts }: Props) {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto border-b border-game-border px-4 py-2.5">
      {TABS.map(tab => (
        <TabButton
          key={tab.key}
          label={tab.label}
          icon={tab.icon}
          count={counts[tab.key]}
          active={value === tab.key}
          onClick={() => onChange(tab.key)}
        />
      ))}

      {/* Avatars — disabled placeholder */}
      <button
        type="button"
        disabled
        title="Bientôt disponible"
        className="flex shrink-0 cursor-not-allowed items-center gap-1.5 rounded-full border border-transparent bg-white/[0.03] px-3 py-1.5 text-[11px] font-semibold text-white/40 opacity-45 focus:outline-none"
      >
        <AvatarIcon />
        Avatars
        <span className="rounded-full bg-white/[0.04] px-1.5 py-[1px] text-[8px] uppercase tracking-widest text-white/30">
          Bientôt
        </span>
      </button>
    </div>
  )
}

function TabButton({
  label, icon, count, active, onClick,
}: { label: string; icon: React.ReactNode; count: number; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-colors focus:outline-none',
        active
          ? 'border-neon-violet/35 bg-neon-violet/[0.12] text-neon-violet'
          : 'border-transparent bg-white/[0.03] text-white/40 hover:bg-white/[0.06] hover:text-white/70',
      ].join(' ')}
    >
      {icon}
      {label}
      <span
        className={[
          'rounded-full px-1.5 py-[1px] text-[10px] tabular-nums',
          active ? 'bg-neon-violet/20 text-neon-violet/90' : 'bg-white/[0.06] text-white/45',
        ].join(' ')}
      >
        {count}
      </span>
    </button>
  )
}
