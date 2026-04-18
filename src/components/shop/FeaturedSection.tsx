import { motion } from 'framer-motion'
import type { AchievementTier, CosmeticType, ShopItem } from '../../types/quiz'
import { CosmeticPreview } from '../inventory/previews'
import { getBadgeMeta } from '../../constants/cosmetics/registry'

const TIER_FRAME: Record<AchievementTier, { bg: string; border: string; shadow: string }> = {
  legendary: {
    bg:     'linear-gradient(180deg, rgba(245,158,11,0.14), rgba(19,19,31,0.6))',
    border: 'rgba(245,158,11,0.35)',
    shadow: '0 0 20px rgba(245,158,11,0.1) inset',
  },
  epic: {
    bg:     'linear-gradient(180deg, rgba(167,139,250,0.12), rgba(19,19,31,0.6))',
    border: 'rgba(167,139,250,0.3)',
    shadow: '0 0 20px rgba(167,139,250,0.08) inset',
  },
  rare: {
    bg:     'linear-gradient(180deg, rgba(96,165,250,0.12), rgba(19,19,31,0.6))',
    border: 'rgba(96,165,250,0.28)',
    shadow: '0 0 18px rgba(96,165,250,0.07) inset',
  },
  common: {
    bg:     'linear-gradient(180deg, rgba(255,255,255,0.05), rgba(19,19,31,0.6))',
    border: 'rgba(255,255,255,0.12)',
    shadow: 'none',
  },
}

const TIER_LABEL: Record<AchievementTier, string> = {
  common:    'Commun',
  rare:      'Rare',
  epic:      'Épique',
  legendary: 'Légendaire',
}

const TIER_BADGE_BG: Record<AchievementTier, string> = {
  legendary: 'linear-gradient(180deg, rgba(245,158,11,0.55), rgba(245,158,11,0.1))',
  epic:      'linear-gradient(180deg, rgba(167,139,250,0.55), rgba(167,139,250,0.1))',
  rare:      'linear-gradient(180deg, rgba(96,165,250,0.5), rgba(96,165,250,0.08))',
  common:    'linear-gradient(180deg, rgba(255,255,255,0.2), rgba(255,255,255,0.05))',
}

function formatFr(n: number): string {
  return n.toLocaleString('fr-FR').replace(/\s/g, '\u00A0')
}

interface Props {
  items:   ShopItem[]
  onOpenItem: (item: ShopItem) => void
}

export default function FeaturedSection({ items, onOpenItem }: Props) {
  if (items.length === 0) return null

  return (
    <div className="border-b border-game-border bg-black/[0.25] px-5 py-5">
      <div className="mb-3.5 flex items-center gap-2">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{ color: 'rgba(234,179,8,0.7)' }}>
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
        <span
          className="text-[9px] font-bold uppercase tracking-[0.16em]"
          style={{ color: 'rgba(234,179,8,0.65)' }}
        >
          Nouveautés
        </span>
        <span className="ml-1 text-[10px] text-white/[0.28]">Objets mis en avant cette semaine</span>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.slice(0, 3).map((item, i) => (
          <FeaturedCard key={item.id} item={item} onOpenItem={onOpenItem} index={i} />
        ))}
      </div>
    </div>
  )
}

function FeaturedCard({ item, onOpenItem, index }: { item: ShopItem; onOpenItem: (item: ShopItem) => void; index: number }) {
  const frame = TIER_FRAME[item.tier]
  return (
    <motion.button
      type="button"
      onClick={() => onOpenItem(item)}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.05 + index * 0.05 }}
      whileHover={{ y: -2 }}
      className="group relative flex min-h-[180px] flex-col overflow-hidden rounded-2xl p-3.5 text-left focus:outline-none"
      style={{
        background: frame.bg,
        border:     `1px solid ${frame.border}`,
        boxShadow:  frame.shadow,
      }}
    >
      {/* Tag */}
      <div
        className="absolute left-2.5 top-2.5 rounded-full px-2 py-[3px] text-[8px] font-extrabold uppercase tracking-[0.12em]"
        style={
          item.is_limited
            ? { background: 'rgba(236,72,153,0.15)', border: '1px solid rgba(236,72,153,0.35)', color: '#fbcfe8' }
            : { background: 'rgba(234,179,8,0.15)', border: '1px solid rgba(234,179,8,0.35)', color: '#fde68a' }
        }
      >
        {item.is_limited ? '✦ Édition limitée' : 'Nouveau'}
      </div>

      {/* Tier label */}
      <div className="absolute right-2.5 top-2.5 text-[8px] font-semibold uppercase tracking-[0.08em] text-white/55">
        {TIER_LABEL[item.tier]}
      </div>

      {/* Preview */}
      <div className="my-3 flex flex-1 items-center justify-center">
        {item.item_type === 'badge'
          ? <FeaturedBadgePreview itemId={item.item_id} tier={item.tier} />
          : <CosmeticPreview type={item.item_type as CosmeticType} id={item.item_id} size="lg" />}
      </div>

      {/* Name + description */}
      <p className="line-clamp-2 break-words text-[13px] font-extrabold text-white">{item.name}</p>
      {item.description && (
        <p className="mb-2.5 mt-0.5 line-clamp-2 text-[10px] leading-snug text-white/45">
          {item.description}
        </p>
      )}

      {/* Footer */}
      <div className="mt-auto flex items-center justify-between">
        <div className="flex items-center gap-1 text-[13px] font-extrabold tabular-nums text-white">
          <span className="text-[12px] text-cyan-400">◈</span>
          {formatFr(item.price)}
        </div>
        <span
          className="rounded-lg px-3 py-1.5 text-[10px] font-bold transition-colors"
          style={{
            background: 'rgba(234,179,8,0.15)',
            border:     '1px solid rgba(234,179,8,0.35)',
            color:      '#fde68a',
          }}
        >
          Voir
        </span>
      </div>
    </motion.button>
  )
}

function FeaturedBadgePreview({ itemId, tier }: { itemId: string; tier: AchievementTier }) {
  const meta = getBadgeMeta(itemId)
  const icon = meta?.icon ?? '✦'
  return (
    <div
      className="flex items-center justify-center"
      style={{
        width:     64,
        height:    72,
        clipPath:  'polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)',
        background: TIER_BADGE_BG[tier],
        fontSize:   28,
      }}
      aria-hidden
    >
      <span>{icon}</span>
    </div>
  )
}
