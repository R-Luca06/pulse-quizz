import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../contexts/ToastContext'
import { COSMETIC_TYPE_LABEL, DEFAULT_ID_BY_TYPE, getCosmetic } from '../../constants/cosmetics/registry'
import { ACHIEVEMENT_MAP } from '../../constants/achievements'
import { BADGE_TIER, TIER_GLOW_COLOR } from '../../constants/achievementColors'
import MiniBadge from '../shared/MiniBadge'
import ItemPicker from './ItemPicker'
import { CosmeticPreview } from './previews'
import { equipCosmetic } from '../../services/inventory'
import { updateFeaturedBadges } from '../../services/profile'
import type { AchievementId, AchievementTier, BadgeSource, CosmeticType, EquippedCosmetics, InventoryItem, ItemType } from '../../types/quiz'

// ─── Types & constantes ──────────────────────────────────────────────────────

type RarityFilter = 'all' | AchievementTier
type SourceFilter = 'all' | BadgeSource
type TypeFilter   = 'all' | ItemType

interface UnifiedItem {
  type:        ItemType
  id:          string
  name:        string
  tier:        AchievementTier
  source:      BadgeSource
  obtained_at: string | null      // null pour les défauts
  isDefault:   boolean
  owned:       boolean
}

const TIER_ORDER: Record<AchievementTier, number> = { legendary: 0, epic: 1, rare: 2, common: 3 }

const TIER_LABEL: Record<AchievementTier, string> = {
  common: 'Commun', rare: 'Rare', epic: 'Épique', legendary: 'Légendaire',
}

const TIER_DOT_COLOR: Record<AchievementTier, string> = {
  legendary: '#f59e0b',
  epic:      '#a78bfa',
  rare:      '#60a5fa',
  common:    'rgba(255,255,255,0.30)',
}

const SOURCE_STYLE: Record<BadgeSource, { bg: string; text: string; border: string; label: string }> = {
  achievement: { bg: 'rgba(34,197,94,.1)',  text: 'rgba(34,197,94,.85)',  border: 'rgba(34,197,94,.2)',  label: 'Succès' },
  shop:        { bg: 'rgba(234,179,8,.1)',  text: 'rgba(234,179,8,.85)',  border: 'rgba(234,179,8,.2)',  label: 'Boutique' },
  season:      { bg: 'rgba(236,72,153,.1)', text: 'rgba(236,72,153,.85)', border: 'rgba(236,72,153,.2)', label: 'Saison' },
  rank:        { bg: 'rgba(59,130,246,.1)', text: 'rgba(59,130,246,.85)', border: 'rgba(59,130,246,.2)', label: 'Classement' },
}

const RARITY_FILTERS: { key: RarityFilter; label: string }[] = [
  { key: 'all',       label: 'Tous' },
  { key: 'legendary', label: 'Légendaire' },
  { key: 'epic',      label: 'Épique' },
  { key: 'rare',      label: 'Rare' },
  { key: 'common',    label: 'Commun' },
]

const SOURCE_FILTERS: { key: SourceFilter; label: string }[] = [
  { key: 'all',         label: 'Tous' },
  { key: 'achievement', label: 'Succès' },
  { key: 'shop',        label: 'Boutique' },
  { key: 'season',      label: 'Saison' },
  { key: 'rank',        label: 'Classement' },
]

const COSMETIC_TYPES: CosmeticType[] = ['emblem', 'title', 'card_design', 'background', 'screen_animation']

const EQUIPPED_KEY: Record<CosmeticType, keyof EquippedCosmetics> = {
  emblem:           'emblem_id',
  background:       'background_id',
  title:            'title_id',
  card_design:      'card_design_id',
  screen_animation: 'screen_anim_id',
}

