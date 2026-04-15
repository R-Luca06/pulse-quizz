import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../hooks/useAuth'
import { getUserBadges } from '../../services/badges'
import { updateFeaturedBadges } from '../../services/profile'
import { ACHIEVEMENT_MAP } from '../../constants/achievements'
import { TIER_GLOW_COLOR } from '../../constants/achievementColors'
import MiniBadge from '../shared/MiniBadge'
import type { OwnedBadge, AchievementTier, BadgeSource } from '../../types/quiz'
import type { AchievementId } from '../../types/quiz'

// ─── Types locaux ─────────────────────────────────────────────────────────────

interface EnrichedBadge extends OwnedBadge {
  name:        string
  description: string
  icon:        string
  tier:        AchievementTier
}

type RarityFilter = 'all' | AchievementTier
type SourceFilter = 'all' | BadgeSource

// ─── Constantes ───────────────────────────────────────────────────────────────

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

const SOURCE_STYLE: Record<BadgeSource, { bg: string; text: string; border: string; label: string }> = {
  achievement: { bg: 'rgba(34,197,94,.1)',  text: 'rgba(34,197,94,.8)',  border: 'rgba(34,197,94,.2)',  label: 'Succès' },
  shop:        { bg: 'rgba(234,179,8,.1)',  text: 'rgba(234,179,8,.8)',  border: 'rgba(234,179,8,.2)',  label: 'Boutique' },
  season:      { bg: 'rgba(236,72,153,.1)', text: 'rgba(236,72,153,.8)', border: 'rgba(236,72,153,.2)', label: 'Saison' },
  rank:        { bg: 'rgba(59,130,246,.1)', text: 'rgba(59,130,246,.8)', border: 'rgba(59,130,246,.2)', label: 'Classement' },
}

const TIER_ORDER: Record<AchievementTier, number> = { legendary: 0, epic: 1, rare: 2, common: 3 }

const TIER_LABEL: Record<AchievementTier, string> = {
  common: 'Commun', rare: 'Rare', epic: 'Épique', legendary: 'Légendaire',
}

const TIER_DOT_COLOR: Record<AchievementTier, string> = {
  common:    'rgba(255,255,255,0.30)',
  rare:      'rgba(96,165,250,0.80)',
  epic:      '#a78bfa',
  legendary: '#f59e0b',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function enrichBadge(badge: OwnedBadge): EnrichedBadge | null {
  if (badge.source === 'achievement') {
    const ach = ACHIEVEMENT_MAP[badge.badge_id as AchievementId]
    if (!ach) return null
    return { ...badge, name: ach.name, description: ach.description, icon: ach.icon, tier: ach.tier }
  }
  // Pour les futures sources (shop, season, rank) : données à enrichir depuis une table badges
  return { ...badge, name: badge.badge_id, description: '', icon: '✦', tier: 'common' }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ─── Pin icon ─────────────────────────────────────────────────────────────────

const PinIcon = ({ filled }: { filled: boolean }) => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="17" x2="12" y2="22"/>
    <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"/>
  </svg>
)

// ─── Badge card ───────────────────────────────────────────────────────────────

function BadgeCard({ badge, isPinned, canPin, onTogglePin }: {
  badge: EnrichedBadge
  isPinned: boolean
  canPin: boolean
  onTogglePin: (id: string) => void
}) {
  const src = SOURCE_STYLE[badge.source]
  const glowColor = TIER_GLOW_COLOR[badge.tier]

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="relative flex min-h-[148px] flex-col items-center gap-2 rounded-xl border border-emerald-500/20 bg-game-card p-3 text-center"
    >
      {/* Rareté — top-left */}
      <div className="absolute left-2 top-2 flex items-center gap-1 opacity-50">
        <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: TIER_DOT_COLOR[badge.tier] }} />
        <span className="text-[8px] font-medium uppercase tracking-wide text-white/55">
          {TIER_LABEL[badge.tier]}
        </span>
      </div>

      {/* Pin button — top-right */}
      <motion.button
        whileTap={{ scale: 0.85 }}
        onClick={() => onTogglePin(badge.badge_id)}
        disabled={!isPinned && !canPin}
        title={isPinned ? 'Retirer du leaderboard' : canPin ? 'Afficher dans le leaderboard' : 'Maximum 3 badges'}
        className={[
          'absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full transition-colors',
          isPinned
            ? 'bg-neon-violet/20 text-neon-violet hover:bg-neon-violet/30'
            : canPin
              ? 'bg-white/5 text-white/25 hover:bg-white/10 hover:text-white/60'
              : 'cursor-not-allowed text-white/10',
        ].join(' ')}
      >
        <PinIcon filled={isPinned} />
      </motion.button>

      {/* Badge hexagone */}
      <div className="relative mt-4 shrink-0">
        <MiniBadge achievementId={badge.badge_id} size={52} unlocked />
        <div className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full border border-game-bg bg-emerald-500/20 text-[7px] font-black text-emerald-400">
          ✓
        </div>
      </div>

      {/* Texte */}
      <div className="flex flex-1 flex-col items-center gap-1 px-0.5">
        <p className="text-[10px] font-bold leading-tight text-white">{badge.name}</p>
        {/* Tag provenance */}
        <div
          className="rounded-full px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-wide"
          style={{ background: src.bg, color: src.text, border: `1px solid ${src.border}` }}
        >
          {src.label}
        </div>
        {badge.source === 'season' ? (
          <p className="text-[8px] font-semibold" style={{ color: glowColor }}>Exclusif · {formatDate(badge.obtained_at)}</p>
        ) : (
          <p className="text-[8px] text-white/30">
            {badge.source === 'shop' ? 'Acheté' : 'Obtenu'} le {formatDate(badge.obtained_at)}
          </p>
        )}
      </div>
    </motion.div>
  )
}

