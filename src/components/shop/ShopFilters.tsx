import type { AchievementTier } from '../../types/quiz'

export type RarityFilter = 'all' | AchievementTier
export type StateFilter  = 'all' | 'affordable' | 'unaffordable' | 'owned'
export type SortFilter   = 'featured' | 'price_asc' | 'price_desc' | 'tier'

const RARITY_FILTERS: { key: RarityFilter; label: string }[] = [
  { key: 'all',       label: 'Tous' },
  { key: 'legendary', label: 'Légendaire' },
  { key: 'epic',      label: 'Épique' },
  { key: 'rare',      label: 'Rare' },
  { key: 'common',    label: 'Commun' },
]

const STATE_FILTERS: { key: StateFilter; label: string }[] = [
  { key: 'all',          label: 'Tous' },
  { key: 'affordable',   label: 'Abordable' },
  { key: 'unaffordable', label: 'À économiser' },
  { key: 'owned',        label: 'Possédé' },
]

const SORT_FILTERS: { key: SortFilter; label: string }[] = [
  { key: 'featured',   label: 'Nouveautés' },
  { key: 'price_asc',  label: 'Prix ↑' },
  { key: 'price_desc', label: 'Prix ↓' },
  { key: 'tier',       label: 'Rareté' },
]

interface Props {
  rarity:      RarityFilter
  setRarity:   (r: RarityFilter) => void
  state:       StateFilter
  setState:    (s: StateFilter) => void
  sort:        SortFilter
  setSort:     (s: SortFilter) => void
  rarityCounts: Record<RarityFilter, number>
  stateCounts:  Record<StateFilter,  number>
}

export default function ShopFilters({
  rarity, setRarity, state, setState, sort, setSort, rarityCounts, stateCounts,
}: Props) {
  return (
    <aside className="hidden w-44 shrink-0 flex-col gap-0.5 border-r border-game-border p-3 sm:flex">
      <SectionHeading label="Rareté" />
      {RARITY_FILTERS.map(f => (
        <SidebarButton
          key={f.key}
          label={f.label}
          count={rarityCounts[f.key]}
          active={rarity === f.key}
          onClick={() => setRarity(f.key)}
        />
      ))}

      <div className="mx-2 my-2 h-px bg-game-border/70" />

      <SectionHeading label="État" />
      {STATE_FILTERS.map(f => (
        <SidebarButton
          key={f.key}
          label={f.label}
          count={stateCounts[f.key]}
          active={state === f.key}
          onClick={() => setState(f.key)}
        />
      ))}

      <div className="mx-2 my-2 h-px bg-game-border/70" />

      <SectionHeading label="Tri" />
      {SORT_FILTERS.map(f => (
        <SidebarButton
          key={f.key}
          label={f.label}
          active={sort === f.key}
          onClick={() => setSort(f.key)}
        />
      ))}
    </aside>
  )
}

function SectionHeading({ label }: { label: string }) {
  return <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-white/20">{label}</p>
}

function SidebarButton({ label, count, active, onClick }: { label: string; count?: number; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'flex items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs font-medium transition-colors',
        active ? 'bg-neon-violet/10 text-neon-violet' : 'text-white/35 hover:bg-white/5 hover:text-white/60',
      ].join(' ')}
    >
      <span>{label}</span>
      {count !== undefined && (
        <span className={['tabular-nums text-[10px]', active ? 'text-neon-violet/70' : 'text-white/20'].join(' ')}>
          {count}
        </span>
      )}
    </button>
  )
}