const TYPE_TABS: { key: TypeFilter; label: string; icon: React.ReactNode }[] = [
  { key: 'all',    label: 'Tous',       icon: null },
  { key: 'badge',  label: 'Badges',     icon: <BadgeIcon /> },
  { key: 'emblem', label: 'Blasons',    icon: <ShieldIcon /> },
  { key: 'title',  label: 'Titres',     icon: <TitleIcon /> },
  { key: 'card_design', label: 'Cartes',     icon: <CardIcon /> },
  { key: 'background',  label: 'Fonds',      icon: <BgIcon /> },
  { key: 'screen_animation', label: 'Animations', icon: <SparklesIcon /> },
]

// ─── Page principale ─────────────────────────────────────────────────────────

interface Props {
  hideBack?: boolean
  onBack?:   () => void
}

export default function InventoryPage({ hideBack = false, onBack }: Props) {
  const { user, profile, ownedItems, setLocalEquipped, setLocalFeaturedBadges } = useAuth()
  const toast = useToast()

  const [typeFilter,   setTypeFilter]   = useState<TypeFilter>('all')
  const [rarityFilter, setRarityFilter] = useState<RarityFilter>('all')
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all')
  const [picker,       setPicker]       = useState<{ type: ItemType; slotIndex?: 0 | 1 | 2 } | null>(null)
  const [busyId,       setBusyId]       = useState<string | null>(null)
  const [badgeReplace, setBadgeReplace] = useState<{ newBadgeId: AchievementId } | null>(null)

  // ── Direct equip/pin (sans ouvrir le picker) ──────────────────────────────
  async function handleQuickEquip(it: UnifiedItem) {
    if (!user || busyId) return
    const itemKey = `${it.type}-${it.id}`
    setBusyId(itemKey)
    try {
      if (it.type === 'badge') {
        const featured = (profile?.featured_badges ?? []) as AchievementId[]
        const idx = featured.indexOf(it.id as AchievementId)
        if (idx >= 0) {
          // Déjà épinglé → désépingler
          const next = featured.filter((_, i) => i !== idx)
          setLocalFeaturedBadges(next)
          await updateFeaturedBadges(user.id, next)
          toast.success('Badge retiré')
        } else if (featured.length < 3) {
          // Slot libre → épingler direct
          const next = [...featured, it.id as AchievementId]
          setLocalFeaturedBadges(next)
          await updateFeaturedBadges(user.id, next)
          toast.success('Badge épinglé')
        } else {
          // 3 badges déjà pinés → demander quel slot remplacer
          setBadgeReplace({ newBadgeId: it.id as AchievementId })
        }
      } else {
        const cosmeticType = it.type as CosmeticType
        const equippedKey  = EQUIPPED_KEY[cosmeticType]
        const currentId    = profile?.equipped[equippedKey] ?? null
        const isCurrent    = (currentId ?? DEFAULT_ID_BY_TYPE[cosmeticType]) === it.id
        if (isCurrent) {
          // Déjà équipé → revenir au défaut
          setLocalEquipped(cosmeticType, null)
          await equipCosmetic(user.id, cosmeticType, null)
          toast.success(`${COSMETIC_TYPE_LABEL[cosmeticType]} retiré${cosmeticType === 'card_design' ? 'e' : ''}`)
        } else {
          const next = it.isDefault ? null : it.id
          setLocalEquipped(cosmeticType, next)
          await equipCosmetic(user.id, cosmeticType, next)
          toast.success(`${COSMETIC_TYPE_LABEL[cosmeticType]} équipé${cosmeticType === 'card_design' ? 'e' : ''}`)
        }
      }
    } catch {
      toast.error("L'action n'a pas pu être sauvegardée")
    } finally {
      setBusyId(null)
    }
  }

  async function handleBadgeReplace(slotIndex: 0 | 1 | 2) {
    if (!user || !badgeReplace || !profile) return
    const next = [...profile.featured_badges] as AchievementId[]
    next[slotIndex] = badgeReplace.newBadgeId
    setBusyId(`badge-${badgeReplace.newBadgeId}`)
    setLocalFeaturedBadges(next)
    try {
      await updateFeaturedBadges(user.id, next)
      toast.success('Badge épinglé')
      setBadgeReplace(null)
    } catch {
      toast.error("L'action n'a pas pu être sauvegardée")
    } finally {
      setBusyId(null)
    }
  }

  // Construit la liste unifiée — défauts cosmétiques + items possédés
  const items: UnifiedItem[] = useMemo(() => {
    const owned = ownedItems ?? []
    const ownedKey = (it: InventoryItem) => `${it.item_type}::${it.item_id}`
    const ownedMap = new Map(owned.map(it => [ownedKey(it), it]))
    const out: UnifiedItem[] = []

    // 1) Items possédés (badges + cosmétiques débloqués)
    for (const it of owned) {
      if (it.item_type === 'badge') {
        const meta = ACHIEVEMENT_MAP[it.item_id as AchievementId]
        if (!meta) continue
        out.push({
          type:        'badge',
          id:          it.item_id,
          name:        meta.name,
          tier:        BADGE_TIER[it.item_id as AchievementId],
          source:      it.source,
          obtained_at: it.obtained_at,
          isDefault:   false,
          owned:       true,
        })
      } else {
        const meta = getCosmetic(it.item_type, it.item_id)
        out.push({
          type:        it.item_type,
          id:          it.item_id,
          name:        meta.name,
          tier:        meta.tier,
          source:      it.source,
          obtained_at: it.obtained_at,
          isDefault:   meta.isDefault,
          owned:       true,
        })
      }
    }

    // 2) Items cosmétiques par défaut — toujours visibles, jamais dans user_inventory
    for (const type of COSMETIC_TYPES) {
      const defId = DEFAULT_ID_BY_TYPE[type]
      const key = `${type}::${defId}`
      if (ownedMap.has(key)) continue
      const meta = getCosmetic(type, defId)
      out.push({
        type,
        id:          defId,
        name:        meta.name,
        tier:        meta.tier,
        source:      'achievement',
        obtained_at: null,
        isDefault:   true,
        owned:       true,
      })
    }
    return out
  }, [ownedItems])

  // Compteurs par type (sur l'inventaire complet, ignore filtres rareté/provenance)
  const typeCounts = useMemo(() => {
    const counts: Record<TypeFilter, number> = { all: 0, badge: 0, emblem: 0, title: 0, card_design: 0, background: 0, screen_animation: 0 }
    for (const it of items) {
      counts.all++
      counts[it.type]++
    }
    return counts
  }, [items])

  // Items du type courant — base pour les compteurs raretés/provenance
  const itemsByType = useMemo(
    () => typeFilter === 'all' ? items : items.filter(it => it.type === typeFilter),
    [items, typeFilter],
  )

  // Compteurs rareté + provenance (à l'intérieur du type courant)
  const rarityCounts = useMemo(() => {
    const counts: Record<RarityFilter, number> = { all: 0, legendary: 0, epic: 0, rare: 0, common: 0 }
    for (const it of itemsByType) { counts.all++; counts[it.tier]++ }
    return counts
  }, [itemsByType])
  const sourceCounts = useMemo(() => {
    const counts: Record<SourceFilter, number> = { all: 0, achievement: 0, shop: 0, season: 0, rank: 0 }
    for (const it of itemsByType) { counts.all++; counts[it.source]++ }
    return counts
  }, [itemsByType])

  const filtered = useMemo(() => {
    return itemsByType
      .filter(it => rarityFilter === 'all' || it.tier === rarityFilter)
      .filter(it => sourceFilter === 'all' || it.source === sourceFilter)
      .sort((a, b) => {
        const aEq = isItemEquipped(a, profile?.equipped, profile?.featured_badges) ? 0 : 1
        const bEq = isItemEquipped(b, profile?.equipped, profile?.featured_badges) ? 0 : 1
        if (aEq !== bEq) return aEq - bEq
        const tierDiff = TIER_ORDER[a.tier] - TIER_ORDER[b.tier]
        if (tierDiff !== 0) return tierDiff
        return a.name.localeCompare(b.name, 'fr')
      })
  }, [itemsByType, rarityFilter, sourceFilter, profile])

  const equippedCosmeticsCount = useMemo(() => {
    if (!profile) return 0
    return COSMETIC_TYPES.reduce((n, t) => n + (profile.equipped[EQUIPPED_KEY[t]] ? 1 : 0), 0)
  }, [profile])

  const pinnedBadgesCount = profile?.featured_badges.length ?? 0

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="flex min-h-screen flex-col bg-game-bg"
    >
      {/* ── Top bar (standalone) ──────────────────────────────────────────── */}
      {!hideBack && (
        <div className="flex items-center border-b border-game-border px-4 py-2.5">
          <button
            onClick={onBack}
            className="flex w-20 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-white/50 transition-colors hover:bg-white/5 hover:text-white"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            Retour
          </button>
          <div className="flex flex-1 justify-center">
            <p className="text-sm text-white/40">Inventaire</p>
          </div>
          <div className="w-20" />
        </div>
      )}

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      {hideBack && (
        <div className="relative overflow-hidden bg-gradient-to-br from-game-border/20 via-game-card/30 to-transparent px-6 py-7">
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/[0.03] blur-3xl" />
          <div className="relative flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-neon-violet/20 bg-neon-violet/10 text-neon-violet/60">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2 4 6v6c0 5 3.5 9.5 8 10 4.5-.5 8-5 8-10V6l-8-4z"/>
              </svg>
            </div>
            <div>
              <p className="text-lg font-bold text-white">Inventaire</p>
              <p className="mt-0.5 text-xs text-white/35">
                {typeCounts.all} objet{typeCounts.all !== 1 ? 's' : ''} possédé{typeCounts.all !== 1 ? 's' : ''}
                {' · '}{equippedCosmeticsCount} cosmétique{equippedCosmeticsCount !== 1 ? 's' : ''} équipé{equippedCosmeticsCount !== 1 ? 's' : ''}
                {' · '}{pinnedBadgesCount} badge{pinnedBadgesCount !== 1 ? 's' : ''} épinglé{pinnedBadgesCount !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Body ──────────────────────────────────────────────────────────── */}
      {!user ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-4 text-center">
          <div className="text-4xl">✦</div>
          <p className="text-sm font-semibold text-white/60">Connecte-toi pour voir ton inventaire</p>
        </div>
      ) : (
        <>
          {/* Loadout */}
          <Loadout
            equipped={profile?.equipped ?? null}
            featuredBadges={profile?.featured_badges ?? []}
            onPick={setPicker}
          />

          <div className="flex flex-1 overflow-hidden">
            {/* Sidebar (desktop) */}
            <aside className="hidden w-44 shrink-0 flex-col gap-0.5 border-r border-game-border p-3 sm:flex">
              <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-white/20">Rareté</p>
              {RARITY_FILTERS.map(f => (
                <SidebarButton
                  key={f.key}
                  label={f.label}
                  count={rarityCounts[f.key]}
                  active={rarityFilter === f.key}
                  onClick={() => setRarityFilter(f.key)}
                />
              ))}
              <div className="mx-2 my-2 h-px bg-game-border/70" />
              <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-white/20">Provenance</p>
              {SOURCE_FILTERS.filter(f => f.key === 'all' || sourceCounts[f.key] > 0).map(f => (
                <SidebarButton
                  key={f.key}
                  label={f.label}
                  count={sourceCounts[f.key]}
                  active={sourceFilter === f.key}
                  onClick={() => setSourceFilter(f.key)}
                />
              ))}
            </aside>

            {/* Content */}
            <div className="flex flex-1 flex-col overflow-hidden">

              {/* Type tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto border-b border-game-border px-4 py-2.5">
                {TYPE_TABS.map(tab => (
                  <TypeTabButton
                    key={tab.key}
                    label={tab.label}
                    count={typeCounts[tab.key]}
                    icon={tab.icon}
                    active={typeFilter === tab.key}
                    onClick={() => { setTypeFilter(tab.key); setRarityFilter('all'); setSourceFilter('all') }}
                  />
                ))}
              </div>

              {/* Mobile filters */}
              <div className="flex items-center gap-2 border-b border-game-border px-4 py-2 sm:hidden">
                <MobileFilterSelect
                  label="Rareté"
                  value={rarityFilter}
                  options={RARITY_FILTERS.filter(f => f.key === 'all' || rarityCounts[f.key] > 0)}
                  counts={rarityCounts}
                  onChange={setRarityFilter}
                />
                <MobileFilterSelect
                  label="Provenance"
                  value={sourceFilter}
                  options={SOURCE_FILTERS.filter(f => f.key === 'all' || sourceCounts[f.key] > 0)}
                  counts={sourceCounts}
                  onChange={setSourceFilter}
                />
              </div>

              {/* Grid */}
              <div className="flex-1 overflow-y-auto p-4">
                {filtered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
                    <p className="text-sm text-white/30">Aucun objet pour ce filtre</p>
                  </div>
                ) : (
                  <motion.div layout className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    <AnimatePresence mode="popLayout">
                      {filtered.map(it => (
                        <ItemCard
                          key={`${it.type}-${it.id}`}
                          item={it}
                          equipped={isItemEquipped(it, profile?.equipped, profile?.featured_badges)}
                          busy={busyId === `${it.type}-${it.id}`}
                          onClick={() => handleQuickEquip(it)}
                        />
                      ))}
                    </AnimatePresence>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Picker ─────────────────────────────────────────────────────────── */}
      <ItemPicker
        open={picker !== null}
        type={picker?.type ?? 'emblem'}
        slotIndex={picker?.slotIndex}
        onClose={() => setPicker(null)}
      />

      {/* ── Modale remplacement badge (3 slots pleins) ─────────────────────── */}
      <AnimatePresence>
        {badgeReplace && profile && (
          <BadgeReplaceModal
            newBadgeId={badgeReplace.newBadgeId}
            currentBadges={profile.featured_badges as AchievementId[]}
            onSelect={handleBadgeReplace}
            onClose={() => setBadgeReplace(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── Modale remplacement badge ────────────────────────────────────────────────

function BadgeReplaceModal({
  newBadgeId, currentBadges, onSelect, onClose,
}: {
  newBadgeId:    AchievementId
  currentBadges: AchievementId[]
  onSelect:      (slotIndex: 0 | 1 | 2) => void
  onClose:       () => void
}) {
  const newMeta = ACHIEVEMENT_MAP[newBadgeId]
  const newTier = BADGE_TIER[newBadgeId]
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center px-4"
    >
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-game-border bg-game-card"
      >
        {/* Header */}
        <div className="flex items-start gap-3 border-b border-game-border px-4 py-3">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
            style={{
              border: `1px solid ${TIER_GLOW_COLOR[newTier]}55`,
              background: `linear-gradient(180deg, ${TIER_GLOW_COLOR[newTier]}12, rgba(10,10,15,0.95))`,
            }}
          >
            <MiniBadge achievementId={newBadgeId} size={32} unlocked />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-white">{newMeta?.name ?? newBadgeId}</p>
            <p className="mt-0.5 text-[11px] text-white/40">Remplacer un badge épinglé pour épingler celui-ci</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white/30 transition-colors hover:bg-white/5 hover:text-white/60"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Slots */}
        <div className="px-4 py-4">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-white/30">Choisis le badge à remplacer</p>
          <div className="grid grid-cols-3 gap-2.5">
            {([0, 1, 2] as const).map(i => {
              const badgeId = currentBadges[i] as AchievementId | undefined
              if (!badgeId) return <div key={i} className="rounded-xl border border-dashed border-white/10" />
              const meta = ACHIEVEMENT_MAP[badgeId]
              const tier = BADGE_TIER[badgeId]
              const glow = TIER_GLOW_COLOR[tier]
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => onSelect(i)}
                  className="group flex flex-col items-center gap-1.5 rounded-xl border border-game-border bg-white/[0.02] p-2.5 text-center transition-all hover:border-neon-violet/40 hover:bg-neon-violet/[0.05] focus:outline-none"
                  style={{ boxShadow: `inset 0 0 12px ${glow}10` }}
                >
                  <span className="text-[8px] font-bold uppercase tracking-[0.12em] text-white/35">Slot {i + 1}</span>
                  <MiniBadge achievementId={badgeId} size={36} unlocked />
                  <span className="line-clamp-2 text-[10px] font-bold leading-tight text-white/75">{meta?.name ?? badgeId}</span>
                </button>
              )
            })}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Loadout ─────────────────────────────────────────────────────────────────

function Loadout({
  equipped, featuredBadges, onPick,
}: {
  equipped:        EquippedCosmetics | null
  featuredBadges:  string[]
  onPick:          (p: { type: ItemType; slotIndex?: 0 | 1 | 2 }) => void
}) {
  return (
    <div className="border-b border-game-border bg-black/20 px-4 py-4 sm:px-6">
      <div className="mb-3 flex items-center gap-2">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(167,139,250,0.7)" strokeWidth="2" strokeLinecap="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
        <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-neon-violet/55">Équipement</span>
        <span className="ml-1 text-[10px] text-white/25">Clique sur un slot pour changer</span>
      </div>

      <div className="flex flex-wrap items-stretch gap-2.5">
        {COSMETIC_TYPES.map(type => (
          <CosmeticSlot
            key={type}
            type={type}
            equippedId={equipped?.[EQUIPPED_KEY[type]] ?? null}
            onClick={() => onPick({ type })}
          />
        ))}
        <div className="hidden h-auto w-px self-stretch bg-game-border sm:block" />
        {([0, 1, 2] as const).map(i => (
          <BadgeSlotTile
            key={i}
            index={i}
            badgeId={(featuredBadges[i] as AchievementId | undefined) ?? null}
            onClick={() => onPick({ type: 'badge', slotIndex: i })}
          />
        ))}
      </div>
    </div>
  )
}

function CosmeticSlot({ type, equippedId, onClick }: { type: CosmeticType; equippedId: string | null; onClick: () => void }) {
  const meta = getCosmetic(type, equippedId)
  const isEquipped = equippedId !== null && !meta.isDefault
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.97 }}
      className="group relative flex w-[110px] flex-col items-center gap-1.5 rounded-xl border border-game-border bg-white/[0.02] px-2 py-2.5 text-center transition-colors hover:border-neon-violet/35 hover:bg-neon-violet/[0.04] focus:outline-none"
      style={{ minHeight: 116 }}
    >
      <span className="text-[8px] font-bold uppercase tracking-[0.12em] text-white/30">
        {COSMETIC_TYPE_LABEL[type]}
      </span>
      <span className="flex flex-1 items-center justify-center">
        <CosmeticPreview type={type} id={equippedId} size="sm" />
      </span>
      <span className="line-clamp-2 text-[10px] font-bold leading-tight text-white/80">
        {meta.name}
      </span>
      {isEquipped && (
        <span
          className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full"
          style={{
            background: '#22c55e',
            border: '2px solid #0A0A0F',
            boxShadow: '0 0 8px rgba(34,197,94,0.6)',
          }}
        />
      )}
      <span className="absolute right-1.5 top-1.5 text-white/20 opacity-0 transition-opacity group-hover:opacity-100">
        <PencilIcon />
      </span>
    </motion.button>
  )
}

function BadgeSlotTile({ index, badgeId, onClick }: { index: 0 | 1 | 2; badgeId: AchievementId | null; onClick: () => void }) {
  const meta = badgeId ? ACHIEVEMENT_MAP[badgeId] : null
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.97 }}
      className="group relative flex w-[92px] flex-col items-center gap-1.5 rounded-xl border border-game-border bg-white/[0.02] px-2 py-2.5 text-center transition-colors hover:border-neon-violet/35 hover:bg-neon-violet/[0.04] focus:outline-none"
      style={{ minHeight: 116 }}
    >
      <span className="text-[8px] font-bold uppercase tracking-[0.12em] text-white/30">
        Badge {index + 1}
      </span>
      <span className="flex flex-1 items-center justify-center">
        {badgeId
          ? <MiniBadge achievementId={badgeId} size={40} unlocked />
          : <span className="flex h-10 w-10 items-center justify-center rounded-full border border-dashed border-white/10 text-base text-white/15">+</span>
        }
      </span>
      <span className="line-clamp-2 text-[9px] font-semibold leading-tight text-white/55">
        {meta?.name ?? 'Vide'}
      </span>
      {badgeId && (
        <span
          className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full"
          style={{
            background: '#22c55e',
            border: '2px solid #0A0A0F',
            boxShadow: '0 0 8px rgba(34,197,94,0.6)',
          }}
        />
      )}
      <span className="absolute right-1.5 top-1.5 text-white/20 opacity-0 transition-opacity group-hover:opacity-100">
        <PencilIcon />
      </span>
    </motion.button>
  )
}

// ─── Item card ───────────────────────────────────────────────────────────────

function ItemCard({ item, equipped, busy, onClick }: { item: UnifiedItem; equipped: boolean; busy: boolean; onClick: () => void }) {
  const tierColor = TIER_DOT_COLOR[item.tier]
  const sourceStyle = SOURCE_STYLE[item.source]
  const typeIcon = TYPE_ICON[item.type]
  const typeLabel = item.type === 'badge' ? 'Badge' : COSMETIC_TYPE_LABEL[item.type]

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="relative flex min-h-[180px] flex-col items-center gap-2 rounded-xl border bg-game-card p-3 text-center transition-colors hover:border-neon-violet/35"
      style={{
        borderColor: equipped ? 'rgba(34,197,94,0.4)' : 'var(--tw-game-border, #1E1E2E)',
        background:  equipped ? 'linear-gradient(180deg, rgba(34,197,94,0.04), #13131F)' : undefined,
      }}
    >
      {/* Tier pill */}
      <div className="absolute left-2 top-2 flex items-center gap-1 opacity-55">
        <div className="h-1.5 w-1.5 rounded-full" style={{ background: tierColor }} />
        <span className="text-[8px] font-medium uppercase tracking-wide text-white/55">
          {TIER_LABEL[item.tier]}
        </span>
      </div>

      {/* Type icon */}
      <div
        className="absolute right-2 top-2 flex h-[18px] w-[18px] items-center justify-center rounded-md text-white/35"
        style={{ background: 'rgba(255,255,255,0.04)' }}
        title={typeLabel}
      >
        {typeIcon}
      </div>

      {/* Preview */}
      <div className="mt-4 flex h-16 items-center justify-center">
        {item.type === 'badge'
          ? <MiniBadge achievementId={item.id as AchievementId} size={48} unlocked />
          : <CosmeticPreview type={item.type} id={item.id} size="md" />
        }
      </div>

      {/* Name */}
      <p className="text-[11px] font-bold leading-tight text-white">{item.name}</p>

      {/* Source tag */}
      <div
        className="rounded-full px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-wide"
        style={{ background: sourceStyle.bg, color: sourceStyle.text, border: `1px solid ${sourceStyle.border}` }}
      >
        {sourceStyle.label}
      </div>

      {/* CTA */}
      <button
        type="button"
        onClick={onClick}
        disabled={busy}
        className="mt-auto flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-[10px] font-bold text-white/55 transition-colors hover:border-neon-violet/40 hover:bg-neon-violet/15 hover:text-neon-violet focus:outline-none disabled:opacity-60"
      >
        {busy ? (
          <div className="h-2.5 w-2.5 animate-spin rounded-full border border-white/30 border-t-white/80" />
        ) : equipped ? (
          <>
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <span style={{ color: 'rgba(34,197,94,0.9)' }}>{item.type === 'badge' ? 'Épinglé' : 'Équipé'}</span>
          </>
        ) : (
          <>
            {item.type === 'badge'
              ? <PinIconSm />
              : <PowerIconSm />
            }
            {item.type === 'badge' ? 'Épingler' : 'Équiper'}
          </>
        )}
      </button>
    </motion.div>
  )
}

