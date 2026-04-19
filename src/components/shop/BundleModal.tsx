import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { AchievementTier, BundlePurchaseResult, CosmeticType, ShopBundle, ShopItem } from '../../types/quiz'
import { AppError } from '../../services/errors'
import { purchaseBundle } from '../../services/shop'
import { equipCosmetic } from '../../services/inventory'
import { updateFeaturedBadges } from '../../services/profile'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../contexts/ToastContext'
import { trackBundlePurchased, trackBundleViewed } from '../../services/analytics'
import { CosmeticPreview } from '../inventory/previews'
import MiniBadge from '../shared/MiniBadge'

const TIER_LABEL: Record<AchievementTier, string> = {
  legendary: 'Légendaire',
  epic:      'Épique',
  rare:      'Rare',
  common:    'Commun',
}

const TIER_ACCENT: Record<AchievementTier, { pill: string; border: string; text: string; dot: string; sparkle: string }> = {
  legendary: { pill: 'rgba(245,158,11,0.14)', border: 'rgba(245,158,11,0.35)', text: '#fde68a', dot: '#f59e0b', sparkle: 'rgba(245,158,11,0.15)' },
  epic:      { pill: 'rgba(167,139,250,0.14)', border: 'rgba(167,139,250,0.35)', text: '#ddd6fe', dot: '#a78bfa', sparkle: 'rgba(167,139,250,0.12)' },
  rare:      { pill: 'rgba(96,165,250,0.14)',  border: 'rgba(96,165,250,0.35)',  text: '#bfdbfe', dot: '#60a5fa', sparkle: 'rgba(96,165,250,0.12)' },
  common:    { pill: 'rgba(255,255,255,0.08)', border: 'rgba(255,255,255,0.18)', text: 'rgba(255,255,255,0.75)', dot: 'rgba(255,255,255,0.35)', sparkle: 'rgba(255,255,255,0.06)' },
}

function formatFr(n: number): string {
  return n.toLocaleString('fr-FR').replace(/\s/g, '\u00A0')
}

type ModalState = 'detail' | 'loading' | 'success'

interface Props {
  bundle:           ShopBundle | null
  ownedIds:         Set<string>                              // keys `${item_type}::${item_id}`
  balance:          number
  onClose:          () => void
  onPurchased:      (result: BundlePurchaseResult) => void
  onGoToInventory?: () => void
}

