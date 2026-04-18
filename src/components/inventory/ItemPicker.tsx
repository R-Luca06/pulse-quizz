import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../contexts/ToastContext'
import { equipCosmetic } from '../../services/inventory'
import { updateFeaturedBadges } from '../../services/profile'
import { listCosmetics, COSMETIC_TYPE_LABEL, DEFAULT_ID_BY_TYPE, getBadgeMeta } from '../../constants/cosmetics/registry'
import { ACHIEVEMENT_MAP } from '../../constants/achievements'
import { SHOP_BADGE_REGISTRY } from '../../constants/shopBadges'
import { TIER_GLOW_COLOR } from '../../constants/achievementColors'
import MiniBadge from '../shared/MiniBadge'
import { CosmeticPreview } from './previews'
import type { AchievementTier, CosmeticType, EquippedCosmetics, ItemType } from '../../types/quiz'

// ─── Constantes ───────────────────────────────────────────────────────────────

const TIER_LABEL: Record<AchievementTier, string> = {
  common: 'Commun', rare: 'Rare', epic: 'Épique', legendary: 'Légendaire',
}

const TIER_DOT: Record<AchievementTier, string> = {
  legendary: '#f59e0b',
  epic:      '#a78bfa',
  rare:      '#60a5fa',
  common:    'rgba(255,255,255,0.3)',
}

const TIER_BORDER: Record<AchievementTier, string> = {
  legendary: 'rgba(245,158,11,0.6)',
  epic:      'rgba(167,139,250,0.55)',
  rare:      'rgba(96,165,250,0.5)',
  common:    'rgba(255,255,255,0.25)',
}

const TIER_SELECTED_BG: Record<AchievementTier, string> = {
  legendary: 'rgba(245,158,11,0.06)',
  epic:      'rgba(167,139,250,0.06)',
  rare:      'rgba(96,165,250,0.06)',
  common:    'rgba(255,255,255,0.04)',
}

const EQUIPPED_KEY: Record<CosmeticType, keyof EquippedCosmetics> = {
  emblem:           'emblem_id',
  background:       'background_id',
  title:            'title_id',
  card_design:      'card_design_id',
  screen_animation: 'screen_anim_id',
}

// ─── Types internes ───────────────────────────────────────────────────────────

interface TileMeta {
  id:        string
  name:      string
  tier:      AchievementTier
  isDefault: boolean
  owned:     boolean
}

// ─── Composant principal ──────────────────────────────────────────────────────

interface Props {
  open:       boolean
  type:       ItemType            // 'badge' | 'emblem' | 'title' | 'card_design' | 'background' | 'screen_animation'
  slotIndex?: 0 | 1 | 2           // requis uniquement pour type 'badge'
  onClose:    () => void
}

export default function ItemPicker({ open, type, slotIndex, onClose }: Props) {
  return (
    <AnimatePresence>
      {open && (
        type === 'badge'
          ? <BadgePickerInner key="badge-picker" slotIndex={slotIndex ?? 0} onClose={onClose} />
          : <CosmeticPickerInner key="cosmetic-picker" type={type} onClose={onClose} />
      )}
    </AnimatePresence>
  )
}

// ─── Shell commun (backdrop + sheet) ──────────────────────────────────────────

function Sheet({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-end justify-center"
    >
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 380, damping: 40 }}
        className="relative flex w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border-t border-game-border bg-game-card"
        style={{ maxHeight: '86vh' }}
      >
        {children}
      </motion.div>
    </motion.div>
  )
}

function Handle() {
  return (
    <div className="flex justify-center pt-2.5 pb-1">
      <div className="h-1 w-10 rounded-full bg-white/10" />
    </div>
  )
}

function Header({ title, subtitle, onClose }: { title: string; subtitle: string; onClose: () => void }) {
  return (
    <div className="flex items-center justify-between border-b border-game-border px-5 py-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-white/85">{title}</p>
        <p className="mt-0.5 text-[11px] text-white/30">{subtitle}</p>
      </div>
      <button
        onClick={onClose}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white/30 transition-colors hover:bg-white/5 hover:text-white/60"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
  )
}