// ─── Sidebar / Type tabs / Mobile filters ────────────────────────────────────

function SidebarButton({ label, count, active, onClick }: { label: string; count: number; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={[
        'flex items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs font-medium transition-colors',
        active ? 'bg-neon-violet/10 text-neon-violet' : 'text-white/35 hover:bg-white/5 hover:text-white/60',
      ].join(' ')}
    >
      <span>{label}</span>
      <span className={['tabular-nums text-[10px]', active ? 'text-neon-violet/70' : 'text-white/20'].join(' ')}>
        {count}
      </span>
    </button>
  )
}

function TypeTabButton({ label, count, icon, active, onClick }: { label: string; count: number; icon: React.ReactNode; active: boolean; onClick: () => void }) {
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

function MobileFilterSelect<T extends string>({
  label, value, options, counts, onChange,
}: {
  label:    string
  value:    T
  options:  { key: T; label: string }[]
  counts:   Record<T, number>
  onChange: (v: T) => void
}) {
  const activeLabel = options.find(o => o.key === value)?.label
  const isFiltered = value !== 'all'
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
      <span aria-hidden className="hidden">{activeLabel}</span>
    </label>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isItemEquipped(it: UnifiedItem, equipped: EquippedCosmetics | undefined | null, featured: string[] | undefined): boolean {
  if (it.type === 'badge') return (featured ?? []).includes(it.id)
  const eqId = equipped?.[EQUIPPED_KEY[it.type]] ?? null
  if (eqId === null) return it.isDefault
  return eqId === it.id
}

// ─── Icons ───────────────────────────────────────────────────────────────────

const TYPE_ICON: Record<ItemType, React.ReactNode> = {
  badge:            <BadgeIconSmall />,
  emblem:           <ShieldIconSmall />,
  title:            <TitleIconSmall />,
  card_design:      <CardIconSmall />,
  background:       <BgIconSmall />,
  screen_animation: <SparklesIconSmall />,
}

function PencilIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  )
}