export default function BundleModal({ bundle, ownedIds, balance, onClose, onPurchased, onGoToInventory }: Props) {
  const { user, bumpPulses, refreshStats, refreshInventory, setLocalEquipped, setLocalFeaturedBadges, refreshProfile } = useAuth()
  const toast = useToast()

  const [state, setState] = useState<ModalState>('detail')
  const [oldBalance, setOldBalance] = useState<number>(balance)
  const [newBalance, setNewBalance] = useState<number>(balance)
  const [itemsAdded, setItemsAdded] = useState<number>(0)

  const modalRef = useRef<HTMLDivElement>(null)
  const viewedRef = useRef<string | null>(null)

  useEffect(() => {
    if (!bundle) {
      viewedRef.current = null
      return
    }
    setState('detail')
    setOldBalance(balance)
    setNewBalance(balance)
    setItemsAdded(0)
    if (viewedRef.current !== bundle.id) {
      trackBundleViewed(bundle)
      viewedRef.current = bundle.id
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bundle?.id])

  useEffect(() => {
    if (!bundle) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [bundle])

  useEffect(() => {
    if (!bundle) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (state === 'loading') return
        e.preventDefault()
        onClose()
      }
      if (e.key === 'Tab' && modalRef.current) {
        const focusables = modalRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        )
        if (focusables.length === 0) return
        const first = focusables[0]
        const last  = focusables[focusables.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [bundle, state, onClose])

  const ownedCount = useMemo(() => {
    if (!bundle) return 0
    return bundle.items.reduce((c, it) => c + (ownedIds.has(`${it.item_type}::${it.item_id}`) ? 1 : 0), 0)
  }, [bundle, ownedIds])

  const unitTotal = useMemo(() => (bundle?.items.reduce((s, it) => s + it.price, 0) ?? 0), [bundle])

  if (!bundle) return null

  const accent       = TIER_ACCENT[bundle.tier]
  const totalCount   = bundle.items.length
  const isComplete   = ownedCount >= totalCount
  const unaffordable = !isComplete && balance < bundle.price
  const savings      = Math.max(0, unitTotal - bundle.price)
  const discountPct  = unitTotal > 0 ? Math.round((savings / unitTotal) * 100) : 0

  async function handleConfirm() {
    if (!bundle || state !== 'detail' || isComplete || unaffordable) return
    setState('loading')
    const snapshotOld = balance
    try {
      const result = await purchaseBundle(bundle.id)
      bumpPulses(-bundle.price)
      setOldBalance(snapshotOld)
      setNewBalance(result.balance)
      setItemsAdded(result.items_added)
      trackBundlePurchased(bundle, result.balance)
      onPurchased(result)
      setState('success')
      refreshInventory().catch(() => {})
      refreshStats()
    } catch (err) {
      const message = err instanceof AppError ? mapErrorMessage(err.code) : 'Une erreur est survenue'
      toast.error(message)
      setState('detail')
    }
  }

  async function handleEquipSet() {
    if (!user || !bundle) return
    const cosmeticSlots = bundle.items.filter(it => it.item_type !== 'badge')
    const bundleBadgeIds = bundle.items.filter(it => it.item_type === 'badge').map(it => it.item_id)
    // Cap at 3 (featured_badges max) and take the first N from the bundle.
    const featured = bundleBadgeIds.slice(0, 3)

    // Optimistic update — cosmetics + featured badges.
    for (const it of cosmeticSlots) {
      setLocalEquipped(it.item_type as CosmeticType, it.item_id)
    }
    if (featured.length > 0) setLocalFeaturedBadges(featured)

    try {
      await Promise.all([
        ...cosmeticSlots.map(it => equipCosmetic(user.id, it.item_type as CosmeticType, it.item_id)),
        ...(featured.length > 0 ? [updateFeaturedBadges(user.id, featured)] : []),
      ])
      toast.success('Set équipé')
      onClose()
      refreshProfile().catch(() => {})
      refreshStats()
    } catch {
      toast.error("Impossible d'équiper le set")
      refreshProfile().catch(() => {})
    }
  }

  function handleBackdrop(e: React.MouseEvent) {
    if (state === 'loading') return
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <AnimatePresence>
      <motion.div
        key="bundle-modal-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        onClick={handleBackdrop}
        className="fixed inset-0 z-50 flex items-center justify-center px-4"
        style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)' }}
      >
        <motion.div
          ref={modalRef}
          key="bundle-modal"
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          role="dialog"
          aria-modal="true"
          aria-label={state === 'success' ? 'Pack débloqué' : 'Détail du pack'}
          className="relative max-h-[92vh] w-full max-w-[520px] overflow-y-auto rounded-2xl border"
          style={{
            borderColor: state === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(245,158,11,0.3)',
            background:  'linear-gradient(180deg, #14141f, #0d0d14)',
            boxShadow:   state === 'success'
              ? '0 20px 60px rgba(0,0,0,0.6), 0 0 40px rgba(34,197,94,0.12)'
              : '0 20px 60px rgba(0,0,0,0.6), 0 0 40px rgba(245,158,11,0.1)',
          }}
        >
          {state === 'success'
            ? (
                <SuccessView
                  bundle={bundle}
                  oldBalance={oldBalance}
                  newBalance={newBalance}
                  itemsAdded={itemsAdded}
                  accent={accent}
                  onClose={onClose}
                  onGoToInventory={onGoToInventory}
                  onEquipSet={handleEquipSet}
                />
              )
            : (
                <DetailView
                  bundle={bundle}
                  ownedIds={ownedIds}
                  ownedCount={ownedCount}
                  totalCount={totalCount}
                  unitTotal={unitTotal}
                  savings={savings}
                  discountPct={discountPct}
                  balance={balance}
                  accent={accent}
                  isComplete={isComplete}
                  unaffordable={unaffordable}
                  loading={state === 'loading'}
                  onClose={onClose}
                  onConfirm={handleConfirm}
                />
              )
          }
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// ─── Detail view ──────────────────────────────────────────────────────────────

interface DetailViewProps {
  bundle:       ShopBundle
  ownedIds:     Set<string>
  ownedCount:   number
  totalCount:   number
  unitTotal:    number
  savings:      number
  discountPct:  number
  balance:      number
  accent:       (typeof TIER_ACCENT)[AchievementTier]
  isComplete:   boolean
  unaffordable: boolean
  loading:      boolean
  onClose:      () => void
  onConfirm:    () => void
}

function DetailView({
  bundle, ownedIds, ownedCount, totalCount, unitTotal, savings, discountPct,
  balance, accent, isComplete, unaffordable, loading, onClose, onConfirm,
}: DetailViewProps) {
  const balanceAfter = Math.max(0, balance - bundle.price)
  return (
    <>
      <header
        className="flex items-center justify-between border-b px-4 py-3"
        style={{ borderColor: '#1E1E2E' }}
      >
        <div className="flex items-center gap-2">
          <span
            className="rounded-full px-2 py-[3px] text-[9px] font-extrabold uppercase tracking-[0.14em]"
            style={{
              background: 'rgba(245,158,11,0.15)',
              border:     '1px solid rgba(245,158,11,0.4)',
              color:      '#fde68a',
            }}
          >
            ✦ Pack
          </span>
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2 py-[3px] text-[9px] font-extrabold uppercase tracking-[0.14em]"
            style={{ background: accent.pill, border: `1px solid ${accent.border}`, color: accent.text }}
          >
            <span className="h-[4px] w-[4px] rounded-full" style={{ background: accent.dot }} />
            {TIER_LABEL[bundle.tier]}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className="flex h-6 w-6 items-center justify-center rounded-md text-white/40 transition-colors hover:bg-white/5 hover:text-white"
        >
          <CloseIcon />
        </button>
      </header>

      <div
        className="relative overflow-hidden px-5 pb-5 pt-6"
        style={{
          background:   `radial-gradient(circle at 50% 30%, ${accent.sparkle}, transparent 70%)`,
          borderBottom: '1px solid #1E1E2E',
        }}
      >
        <Sparkles />
        <h2 className="relative z-[2] text-[22px] font-extrabold leading-tight text-white" style={{ letterSpacing: '-0.01em' }}>
          {bundle.name}
        </h2>
        {bundle.description && (
          <p className="relative z-[2] mt-1 text-[12px] leading-[1.55] text-white/55">
            {bundle.description}
          </p>
        )}

        <div className="relative z-[2] mt-4 grid grid-cols-4 gap-2">
          {bundle.items.map(it => {
            const isOwned = ownedIds.has(`${it.item_type}::${it.item_id}`)
            return <BundleItemTile key={it.id} item={it} owned={isOwned} />
          })}
        </div>
      </div>

      {ownedCount > 0 && !isComplete && (
        <div
          className="mx-5 mt-4 rounded-[10px] border px-3.5 py-2.5 text-[11px] leading-snug"
          style={{
            background:  'rgba(245,158,11,0.08)',
            borderColor: 'rgba(245,158,11,0.3)',
            color:       '#fde68a',
          }}
        >
          Tu possèdes déjà <b>{ownedCount}/{totalCount}</b> pièces. L'achat du pack te donnera les {totalCount - ownedCount} pièces manquantes, pour le prix plein du pack.
        </div>
      )}

      <div className="px-5 py-3.5" style={{ background: 'rgba(34,211,238,0.03)' }}>
        <PriceRow label="Prix à l'unité" amount={unitTotal} variant="struck" />
        <PriceRow label="Prix du pack" amount={bundle.price} />
        {savings > 0 && (
          <div className="flex items-center justify-between py-1.5 text-[12px]">
            <span className="text-white/55">Économie</span>
            <span
              className="inline-flex items-center gap-1.5 tabular-nums"
              style={{ color: '#4ade80', fontWeight: 700 }}
            >
              −◈&nbsp;{formatFr(savings)}
              <span
                className="rounded-full px-1.5 py-[1px] text-[9px] font-extrabold"
                style={{
                  background: 'rgba(34,197,94,0.15)',
                  border:     '1px solid rgba(34,197,94,0.35)',
                  color:      '#4ade80',
                }}
              >
                −{discountPct}%
              </span>
            </span>
          </div>
        )}
        <PriceRow label="Solde actuel" amount={balance} subtle />
        <PriceRow label="Solde après achat" amount={balanceAfter} variant="after" />
      </div>

      <div className="flex gap-2.5 px-5 pb-5 pt-3.5">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="flex-[0_0_120px] rounded-[10px] border px-4 py-3 text-[12px] font-bold text-white/60 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.1)' }}
        >
          Annuler
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading || isComplete || unaffordable}
          className="flex flex-1 items-center justify-center gap-2 rounded-[10px] border px-4 py-3 text-[12px] font-bold tracking-[0.04em] transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            background:  'linear-gradient(180deg, rgba(245,158,11,0.25), rgba(245,158,11,0.1))',
            borderColor: 'rgba(245,158,11,0.5)',
            color:       '#fde68a',
            boxShadow:   '0 0 18px rgba(245,158,11,0.18)',
          }}
        >
          {loading
            ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#fde68a] border-t-transparent" />
            : <>
                <ShopBagIcon />
                {isComplete
                  ? 'Pack complet'
                  : unaffordable
                    ? 'Solde insuffisant'
                    : <>
                        <span>Acheter le pack —</span>
                        <span className="inline-flex items-center gap-1 tabular-nums">
                          <span className="text-[13px] text-cyan-400">◈</span>
                          <span className="text-white">{formatFr(bundle.price)}</span>
                        </span>
                      </>}
              </>}
        </button>
      </div>
    </>
  )
}

// ─── Success view ─────────────────────────────────────────────────────────────

interface SuccessViewProps {
  bundle:          ShopBundle
  oldBalance:      number
  newBalance:      number
  itemsAdded:      number
  accent:          (typeof TIER_ACCENT)[AchievementTier]
  onClose:         () => void
  onGoToInventory?: () => void
  onEquipSet:      () => void
}

function SuccessView({ bundle, oldBalance, newBalance, itemsAdded, accent, onClose, onGoToInventory, onEquipSet }: SuccessViewProps) {
  const hasCosmetics = bundle.items.some(it => it.item_type !== 'badge')
  const hasBadges    = bundle.items.some(it => it.item_type === 'badge')
  const canEquip     = hasCosmetics || hasBadges
  return (
    <>
      <header
        className="flex items-center justify-between border-b px-4 py-3"
        style={{ borderColor: '#1E1E2E' }}
      >
        <span
          className="text-[10px] font-bold uppercase tracking-[0.14em]"
          style={{ color: 'rgba(34,197,94,0.75)' }}
        >
          ✓ Pack débloqué !
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className="flex h-6 w-6 items-center justify-center rounded-md text-white/40 transition-colors hover:bg-white/5 hover:text-white"
        >
          <CloseIcon />
        </button>
      </header>

      <div
        className="relative flex flex-col items-center border-b px-5 pb-5 pt-8"
        style={{
          borderColor: '#1E1E2E',
          background:  'radial-gradient(circle at 50% 40%, rgba(34,197,94,0.15), transparent 65%)',
        }}
      >
        <motion.div
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.05 }}
          className="mb-3 flex h-[60px] w-[60px] items-center justify-center rounded-full"
          style={{
            background: 'linear-gradient(180deg, rgba(34,197,94,0.3), rgba(34,197,94,0.1))',
            border:     '2px solid rgba(34,197,94,0.55)',
            color:      '#4ade80',
            boxShadow:  '0 0 30px rgba(34,197,94,0.25)',
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </motion.div>
        <h3 className="text-[18px] font-extrabold text-white">{bundle.name}</h3>
        <p className="mt-1 text-center text-[12px] text-white/55">
          <b className="font-bold text-[#4ade80]">{itemsAdded}</b> {itemsAdded > 1 ? 'pièces ajoutées' : 'pièce ajoutée'} à ton inventaire.
        </p>

        <div className="mt-4 grid w-full grid-cols-4 gap-2">
          {bundle.items.map(it => (
            <BundleItemTile key={it.id} item={it} owned freshlyAdded />
          ))}
        </div>
      </div>

      <div
        className="mx-5 mb-4 mt-4 flex items-center justify-between rounded-[10px] border px-3.5 py-3"
        style={{ background: 'rgba(10,10,15,0.4)', borderColor: '#1E1E2E' }}
      >
        <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-white/40">Nouveau solde</span>
        <span className="flex items-center gap-1.5 text-[14px] font-extrabold tabular-nums text-[#67e8f9]">
          <span className="text-[12px] font-medium text-white/30 line-through">◈&nbsp;{formatFr(oldBalance)}</span>
          <span className="text-[11px] text-white/30">→</span>
          <span className="text-[13px] text-[rgba(34,211,238,0.85)]">◈</span>
          {formatFr(newBalance)}
        </span>
      </div>

      <div className="flex gap-2.5 px-5 pb-5 pt-1">
        <button
          type="button"
          onClick={() => { onClose(); onGoToInventory?.() }}
          className="flex-[0_0_130px] rounded-[10px] border px-4 py-3 text-[12px] font-bold text-white/60 transition-colors hover:bg-white/10 hover:text-white"
          style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.1)' }}
        >
          Fermer
        </button>
        <button
          type="button"
          onClick={canEquip ? onEquipSet : onClose}
          className="flex flex-1 items-center justify-center gap-2 rounded-[10px] border px-4 py-3 text-[12px] font-bold tracking-[0.04em] transition-colors"
          style={{
            background:  'linear-gradient(180deg, rgba(245,158,11,0.25), rgba(245,158,11,0.12))',
            borderColor: accent.border,
            color:       '#fde68a',
          }}
        >
          <ShieldIconSm />
          {canEquip ? 'Équiper le set' : 'Fermer'}
        </button>
      </div>
    </>
  )
}