// ─── Pinned slots ─────────────────────────────────────────────────────────────

function PinnedSection({ pinnedIds, badges, onTogglePin }: {
  pinnedIds: string[]
  badges: EnrichedBadge[]
  onTogglePin: (id: string) => void
}) {
  const badgeMap = Object.fromEntries(badges.map(b => [b.badge_id, b]))

  return (
    <div className="flex flex-col gap-2 border-b border-game-border px-4 py-3">
      <div className="flex items-center gap-1.5">
        <PinIcon filled={false} />
        <p className="text-[9px] font-bold uppercase tracking-widest text-neon-violet/50">
          Épinglés leaderboard
        </p>
        <span className={['ml-1 text-[9px] font-black tabular-nums', pinnedIds.length >= 3 ? 'text-neon-violet' : 'text-white/25'].join(' ')}>
          {pinnedIds.length}/3
        </span>
      </div>
      <div className="flex gap-3">
        {Array.from({ length: 3 }).map((_, i) => {
          const id = pinnedIds[i]
          const badge = id ? badgeMap[id] : undefined
          if (!badge) {
            return (
              <div
                key={i}
                className="flex h-16 w-14 items-center justify-center rounded-xl border border-dashed border-white/10 text-lg text-white/10"
              >
                +
              </div>
            )
          }
          return (
            <div key={id} className="relative">
              <div className="flex h-16 w-14 items-center justify-center rounded-xl border border-neon-violet/20 bg-neon-violet/5">
                <MiniBadge achievementId={badge.badge_id} size={38} unlocked />
              </div>
              <button
                onClick={() => onTogglePin(id)}
                className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500/80 text-[8px] font-black text-white hover:bg-red-500"
              >
                ×
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────

interface Props {
  hideBack?: boolean
  onBack?: () => void
}

export default function CollectionPage({ hideBack = false, onBack }: Props) {
  const { user, profile, setLocalFeaturedBadges, triggerAchievementCheck } = useAuth()

  const [badges, setBadges]           = useState<EnrichedBadge[]>([])
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState<string | null>(null)
  const [rarityFilter, setRarityFilter] = useState<RarityFilter>('all')
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all')
  const [featuredBadges, setFeaturedBadges] = useState<string[]>([])
  const [pinSaving, setPinSaving]     = useState(false)

  // Dropdowns mobile
  const [rarityOpen, setRarityOpen]   = useState(false)
  const [sourceOpen, setSourceOpen]   = useState(false)
  const rarityRef                     = useRef<HTMLDivElement>(null)
  const sourceRef                     = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setFeaturedBadges(profile?.featured_badges ?? [])
  }, [profile?.featured_badges])

  // Fermer dropdowns au clic extérieur
  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (rarityRef.current && !rarityRef.current.contains(e.target as Node)) setRarityOpen(false)
      if (sourceRef.current && !sourceRef.current.contains(e.target as Node)) setSourceOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [])

  const load = useCallback(async (userId: string) => {
    setLoading(true)
    setError(null)
    try {
      const raw = await getUserBadges(userId)
      const enriched = raw.map(enrichBadge).filter((b): b is EnrichedBadge => b !== null)
      setBadges(enriched)
    } catch {
      setError('Impossible de charger ta collection.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (user) load(user.id)
  }, [user, load])

  async function handleTogglePin(id: string) {
    if (!user) return
    const already = featuredBadges.includes(id)
    const next = already
      ? featuredBadges.filter(b => b !== id)
      : featuredBadges.length < 3 ? [...featuredBadges, id] : featuredBadges
    if (next === featuredBadges) return

    setFeaturedBadges(next)
    setLocalFeaturedBadges(next)
    if (pinSaving) return
    setPinSaving(true)
    try {
      await updateFeaturedBadges(user.id, next)
      triggerAchievementCheck().catch(console.error)
    } catch {
      setFeaturedBadges(featuredBadges)
      setLocalFeaturedBadges(featuredBadges)
    } finally {
      setPinSaving(false)
    }
  }

  // Filtrage + tri
  const filtered = badges
    .filter(b => rarityFilter === 'all' || b.tier === rarityFilter)
    .filter(b => sourceFilter === 'all' || b.source === sourceFilter)
    .sort((a, b) => TIER_ORDER[a.tier] - TIER_ORDER[b.tier])

  // ── Sidebar (desktop) : rareté + provenance ──────────────────────────────────
  const raritySidebar = (
    <div className="hidden w-36 shrink-0 flex-col gap-0.5 border-r border-game-border p-3 sm:flex">
      <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-white/20">Rareté</p>
      {RARITY_FILTERS.map(f => {
        const count = f.key === 'all' ? badges.length : badges.filter(b => b.tier === f.key).length
        return (
          <button
            key={f.key}
            onClick={() => setRarityFilter(f.key)}
            className={[
              'flex items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs font-medium transition-colors',
              rarityFilter === f.key
                ? 'bg-neon-violet/10 text-neon-violet'
                : 'text-white/35 hover:bg-white/5 hover:text-white/60',
            ].join(' ')}
          >
            <span>{f.label}</span>
            <span className={['tabular-nums text-[10px]', rarityFilter === f.key ? 'text-neon-violet/70' : 'text-white/20'].join(' ')}>
              {count}
            </span>
          </button>
        )
      })}

      <div className="my-2 mx-2 h-px bg-game-border/70" />

      <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-white/20">Provenance</p>
      {SOURCE_FILTERS.filter(f => f.key === 'all' || badges.some(b => b.source === f.key)).map(f => {
        const count = f.key === 'all' ? badges.length : badges.filter(b => b.source === f.key).length
        return (
          <button
            key={f.key}
            onClick={() => setSourceFilter(f.key)}
            className={[
              'flex items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs font-medium transition-colors',
              sourceFilter === f.key
                ? 'bg-neon-violet/10 text-neon-violet'
                : 'text-white/35 hover:bg-white/5 hover:text-white/60',
            ].join(' ')}
          >
            <span>{f.label}</span>
            <span className={['tabular-nums text-[10px]', sourceFilter === f.key ? 'text-neon-violet/70' : 'text-white/20'].join(' ')}>
              {count}
            </span>
          </button>
        )
      })}
    </div>
  )

  // ── Dropdowns mobile ─────────────────────────────────────────────────────────

  function MobileDropdown<T extends string>({ label, value, options, open, setOpen, onChange, dropRef }: {
    label: string
    value: T
    options: { key: T; label: string }[]
    open: boolean
    setOpen: (v: boolean) => void
    onChange: (v: T) => void
    dropRef: React.RefObject<HTMLDivElement | null>
  }) {
    const activeLabel = options.find(f => f.key === value)?.label
    return (
      <div ref={dropRef} className="relative sm:hidden">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className={[
            'flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[10px] font-semibold transition-colors',
            value !== 'all'
              ? 'border-neon-violet/30 bg-neon-violet/10 text-neon-violet'
              : 'border-white/10 bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70',
          ].join(' ')}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/>
          </svg>
          {label}{value !== 'all' && ` · ${activeLabel}`}
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
            className={`transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
          >
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 top-9 z-50 min-w-[160px] overflow-hidden rounded-xl py-1.5"
              style={{ background: 'rgba(19,19,31,0.97)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 8px 32px rgba(0,0,0,0.6)', backdropFilter: 'blur(20px)' }}
            >
              {options.filter(f => {
                if (f.key === 'all') return true
                if (label === 'Rareté') return badges.some(b => b.tier === f.key as AchievementTier)
                return badges.some(b => b.source === f.key as BadgeSource)
              }).map(f => {
                const count = label === 'Rareté'
                  ? (f.key === 'all' ? badges.length : badges.filter(b => b.tier === f.key as AchievementTier).length)
                  : (f.key === 'all' ? badges.length : badges.filter(b => b.source === f.key as BadgeSource).length)
                return (
                  <button key={f.key} type="button" onClick={() => { onChange(f.key); setOpen(false) }}
                    className={['flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition-colors', value === f.key ? 'bg-neon-violet/10 font-semibold text-neon-violet' : 'font-medium text-white/70 hover:bg-white/5 hover:text-white'].join(' ')}
                  >
                    <span>{f.label}</span>
                    <span className={`tabular-nums text-[11px] ${value === f.key ? 'text-neon-violet/70' : 'text-white/25'}`}>{count}</span>
                  </button>
                )
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="flex min-h-screen flex-col bg-game-bg"
    >
      {/* Header navigation (standalone) */}
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
            <p className="text-sm text-white/40">Collection</p>
          </div>
          <div className="w-20" />
        </div>
      )}

      {/* Hero */}
      {hideBack && (
        <div className="relative overflow-hidden px-6 py-7 bg-gradient-to-br from-game-border/20 via-game-card/30 to-transparent">
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/[0.03] blur-3xl" />
          <div className="relative flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-neon-violet/20 bg-neon-violet/10 text-neon-violet/60">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
              </svg>
            </div>
            <div>
              <p className="text-lg font-bold text-white">Collection</p>
              <p className="mt-0.5 text-xs text-white/35">
                {badges.length} badge{badges.length !== 1 ? 's' : ''} possédé{badges.length !== 1 ? 's' : ''}
                {featuredBadges.length > 0 && ` · ${featuredBadges.length} épinglé${featuredBadges.length > 1 ? 's' : ''}`}
              </p>
            </div>
            {pinSaving && (
              <div className="ml-auto h-3.5 w-3.5 animate-spin rounded-full border border-neon-violet/30 border-t-neon-violet/70" />
            )}
          </div>
        </div>
      )}

      {/* Body */}
      {!user ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-4 text-center">
          <div className="text-4xl">✦</div>
          <p className="text-sm font-semibold text-white/60">Connecte-toi pour voir ta collection</p>
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar rareté — desktop uniquement */}
          {raritySidebar}

          {/* Zone principale */}
          <div className="flex flex-1 flex-col overflow-hidden">

            {/* Filtres mobile uniquement (< sm) */}
            <div className="flex items-center gap-2 border-b border-game-border px-4 py-2.5 sm:hidden">
              <MobileDropdown
                label="Rareté"
                value={rarityFilter}
                options={RARITY_FILTERS}
                open={rarityOpen}
                setOpen={setRarityOpen}
                onChange={setRarityFilter}
                dropRef={rarityRef}
              />
              <MobileDropdown
                label="Provenance"
                value={sourceFilter}
                options={SOURCE_FILTERS}
                open={sourceOpen}
                setOpen={setSourceOpen}
                onChange={setSourceFilter}
                dropRef={sourceRef}
              />
            </div>

            {/* Slots épinglés */}
            {badges.length > 0 && (
              <PinnedSection
                pinnedIds={featuredBadges}
                badges={badges}
                onTogglePin={handleTogglePin}
              />
            )}

            {/* Grille */}
            <div className="flex-1 overflow-y-auto p-4">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-neon-violet/30 border-t-neon-violet" />
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
                  <p className="text-sm text-white/40">{error}</p>
                  <button onClick={() => user && load(user.id)} className="text-xs text-neon-violet/60 underline">
                    Réessayer
                  </button>
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
                  <p className="text-sm text-white/30">Aucun badge pour ce filtre</p>
                </div>
              ) : (
                <motion.div
                  layout
                  className="grid grid-cols-2 gap-3 sm:grid-cols-3"
                >
                  <AnimatePresence mode="popLayout">
                    {filtered.map(badge => (
                      <BadgeCard
                        key={badge.badge_id}
                        badge={badge}
                        isPinned={featuredBadges.includes(badge.badge_id)}
                        canPin={featuredBadges.length < 3}
                        onTogglePin={handleTogglePin}
                      />
                    ))}
                  </AnimatePresence>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}