// ─── Cosmetic picker ──────────────────────────────────────────────────────────

function CosmeticPickerInner({ type, onClose }: { type: CosmeticType; onClose: () => void }) {
  const { user, profile, ownedItems, setLocalEquipped } = useAuth()
  const toast = useToast()

  const equippedKey = EQUIPPED_KEY[type]
  const equippedId  = profile?.equipped[equippedKey] ?? null
  const defaultId   = DEFAULT_ID_BY_TYPE[type]

  const [selectedId, setSelectedId] = useState<string | null>(equippedId ?? defaultId)
  const [saving, setSaving] = useState(false)

  const tiles: TileMeta[] = useMemo(() => {
    const TIER_ORDER: Record<AchievementTier, number> = { legendary: 0, epic: 1, rare: 2, common: 3 }
    const ownedSet = new Set((ownedItems ?? []).filter(it => it.item_type === type).map(it => it.item_id))
    const all = listCosmetics(type)
    return all
      .map(meta => ({
        id:        meta.id,
        name:      meta.name,
        tier:      meta.tier,
        isDefault: meta.isDefault,
        owned:     meta.isDefault || ownedSet.has(meta.id),
      }))
      .sort((a, b) => {
        if (a.isDefault !== b.isDefault) return a.isDefault ? -1 : 1
        if (a.owned !== b.owned) return a.owned ? -1 : 1
        return TIER_ORDER[a.tier] - TIER_ORDER[b.tier]
      })
  }, [ownedItems, type])

  const selectedTile = tiles.find(t => t.id === selectedId) ?? tiles[0]
  const selectedMetaId = selectedTile?.id ?? defaultId
  const isSelectedEquipped = (equippedId ?? defaultId) === selectedMetaId
  const isSelectedDefault  = selectedMetaId === defaultId
  const isEquippedDefault  = (equippedId ?? defaultId) === defaultId

  const obtainedAt = (ownedItems ?? []).find(it => it.item_type === type && it.item_id === selectedMetaId)?.obtained_at ?? null

  async function handleEquip() {
    if (!user || !selectedTile || saving) return
    if (!selectedTile.owned) return
    const prev = equippedId
    const next = selectedTile.isDefault ? null : selectedTile.id
    setSaving(true)
    setLocalEquipped(type, next)
    try {
      await equipCosmetic(user.id, type, next)
      toast.success(`${COSMETIC_TYPE_LABEL[type]} équipé${type === 'card_design' ? 'e' : ''}`)
      onClose()
    } catch {
      setLocalEquipped(type, prev)
      toast.error("L'équipement n'a pas pu être sauvegardé")
    } finally {
      setSaving(false)
    }
  }

  async function handleRemoveOrDefault() {
    if (!user || saving) return
    const prev = equippedId
    setSaving(true)
    setLocalEquipped(type, null)
    try {
      await equipCosmetic(user.id, type, null)
      toast.success(`${COSMETIC_TYPE_LABEL[type]} retiré${type === 'card_design' ? 'e' : ''}`)
      onClose()
    } catch {
      setLocalEquipped(type, prev)
      toast.error("L'action n'a pas pu être sauvegardée")
    } finally {
      setSaving(false)
    }
  }

  const tierColor = TIER_DOT[selectedTile?.tier ?? 'common']
  const tierLabel = TIER_LABEL[selectedTile?.tier ?? 'common']

  const subtitle = COSMETIC_TYPE_SUBTITLE[type]

  return (
    <Sheet onClose={onClose}>
      <Handle />
      <Header title={COSMETIC_TYPE_LABEL[type]} subtitle={subtitle} onClose={onClose} />

      {/* ── Live preview ─────────────────────────────────────────────────── */}
      <div
        className="flex items-center gap-3 border-b border-game-border px-4 py-3"
        style={{ background: `linear-gradient(180deg, ${tierColor}08, transparent)` }}
      >
        <div
          className="flex shrink-0 items-center justify-center rounded-xl"
          style={{
            width: 96, height: 108,
            border: `1px solid ${tierColor}35`,
            background: `linear-gradient(180deg, ${tierColor}0a, rgba(10,10,15,0.95))`,
            boxShadow: `0 0 24px ${tierColor}1a, inset 0 0 18px ${tierColor}05`,
          }}
        >
          <CosmeticPreview type={type} id={selectedMetaId} size="lg" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: tierColor }}>
            {tierLabel}
          </p>
          <p className="mt-1 truncate text-lg font-black text-white">{selectedTile?.name ?? '—'}</p>
          <p className="mt-1 line-clamp-2 text-[11px] text-white/40">
            {listCosmetics(type).find(m => m.id === selectedMetaId)?.description ?? ''}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Tag color={tierColor}>{tierLabel}</Tag>
            {!selectedTile?.isDefault && selectedTile?.owned && obtainedAt && (
              <Tag color="rgba(255,255,255,0.4)" muted>Obtenu {formatDate(obtainedAt)}</Tag>
            )}
            {!selectedTile?.owned && !selectedTile?.isDefault && (
              <Tag color="rgba(255,255,255,0.28)" muted>Non débloqué</Tag>
            )}
          </div>
        </div>
      </div>

      {/* ── CTA bar ──────────────────────────────────────────────────────── */}
      <div className="flex gap-2 border-b border-game-border px-4 py-2.5">
        <button
          type="button"
          disabled={!selectedTile?.owned || isSelectedEquipped || saving}
          onClick={handleEquip}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-xs font-bold text-white shadow-[0_4px_16px_rgba(139,92,246,0.35)] transition-[filter] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none hover:enabled:brightness-110"
          style={{ background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)' }}
        >
          {saving ? (
            <div className="h-3 w-3 animate-spin rounded-full border border-white/40 border-t-white" />
          ) : (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              {isSelectedEquipped ? 'Équipé' : 'Équiper'}
            </>
          )}
        </button>
        {!isEquippedDefault && (
          isSelectedDefault ? null : (
            <button
              type="button"
              disabled={saving}
              onClick={handleRemoveOrDefault}
              className="flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2.5 text-xs font-bold transition-colors disabled:opacity-50"
              style={{
                background: 'rgba(239,68,68,0.08)',
                borderColor: 'rgba(239,68,68,0.25)',
                color: 'rgba(248,113,113,0.9)',
              }}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              </svg>
              Retirer
            </button>
          )
        )}
        {isEquippedDefault && !isSelectedDefault && selectedTile?.owned && (
          <button
            type="button"
            disabled={saving}
            onClick={handleRemoveOrDefault}
            className="flex items-center justify-center rounded-lg border border-game-border bg-white/[0.04] px-3 py-2.5 text-xs font-bold text-white/50 transition-colors hover:bg-white/[0.07] hover:text-white disabled:opacity-50"
          >
            Revenir au défaut
          </button>
        )}
      </div>

      {/* ── Grille ───────────────────────────────────────────────────────── */}
      <div className="grid flex-1 grid-cols-3 gap-2.5 overflow-y-auto px-4 py-4">
        {tiles.map(tile => (
          <TileButton
            key={tile.id}
            tile={tile}
            selected={tile.id === selectedMetaId}
            currentlyEquipped={(equippedId ?? defaultId) === tile.id}
            onSelect={() => setSelectedId(tile.id)}
            preview={<CosmeticPreview type={type} id={tile.id} size="sm" />}
          />
        ))}
      </div>
    </Sheet>
  )
}

