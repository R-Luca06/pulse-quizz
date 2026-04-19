import { motion } from 'framer-motion'
import type { CosmeticType, ShopBundle } from '../../types/quiz'
import { CosmeticPreview } from '../inventory/previews'
import MiniBadge from '../shared/MiniBadge'

function formatFr(n: number): string {
  return n.toLocaleString('fr-FR').replace(/\s/g, '\u00A0')
}

interface Props {
  bundle:       ShopBundle
  ownedCount:   number
  totalCount:   number
  onOpen:       (bundle: ShopBundle) => void
  index?:       number
}

export default function BundleCard({ bundle, ownedCount, totalCount, onOpen, index = 0 }: Props) {
  const unitTotal  = bundle.items.reduce((s, it) => s + it.price, 0)
  const hasDiscount = unitTotal > bundle.price
  const discountPct = hasDiscount ? Math.round(((unitTotal - bundle.price) / unitTotal) * 100) : 0
  const isComplete  = totalCount > 0 && ownedCount >= totalCount

  return (
    <motion.button
      type="button"
      onClick={() => onOpen(bundle)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.05 * index, ease: 'easeOut' }}
      whileHover={{ y: -2 }}
      className="group relative flex w-full items-center gap-4 overflow-hidden rounded-2xl p-3 text-left focus:outline-none"
      style={{
        background: 'linear-gradient(180deg, rgba(245,158,11,0.08), rgba(19,19,31,0.7))',
        border:     '1px solid rgba(245,158,11,0.3)',
        boxShadow:  '0 0 20px rgba(245,158,11,0.06) inset, 0 6px 18px rgba(0,0,0,0.3)',
      }}
    >
      {/* Left — mini-previews grid (2 rows × 4 cols, fixed size) */}
      <div className="grid shrink-0 grid-cols-4 gap-1.5" style={{ width: 184 }}>
        {bundle.items.map(it => (
          <div
            key={it.id}
            className="flex h-[40px] w-[40px] items-center justify-center overflow-hidden rounded-md"
            style={{
              background: 'rgba(10,10,18,0.55)',
              border:     '1px solid rgba(255,255,255,0.06)',
            }}
          >
            {it.item_type === 'badge'
              ? <MiniBadge achievementId={it.item_id} size={22} />
              : <CosmeticPreview type={it.item_type as CosmeticType} id={it.item_id} size="sm" />}
          </div>
        ))}
      </div>

      {/* Right — metadata + CTA */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top row: tags */}
        <div className="flex items-center gap-1.5">
          <span
            className="rounded-full px-1.5 py-[2px] text-[8px] font-extrabold uppercase tracking-[0.14em]"
            style={{
              background: 'rgba(245,158,11,0.15)',
              border:     '1px solid rgba(245,158,11,0.4)',
              color:      '#fde68a',
            }}
          >
            ✦ Pack
          </span>
          {(bundle.is_limited || bundle.is_new) && (
            <span
              className="rounded-full px-1.5 py-[2px] text-[8px] font-extrabold uppercase tracking-[0.12em]"
              style={
                bundle.is_limited
                  ? { background: 'rgba(236,72,153,0.15)', border: '1px solid rgba(236,72,153,0.4)', color: '#fbcfe8' }
                  : { background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.4)', color: '#c4b5fd' }
              }
            >
              {bundle.is_limited ? '✦ Limité' : 'Nouveau'}
            </span>
          )}
        </div>

        {/* Name */}
        <p className="mt-1 truncate text-[14px] font-extrabold leading-tight text-white" style={{ letterSpacing: '-0.01em' }}>
          {bundle.name}
        </p>
        {bundle.description && (
          <p className="mt-0.5 line-clamp-1 text-[11px] leading-snug text-white/50">
            {bundle.description}
          </p>
        )}

        {/* Footer: price + CTA */}
        <div className="mt-2 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-baseline gap-1.5">
            <div className="flex items-baseline gap-1 text-[15px] font-extrabold tabular-nums text-white">
              <span className="text-[12px] text-cyan-400">◈</span>
              {formatFr(bundle.price)}
            </div>
            {hasDiscount && (
              <>
                <span className="text-[10px] font-semibold tabular-nums text-white/35 line-through">
                  ◈&nbsp;{formatFr(unitTotal)}
                </span>
                <span
                  className="rounded-full px-1 py-[1px] text-[8px] font-extrabold"
                  style={{
                    background: 'rgba(34,197,94,0.15)',
                    border:     '1px solid rgba(34,197,94,0.35)',
                    color:      '#4ade80',
                  }}
                >
                  −{discountPct}%
                </span>
              </>
            )}
          </div>

          <div
            className="flex shrink-0 items-center justify-center gap-1 rounded-lg px-2.5 py-1.5 text-[10px] font-bold"
            style={
              isComplete
                ? {
                    background: 'rgba(34,197,94,0.12)',
                    border:     '1px solid rgba(34,197,94,0.4)',
                    color:      '#4ade80',
                  }
                : {
                    background: 'linear-gradient(180deg, rgba(245,158,11,0.22), rgba(245,158,11,0.1))',
                    border:     '1px solid rgba(245,158,11,0.45)',
                    color:      '#fde68a',
                    boxShadow:  '0 0 12px rgba(245,158,11,0.16)',
                  }
            }
          >
            {isComplete ? (
              <>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Complet
              </>
            ) : (
              <>Voir le pack</>
            )}
          </div>
        </div>

        {ownedCount > 0 && !isComplete && (
          <div className="mt-1 text-[9px] font-semibold text-white/40">
            {ownedCount}/{totalCount} pièces déjà possédées
          </div>
        )}
      </div>
    </motion.button>
  )
}