// ─── Shared tile ──────────────────────────────────────────────────────────────

function BundleItemTile({ item, owned, freshlyAdded }: { item: ShopItem; owned: boolean; freshlyAdded?: boolean }) {
  return (
    <div
      className="relative flex h-[76px] items-center justify-center overflow-hidden rounded-lg"
      style={{
        background:  'rgba(10,10,18,0.55)',
        border:      '1px solid rgba(255,255,255,0.06)',
      }}
      title={item.name}
    >
      <div style={{ opacity: owned && !freshlyAdded ? 0.35 : 1, filter: owned && !freshlyAdded ? 'saturate(0.6)' : undefined }}>
        {item.item_type === 'badge'
          ? <MiniBadge achievementId={item.item_id} size={36} />
          : <CosmeticPreview type={item.item_type as CosmeticType} id={item.item_id} size="sm" />}
      </div>
      {owned && (
        <div
          className="absolute right-1 top-1 flex h-[16px] w-[16px] items-center justify-center rounded-full"
          style={{
            background: 'rgba(34,197,94,0.22)',
            border:     '1px solid rgba(34,197,94,0.55)',
            color:      '#4ade80',
          }}
          aria-label="Possédé"
        >
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
      )}
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mapErrorMessage(code: string): string {
  switch (code) {
    case 'insufficient_balance': return 'Solde insuffisant'
    case 'no_longer_available':  return 'Ce pack n\'est plus disponible'
    case 'bundle_not_found':     return 'Pack introuvable'
    case 'not_yet_available':    return 'Ce pack n\'est pas encore disponible'
    case 'not_authenticated':    return 'Tu dois être connecté pour acheter'
    default:                     return 'Une erreur est survenue'
  }
}

function PriceRow({
  label, amount, variant, subtle,
}: {
  label:   string
  amount:  number
  variant?: 'after' | 'struck'
  subtle?: boolean
}) {
  const isAfter  = variant === 'after'
  const isStruck = variant === 'struck'
  return (
    <div className={['flex items-center justify-between py-1.5 text-[12px]', subtle ? 'text-white/45' : 'text-white/55'].join(' ')}>
      <span>{label}</span>
      <span
        className={['inline-flex items-center gap-1 tabular-nums', isStruck ? 'text-white/40 line-through' : ''].join(' ')}
        style={{ color: isAfter ? 'rgba(103,232,249,0.85)' : undefined }}
      >
        <span
          style={{
            color:      isAfter ? 'rgba(34,211,238,0.85)' : isStruck ? 'rgba(255,255,255,0.35)' : 'rgba(34,211,238,0.8)',
            fontWeight: 700,
          }}
        >
          ◈
        </span>
        {formatFr(amount)}
      </span>
    </div>
  )
}

function Sparkles() {
  return (
    <>
      <span
        className="pointer-events-none absolute"
        style={{
          top: '18%', left: '14%', width: 5, height: 5,
          borderRadius: '50%',
          background: 'radial-gradient(circle, #fde68a, transparent 70%)',
          opacity: 0.6,
          animation: 'bundle-twinkle 2.4s ease-in-out infinite',
        }}
      />
      <span
        className="pointer-events-none absolute"
        style={{
          top: '28%', right: '18%', width: 4, height: 4,
          borderRadius: '50%',
          background: 'radial-gradient(circle, #fde68a, transparent 70%)',
          opacity: 0.5,
          animation: 'bundle-twinkle 3.2s ease-in-out 0.6s infinite',
        }}
      />
      <span
        className="pointer-events-none absolute"
        style={{
          top: '8%', right: '40%', width: 3, height: 3,
          borderRadius: '50%',
          background: 'radial-gradient(circle, #fde68a, transparent 70%)',
          opacity: 0.4,
          animation: 'bundle-twinkle 2.8s ease-in-out 1.2s infinite',
        }}
      />
      <style>{`@keyframes bundle-twinkle { 0%,100% { opacity: 0.2; transform: scale(0.8); } 50% { opacity: 0.9; transform: scale(1.3); } }`}</style>
    </>
  )
}

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  )
}

function ShopBagIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
      <line x1="3" y1="6" x2="21" y2="6"/>
      <path d="M16 10a4 4 0 0 1-8 0"/>
    </svg>
  )
}

function ShieldIconSm() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  )
}