const COSMETIC_TYPE_SUBTITLE: Record<CosmeticType, string> = {
  emblem:           'Choisir un blason à équiper',
  title:            'Choisir un titre à équiper',
  card_design:      'Choisir un design de carte à équiper',
  background:       'Appliqué derrière ton profil public',
  screen_animation: 'Animation en surcouche de ton profil',
}

// ─── Badge picker ─────────────────────────────────────────────────────────────

function BadgePickerInner({ slotIndex, onClose }: { slotIndex: 0 | 1 | 2; onClose: () => void }) {
  const { user, profile, ownedItems, setLocalFeaturedBadges } = useAuth()
  const toast = useToast()

  const featured     = profile?.featured_badges ?? []
  const currentSlot  = featured[slotIndex] ?? null
  const [selectedId, setSelectedId] = useState<string | null>(currentSlot)
  const [saving, setSaving] = useState(false)

  const ownedBadgeIds = useMemo(() => {
    const set = new Set<string>()
    for (const it of ownedItems ?? []) {
      if (it.item_type === 'badge') set.add(it.item_id)
    }
    return set
  }, [ownedItems])

  const tiles = useMemo(() => {
    const TIER_ORDER: Record<AchievementTier, number> = { legendary: 0, epic: 1, rare: 2, common: 3 }
    const achievementIds = Object.keys(ACHIEVEMENT_MAP)
    const shopIds        = Object.keys(SHOP_BADGE_REGISTRY)
    const allIds = [...achievementIds, ...shopIds]
    return allIds
      .map(id => {
        const meta = getBadgeMeta(id)
        if (!meta) return null
        return {
          id,
          name:  meta.name,
          tier:  meta.tier,
          owned: ownedBadgeIds.has(id),
        }
      })
      .filter((t): t is { id: string; name: string; tier: AchievementTier; owned: boolean } => t !== null)
      .sort((a, b) => {
        if (a.owned !== b.owned) return a.owned ? -1 : 1
        return TIER_ORDER[a.tier] - TIER_ORDER[b.tier]
      })
  }, [ownedBadgeIds])

  const selectedMeta = selectedId ? getBadgeMeta(selectedId) : null
  const selected = selectedId && selectedMeta ? { id: selectedId, meta: selectedMeta } : null
  const selectedTier = selectedMeta?.tier ?? 'common'
  const pinnedElsewhere = selectedId ? featured.includes(selectedId) && featured[slotIndex] !== selectedId : false
  const isCurrentlyPinnedHere = selectedId !== null && currentSlot === selectedId
  const canEquip = !!selected && ownedBadgeIds.has(selected.id) && !pinnedElsewhere && !isCurrentlyPinnedHere
  const tierGlow = TIER_GLOW_COLOR[selectedTier]
  const obtainedAt = selectedId ? (ownedItems ?? []).find(it => it.item_type === 'badge' && it.item_id === selectedId)?.obtained_at ?? null : null

  async function applyUpdate(next: (string | null)[]) {
    if (!user || saving) return
    const prev = featured
    const nextIds = next.filter((b): b is string => b !== null)
    setSaving(true)
    setLocalFeaturedBadges(nextIds)
    try {
      await updateFeaturedBadges(user.id, nextIds)
      onClose()
    } catch {
      setLocalFeaturedBadges(prev)
      toast.error("L'action n'a pas pu être sauvegardée")
    } finally {
      setSaving(false)
    }
  }

  async function handlePin() {
    if (!selectedId || !canEquip) return
    const next: (string | null)[] = [featured[0] ?? null, featured[1] ?? null, featured[2] ?? null]
    next[slotIndex] = selectedId
    await applyUpdate(next)
  }

  async function handleUnpin() {
    const next: (string | null)[] = [featured[0] ?? null, featured[1] ?? null, featured[2] ?? null]
    next[slotIndex] = null
    await applyUpdate(next)
  }

  return (
    <Sheet onClose={onClose}>
      <Handle />
      <Header
        title={`Bannière ${slotIndex + 1}`}
        subtitle="Choisir un badge à épingler"
        onClose={onClose}
      />

      {/* ── Live preview ─────────────────────────────────────────────────── */}
      <div
        className="flex items-center gap-3 border-b border-game-border px-4 py-3"
        style={{ background: `linear-gradient(180deg, ${tierGlow}12, transparent)` }}
      >
        <div
          className="flex shrink-0 items-center justify-center rounded-xl"
          style={{
            width: 96, height: 108,
            border: `1px solid ${tierGlow}35`,
            background: `linear-gradient(180deg, ${tierGlow}0f, rgba(10,10,15,0.95))`,
            boxShadow: `0 0 24px ${tierGlow}22`,
          }}
        >
          {selectedId
            ? <MiniBadge achievementId={selectedId} size={56} unlocked />
            : <div className="text-[10px] text-white/25">Aucun</div>
          }
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: tierGlow }}>
            {TIER_LABEL[selectedTier]}
          </p>
          <p className="mt-1 truncate text-lg font-black text-white">
            {selected ? selected.meta.name : 'Aucun badge sélectionné'}
          </p>
          <p className="mt-1 line-clamp-2 text-[11px] text-white/40">
            {selected ? selected.meta.description : 'Choisis un badge ci-dessous pour l\'épingler.'}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Tag color={tierGlow}>{TIER_LABEL[selectedTier]}</Tag>
            {selected && ownedBadgeIds.has(selected.id) && obtainedAt && (
              <Tag color="rgba(255,255,255,0.4)" muted>Obtenu {formatDate(obtainedAt)}</Tag>
            )}
            {selected && !ownedBadgeIds.has(selected.id) && (
              <Tag color="rgba(255,255,255,0.28)" muted>Non débloqué</Tag>
            )}
            {pinnedElsewhere && (
              <Tag color="#facc15" muted>Déjà épinglé ailleurs</Tag>
            )}
          </div>
        </div>
      </div>

      {/* ── CTA bar ──────────────────────────────────────────────────────── */}
      <div className="flex gap-2 border-b border-game-border px-4 py-2.5">
        <button
          type="button"
          disabled={!canEquip || saving}
          onClick={handlePin}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-xs font-bold text-white shadow-[0_4px_16px_rgba(139,92,246,0.35)] transition-[filter] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none hover:enabled:brightness-110"
          style={{ background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)' }}
        >
          {saving ? (
            <div className="h-3 w-3 animate-spin rounded-full border border-white/40 border-t-white" />
          ) : (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <line x1="12" y1="17" x2="12" y2="22" stroke="currentColor" strokeWidth="2"/>
                <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"/>
              </svg>
              {isCurrentlyPinnedHere ? 'Épinglé' : 'Épingler'}
            </>
          )}
        </button>
        {currentSlot !== null && (
          <button
            type="button"
            disabled={saving}
            onClick={handleUnpin}
            className="flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2.5 text-xs font-bold transition-colors disabled:opacity-50"
            style={{
              background: 'rgba(239,68,68,0.08)',
              borderColor: 'rgba(239,68,68,0.25)',
              color: 'rgba(248,113,113,0.9)',
            }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            </svg>
            Retirer
          </button>
        )}
      </div>

      {/* ── Grille ───────────────────────────────────────────────────────── */}
      <div className="grid flex-1 grid-cols-3 gap-2.5 overflow-y-auto px-4 py-4">
        {tiles.map(tile => {
          const pinnedAnotherSlot = featured.includes(tile.id) && featured[slotIndex] !== tile.id
          return (
            <TileButton
              key={tile.id}
              tile={{ id: tile.id, name: tile.name, tier: tile.tier, isDefault: false, owned: tile.owned }}
              selected={tile.id === selectedId}
              currentlyEquipped={currentSlot === tile.id}
              pinnedElsewhere={pinnedAnotherSlot}
              onSelect={() => setSelectedId(tile.id)}
              preview={<MiniBadge achievementId={tile.id} size={40} unlocked={tile.owned} />}
            />
          )
        })}
      </div>
    </Sheet>
  )
}

