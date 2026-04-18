import { motion } from 'framer-motion'
import type { AchievementTier, CosmeticType, ShopItem } from '../../types/quiz'
import { CosmeticPreview } from '../inventory/previews'
import { getBadgeMeta } from '../../constants/cosmetics/registry'
import { TYPE_ICON } from './icons'

const TIER_LABEL: Record<AchievementTier, string> = {
  common:    'Commun',
  rare:      'Rare',
  epic:      'Épique',
  legendary: 'Légendaire',
}

const TIER_DOT_COLOR: Record<AchievementTier, string> = {
  legendary: '#f59e0b',
  epic:      '#a78bfa',
  rare:      '#60a5fa',
  common:    'rgba(255,255,255,0.30)',
}

const TIER_BADGE_BG: Record<AchievementTier, string> = {
  legendary: 'linear-gradient(180deg, rgba(245,158,11,0.55), rgba(245,158,11,0.1))',
  epic:      'linear-gradient(180deg, rgba(167,139,250,0.55), rgba(167,139,250,0.1))',
  rare:      'linear-gradient(180deg, rgba(96,165,250,0.5), rgba(96,165,250,0.08))',
  common:    'linear-gradient(180deg, rgba(255,255,255,0.2), rgba(255,255,255,0.05))',
}

const TIER_BADGE_GLOW: Record<AchievementTier, string> = {
  legendary: 'drop-shadow(0 0 6px rgba(245,158,11,0.45))',
  epic:      'drop-shadow(0 0 6px rgba(167,139,250,0.4))',
  rare:      'drop-shadow(0 0 5px rgba(96,165,250,0.3))',
  common:    'none',
}

const TYPE_LABEL_FR: Record<string, string> = {
  badge:            'Badge',
  emblem:           'Blason',
  title:            'Titre',
  card_design:      'Carte',
  background:       'Fond',
  screen_animation: 'Animation',
}

function formatFr(n: number): string {
  return n.toLocaleString('fr-FR').replace(/\s/g, '\u00A0')
}

interface Props {
  item:    ShopItem
  owned:   boolean
  balance: number
  onClick: (item: ShopItem) => void
  index?:  number
}

export default function ShopItemCard({ item, owned, balance, onClick, index = 0 }: Props) {
  const unaffordable = !owned && balance < item.price
  const disabled = owned || unaffordable

  const tierColor = TIER_DOT_COLOR[item.tier]

  const borderColor = owned ? 'rgba(34,197,94,0.4)' : '#1E1E2E'
  const bgColor     = owned ? 'linear-gradient(180deg, rgba(34,197,94,0.04), #13131F)' : '#13131F'

  return (
    <motion.button
      type="button"
      onClick={() => !disabled && onClick(item)}
      disabled={disabled}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index, 20) * 0.02 }}
      whileHover={disabled ? undefined : { y: -1 }}
      className="group relative flex min-h-[208px] flex-col items-center gap-1.5 rounded-xl border p-2.5 pt-2.5 text-center transition-colors focus:outline-none"
      style={{
        borderColor,
        background: bgColor,
        opacity: unaffordable ? 0.55 : 1,
        cursor:   disabled ? 'default' : 'pointer',
      }}
    >
      {/* Tier pill top-left */}
      <div className="absolute left-2 top-2 flex items-center gap-1 opacity-55" aria-hidden>
        <span className="h-[5px] w-[5px] rounded-full" style={{ background: tierColor }} />
        <span className="text-[8px] font-medium uppercase tracking-[0.08em] text-white/55">
          {TIER_LABEL[item.tier]}
        </span>
      </div>

      {/* Type icon top-right */}
      <div
        className="absolute right-2 top-2 flex h-[18px] w-[18px] items-center justify-center rounded-md text-white/35"
        style={{ background: 'rgba(255,255,255,0.04)' }}
        title={TYPE_LABEL_FR[item.item_type] ?? item.item_type}
      >
        {TYPE_ICON(item.item_type, 10)}
      </div>

      {/* Badge corner (Nouveau / Limité) */}
      {(item.is_new || item.is_limited) && (
        <div
          className="absolute right-2 top-8 rounded-full px-1.5 py-[2px] text-[7px] font-extrabold uppercase tracking-[0.08em]"
          style={
            item.is_limited
              ? { background: 'rgba(236,72,153,0.14)', border: '1px solid rgba(236,72,153,0.4)', color: '#fbcfe8' }
              : { background: 'rgba(139,92,246,0.14)', border: '1px solid rgba(139,92,246,0.4)', color: '#c4b5fd' }
          }
        >
          {item.is_limited ? '✦ Limité' : 'Nouveau'}
        </div>
      )}

      {/* Preview */}
      <div
        className="mt-4 flex h-[60px] items-center justify-center"
        style={{ filter: unaffordable ? 'saturate(0.6)' : undefined }}
      >
        {item.item_type === 'badge'
          ? <BadgePreview itemId={item.item_id} tier={item.tier} />
          : <CosmeticPreview type={item.item_type as CosmeticType} id={item.item_id} size="md" />}
      </div>

      {/* Name */}
      <p className="mt-0.5 line-clamp-2 w-full break-words px-0.5 text-[11px] font-bold leading-tight text-white">
        {item.name}
      </p>

      {/* Price */}
      <div
        className="flex items-center justify-center gap-1 text-[12px] font-extrabold tabular-nums text-white"
        style={{
          opacity: owned ? 0.45 : 1,
          textDecoration: owned ? 'line-through' : 'none',
        }}
      >
        <span className="text-[11px] text-cyan-400">◈</span>
        {formatFr(item.price)}
      </div>

      {/* CTA */}
      <div className="mt-auto w-full pt-1">
        {owned ? (
          <div
            className="flex w-full items-center justify-center gap-1 rounded-lg px-2.5 py-[7px] text-[10px] font-bold"
            style={{
              background: 'rgba(34,197,94,0.08)',
              border:     '1px solid rgba(34,197,94,0.3)',
              color:      'rgba(34,197,94,0.9)',
            }}
          >
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            Possédé
          </div>
        ) : unaffordable ? (
          <div
            className="flex w-full items-center justify-center gap-1 rounded-lg px-2.5 py-[7px] text-[10px] font-bold"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border:     '1px solid rgba(255,255,255,0.1)',
              color:      'rgba(255,255,255,0.35)',
            }}
          >
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
            </svg>
            Pas assez
          </div>
        ) : (
          <div
            className="flex w-full items-center justify-center gap-1 rounded-lg px-2.5 py-[7px] text-[10px] font-bold transition-colors"
            style={{
              background: 'rgba(34,211,238,0.10)',
              border:     '1px solid rgba(34,211,238,0.35)',
              color:      '#67e8f9',
            }}
          >
            Acheter
          </div>
        )}
      </div>
    </motion.button>
  )
}

// ─── Badge hex preview (for shop badges) ──────────────────────────────────────

function BadgePreview({ itemId, tier }: { itemId: string; tier: AchievementTier }) {
  const meta = getBadgeMeta(itemId)
  const icon = meta?.icon ?? '✦'
  return (
    <div
      className="flex items-center justify-center"
      style={{
        width:     48,
        height:    54,
        clipPath:  'polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)',
        background: TIER_BADGE_BG[tier],
        filter:     TIER_BADGE_GLOW[tier],
        fontSize:   20,
      }}
      aria-hidden
    >
      <span>{icon}</span>
    </div>
  )
}
