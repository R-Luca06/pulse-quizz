import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../contexts/ToastContext'
import { fetchShopItems } from '../../services/shop'
import { getUserInventory } from '../../services/inventory'
import type { AchievementTier, InventoryItem, PurchaseResult, ShopItem } from '../../types/quiz'
import ShopHero from './ShopHero'
import FeaturedSection from './FeaturedSection'
import ShopFilters, { type RarityFilter, type StateFilter, type SortFilter } from './ShopFilters'
import ShopTypeTabs, { type TypeFilter } from './ShopTypeTabs'
import ShopGrid from './ShopGrid'
import ShopItemModal from './ShopItemModal'

const TIER_ORDER: Record<AchievementTier, number> = { legendary: 0, epic: 1, rare: 2, common: 3 }

interface Props {
  onBack:             () => void
  onGoToInventory?:   () => void
}

export default function ShopPage({ onBack, onGoToInventory }: Props) {
  const { user, pulsesBalance, ownedItems } = useAuth()
  const toast = useToast()

  const [items, setItems]     = useState<ShopItem[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [ownedFromFetch, setOwnedFromFetch] = useState<InventoryItem[] | null>(null)
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null)
  const [locallyOwned, setLocallyOwned] = useState<Set<string>>(new Set())

  const [typeFilter,   setTypeFilter]   = useState<TypeFilter>('all')
  const [rarityFilter, setRarityFilter] = useState<RarityFilter>('all')
  const [stateFilter,  setStateFilter]  = useState<StateFilter>('all')
  const [sortFilter,   setSortFilter]   = useState<SortFilter>('featured')

  // ── Fetch shop items + inventory in parallel ──
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    const invPromise = user
      ? getUserInventory(user.id).catch(() => [] as InventoryItem[])
      : Promise.resolve([] as InventoryItem[])
    Promise.all([fetchShopItems(), invPromise])
      .then(([shop, inv]) => {
        if (cancelled) return
        setItems(shop)
        setOwnedFromFetch(inv)
      })
      .catch(err => {
        console.error(err)
        if (!cancelled) toast.error('Impossible de charger la boutique')
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [user, toast])

  // ── Owned set (prefer AuthContext for freshness, fallback to local fetch) ──
  const ownedSet = useMemo(() => {
    const src = ownedItems ?? ownedFromFetch ?? []
    const base = new Set(src.map(it => `${it.item_type}::${it.item_id}`))
    locallyOwned.forEach(k => base.add(k))
    return base
  }, [ownedItems, ownedFromFetch, locallyOwned])

  function handleOpenItem(item: ShopItem) {
    setSelectedItem(item)
  }

  function handlePurchased(result: PurchaseResult) {
    setLocallyOwned(prev => {
      const next = new Set(prev)
      next.add(`${result.item_type}::${result.item_id}`)
      return next
    })
  }

  const safeItems = useMemo(() => items ?? [], [items])

  // ── Counts by type (ignoring rarity/state) ──
  const typeCounts = useMemo(() => {
    const counts: Record<TypeFilter, number> = { all: 0, badge: 0, emblem: 0, title: 0, card_design: 0, background: 0, screen_animation: 0 }
    for (const it of safeItems) {
      counts.all++
      counts[it.item_type]++
    }
    return counts
  }, [safeItems])

  // Items narrowed by type — base for rarity/state counts
  const itemsByType = useMemo(
    () => typeFilter === 'all' ? safeItems : safeItems.filter(it => it.item_type === typeFilter),
    [safeItems, typeFilter],
  )

  const rarityCounts = useMemo(() => {
    const counts: Record<RarityFilter, number> = { all: 0, legendary: 0, epic: 0, rare: 0, common: 0 }
    for (const it of itemsByType) { counts.all++; counts[it.tier]++ }
    return counts
  }, [itemsByType])

  const stateCounts = useMemo(() => {
    const counts: Record<StateFilter, number> = { all: 0, affordable: 0, unaffordable: 0, owned: 0 }
    for (const it of itemsByType) {
      counts.all++
      const isOwned = ownedSet.has(`${it.item_type}::${it.item_id}`)
      if (isOwned) counts.owned++
      else if (pulsesBalance >= it.price) counts.affordable++
      else counts.unaffordable++
    }
    return counts
  }, [itemsByType, ownedSet, pulsesBalance])

  // ── Filter + sort ──
  const filtered = useMemo(() => {
    const list = itemsByType
      .filter(it => rarityFilter === 'all' || it.tier === rarityFilter)
      .filter(it => {
        if (stateFilter === 'all') return true
        const isOwned = ownedSet.has(`${it.item_type}::${it.item_id}`)
        if (stateFilter === 'owned')        return isOwned
        if (stateFilter === 'affordable')   return !isOwned && pulsesBalance >= it.price
        if (stateFilter === 'unaffordable') return !isOwned && pulsesBalance < it.price
        return true
      })

    return list.sort((a, b) => {
      switch (sortFilter) {
        case 'price_asc':  return a.price - b.price
        case 'price_desc': return b.price - a.price
        case 'tier':       return TIER_ORDER[a.tier] - TIER_ORDER[b.tier] || a.sort_order - b.sort_order
        case 'featured':
        default:
          if (a.featured !== b.featured) return a.featured ? -1 : 1
          if (a.is_new !== b.is_new)     return a.is_new ? -1 : 1
          return a.sort_order - b.sort_order
      }
    })
  }, [itemsByType, rarityFilter, stateFilter, sortFilter, ownedSet, pulsesBalance])

  const nbNew = useMemo(() => safeItems.filter(it => it.is_new).length, [safeItems])
  const featured = useMemo(() => safeItems.filter(it => it.featured), [safeItems])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="flex min-h-screen flex-col bg-game-bg"
    >
      {/* Topbar */}
      <div className="flex items-center border-b border-game-border px-4 py-2.5">
        <button
          onClick={onBack}
          className="flex w-20 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-white/50 transition-colors hover:bg-white/5 hover:text-white"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          Retour
        </button>
        <div className="flex flex-1 justify-center">
          <p className="text-sm text-white/40">Boutique</p>
        </div>
        <div className="w-20" />
      </div>

      {/* Hero + wallet */}
      <ShopHero total={safeItems.length} nbNew={nbNew} pulsesBalance={pulsesBalance} />

      {/* Featured */}
      <FeaturedSection items={featured} onOpenItem={handleOpenItem} />

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        <ShopFilters
          rarity={rarityFilter} setRarity={setRarityFilter}
          state={stateFilter}  setState={setStateFilter}
          sort={sortFilter}    setSort={setSortFilter}
          rarityCounts={rarityCounts}
          stateCounts={stateCounts}
        />

        <div className="flex flex-1 flex-col overflow-hidden">
          <ShopTypeTabs
            value={typeFilter}
            onChange={(v) => { setTypeFilter(v); setRarityFilter('all'); setStateFilter('all') }}
            counts={typeCounts}
          />

          {/* Mobile filters */}
          <div className="flex items-center gap-2 border-b border-game-border px-4 py-2 sm:hidden">
            <MobileFilterSelect<RarityFilter>
              label="Rareté"
              value={rarityFilter}
              options={[
                { key: 'all',       label: 'Tous' },
                { key: 'legendary', label: 'Légendaire' },
                { key: 'epic',      label: 'Épique' },
                { key: 'rare',      label: 'Rare' },
                { key: 'common',    label: 'Commun' },
              ]}
              counts={rarityCounts}
              onChange={setRarityFilter}
            />
            <MobileFilterSelect<StateFilter>
              label="État"
              value={stateFilter}
              options={[
                { key: 'all',          label: 'Tous' },
                { key: 'affordable',   label: 'Abordable' },
                { key: 'unaffordable', label: 'À économiser' },
                { key: 'owned',        label: 'Possédé' },
              ]}
              counts={stateCounts}
              onChange={setStateFilter}
            />
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex h-full min-h-[240px] items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-neon-violet border-t-transparent" />
              </div>
            ) : (
              <ShopGrid
                items={filtered}
                owned={ownedSet}
                balance={pulsesBalance}
                onOpenItem={handleOpenItem}
              />
            )}
          </div>
        </div>
      </div>

      <ShopItemModal
        item={selectedItem}
        owned={selectedItem ? ownedSet.has(`${selectedItem.item_type}::${selectedItem.item_id}`) : false}
        balance={pulsesBalance}
        onClose={() => setSelectedItem(null)}
        onPurchased={handlePurchased}
        onGoToInventory={onGoToInventory}
      />
    </motion.div>
  )
}

// ─── Mobile select (aligned with inventaire pattern) ────────────────────────

function MobileFilterSelect<T extends string>({
  label, value, options, counts, onChange,
}: {
  label:    string
  value:    T
  options:  { key: T; label: string }[]
  counts:   Record<T, number>
  onChange: (v: T) => void
}) {
  const isFiltered = value !== ('all' as T)
  return (
    <label className="relative">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={e => onChange(e.target.value as T)}
        className={[
          'appearance-none rounded-lg border bg-transparent px-2.5 py-1.5 pr-7 text-[11px] font-semibold transition-colors focus:outline-none',
          isFiltered
            ? 'border-neon-violet/30 bg-neon-violet/10 text-neon-violet'
            : 'border-white/10 bg-white/5 text-white/55 hover:bg-white/10',
        ].join(' ')}
      >
        {options.map(o => (
          <option key={o.key} value={o.key} className="bg-game-card text-white">
            {label} · {o.label} ({counts[o.key]})
          </option>
        ))}
      </select>
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-current">
        <polyline points="6 9 12 15 18 9"/>
      </svg>
    </label>
  )
}