// ─── Tile button + helpers ────────────────────────────────────────────────────

function TileButton({
  tile,
  selected,
  currentlyEquipped,
  pinnedElsewhere = false,
  onSelect,
  preview,
}: {
  tile:              TileMeta
  selected:          boolean
  currentlyEquipped: boolean
  pinnedElsewhere?:  boolean
  onSelect:          () => void
  preview:           React.ReactNode
}) {
  const disabled = !tile.owned || pinnedElsewhere
  const borderColor = selected ? TIER_BORDER[tile.tier] : 'rgba(30,30,46,1)'
  const bg = selected ? TIER_SELECTED_BG[tile.tier] : 'rgba(255,255,255,0.02)'

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled && !selected}
      className="relative flex min-h-[128px] flex-col items-center gap-1.5 rounded-xl p-2.5 transition-colors focus:outline-none"
      style={{
        background:  bg,
        border:      `1px solid ${borderColor}`,
        boxShadow:   selected ? `0 0 18px ${TIER_BORDER[tile.tier]}22` : undefined,
        cursor:      disabled && !selected ? 'not-allowed' : 'pointer',
        opacity:     (disabled && !selected) ? 0.35 : 1,
        filter:      (disabled && !selected) ? 'grayscale(1)' : 'none',
      }}
    >
      {/* Tier dot */}
      <span
        className="absolute left-1.5 top-1.5 h-1.5 w-1.5 rounded-full"
        style={{
          background: TIER_DOT[tile.tier],
          boxShadow:  tile.tier === 'legendary' ? `0 0 4px ${TIER_DOT[tile.tier]}` : undefined,
        }}
      />

      {/* Check */}
      {selected && (
        <span
          className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full"
          style={{ background: TIER_DOT[tile.tier] }}
        >
          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </span>
      )}

      {/* Preview */}
      <span className="mt-2 mb-1 flex h-14 items-center justify-center">
        {preview}
      </span>

      {/* Name */}
      <span className="line-clamp-2 text-center text-[10px] font-bold leading-tight text-white/80">
        {tile.name}
      </span>

      {/* Pills */}
      {tile.isDefault && !selected && (
        <span
          className="absolute bottom-1 left-1 right-1 truncate rounded-full border px-1.5 py-0.5 text-center text-[8px] font-black uppercase tracking-wide"
          style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.45)' }}
        >
          Par défaut
        </span>
      )}
      {currentlyEquipped && !selected && (
        <span
          className="absolute bottom-1 left-1 right-1 truncate rounded-full border px-1.5 py-0.5 text-center text-[8px] font-black uppercase tracking-wide"
          style={{ background: 'rgba(34,197,94,0.12)', borderColor: 'rgba(34,197,94,0.3)', color: '#86efac' }}
        >
          Équipé
        </span>
      )}

      {/* Lock overlay */}
      {disabled && !selected && (
        <span
          className="absolute inset-0 flex items-center justify-center rounded-xl"
          style={{ background: 'rgba(0,0,0,0.2)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="rgba(255,255,255,0.7)">
            <path d="M12 1a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2h-1V6a5 5 0 0 0-5-5zm-3 8V6a3 3 0 0 1 6 0v3H9z"/>
          </svg>
        </span>
      )}
    </button>
  )
}

function Tag({ color, muted = false, children }: { color: string; muted?: boolean; children: React.ReactNode }) {
  return (
    <span
      className="rounded-full px-2 py-[3px] text-[9px] font-bold uppercase tracking-wider"
      style={{
        color,
        background: muted ? 'rgba(255,255,255,0.04)' : `${color}14`,
        border:     muted ? '1px solid rgba(255,255,255,0.08)' : `1px solid ${color}33`,
      }}
    >
      {children}
    </span>
  )
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
    .format(new Date(iso))
}