function PinIconSm() {
  return (
    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="17" x2="12" y2="22"/>
      <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"/>
    </svg>
  )
}

function PowerIconSm() {
  return (
    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  )
}

function BadgeIcon() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
}
function ShieldIcon() {
  return <svg width="12" height="14" viewBox="0 0 24 28" fill="currentColor"><path d="M12 2 4 5v8c0 5 3.5 10 8 12 4.5-2 8-7 8-12V5l-8-3z"/></svg>
}
function TitleIcon() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 7h16M4 12h10M4 17h16"/></svg>
}
function CardIcon() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="16" rx="2"/></svg>
}
function BgIcon() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/><path d="m21 15-5-5L5 21"/></svg>
}
function SparklesIcon() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
}

function BadgeIconSmall() {
  return <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
}
function ShieldIconSmall() {
  return <svg width="10" height="12" viewBox="0 0 24 28" fill="currentColor"><path d="M12 2 4 5v8c0 5 3.5 10 8 12 4.5-2 8-7 8-12V5l-8-3z"/></svg>
}
function TitleIconSmall() {
  return <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 7h16M4 12h10M4 17h16"/></svg>
}
function CardIconSmall() {
  return <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="16" rx="2"/></svg>
}
function BgIconSmall() {
  return <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/><path d="m21 15-5-5L5 21"/></svg>
}
function SparklesIconSmall() {
  return <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v4M12 18v4"/></svg>
}
