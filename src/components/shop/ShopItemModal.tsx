import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { AchievementTier, CosmeticType, ItemType, PurchaseResult, ShopItem } from '../../types/quiz'
import { AppError } from '../../services/errors'
import { purchaseItem } from '../../services/shop'
import { equipCosmetic } from '../../services/inventory'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../contexts/ToastContext'
import { trackShopItemPurchased, trackShopItemViewed } from '../../services/analytics'
import LargeItemPreview from './LargeItemPreview'

const TIER_LABEL: Record<AchievementTier, string> = {
  legendary: 'Légendaire',
  epic:      'Épique',
  rare:      'Rare',
  common:    'Commun',
}

const TIER_ACCENT: Record<AchievementTier, { pill: string; border: string; text: string; dot: string; sparkle: string }> = {
  legendary: { pill: 'rgba(245,158,11,0.14)', border: 'rgba(245,158,11,0.35)', text: '#fde68a', dot: '#f59e0b', sparkle: 'rgba(245,158,11,0.12)' },
  epic:      { pill: 'rgba(167,139,250,0.14)', border: 'rgba(167,139,250,0.35)', text: '#ddd6fe', dot: '#a78bfa', sparkle: 'rgba(167,139,250,0.12)' },
  rare:      { pill: 'rgba(96,165,250,0.14)',  border: 'rgba(96,165,250,0.35)',  text: '#bfdbfe', dot: '#60a5fa', sparkle: 'rgba(96,165,250,0.12)' },
  common:    { pill: 'rgba(255,255,255,0.08)', border: 'rgba(255,255,255,0.18)', text: 'rgba(255,255,255,0.75)', dot: 'rgba(255,255,255,0.35)', sparkle: 'rgba(255,255,255,0.06)' },
}

const TYPE_LABEL_FR: Record<ItemType, string> = {
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

type ModalState = 'detail' | 'loading' | 'success'

interface Props {
  item:             ShopItem | null
  owned:            boolean
  balance:          number
  onClose:          () => void
  onPurchased:      (result: PurchaseResult) => void
  onGoToInventory?: () => void
}

const EQUIPPED_KEY_BY_TYPE: Record<CosmeticType, 'emblem_id' | 'background_id' | 'title_id' | 'card_design_id' | 'screen_anim_id'> = {
  emblem:           'emblem_id',
  background:       'background_id',
  title:            'title_id',
  card_design:      'card_design_id',
  screen_animation: 'screen_anim_id',
}

export default function ShopItemModal({ item, owned, balance, onClose, onPurchased, onGoToInventory }: Props) {
  const { user, profile, bumpPulses, refreshStats, refreshInventory, setLocalEquipped } = useAuth()
  const toast = useToast()

  const [state, setState] = useState<ModalState>('detail')
  // Freeze balances at open time so success state shows old → new reliably
  const [oldBalance, setOldBalance] = useState<number>(balance)
  const [newBalance, setNewBalance] = useState<number>(balance)

  const modalRef = useRef<HTMLDivElement>(null)
  const viewedRef = useRef<string | null>(null)

  // ── Track item viewed + reset state on open ──
  useEffect(() => {
    if (!item) {
      viewedRef.current = null
      return
    }
    setState('detail')
    setOldBalance(balance)
    setNewBalance(balance)
    if (viewedRef.current !== item.id) {
      trackShopItemViewed(item)
      viewedRef.current = item.id
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.id])

  // ── Lock body scroll ──
  useEffect(() => {
    if (!item) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [item])

  // ── Keyboard: Escape + rudimentary focus trap ──
  useEffect(() => {
    if (!item) return
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
  }, [item, state, onClose])

  const unaffordable = useMemo(
    () => item ? !owned && balance < item.price : false,
    [item, owned, balance],
  )

  if (!item) return null

  const accent    = TIER_ACCENT[item.tier]
  const typeLabel = TYPE_LABEL_FR[item.item_type]
  const kindText  = item.is_limited ? `${typeLabel} · Édition limitée` : typeLabel

  async function handleConfirm() {
    if (!item || state !== 'detail' || owned || unaffordable) return
    setState('loading')
    const snapshotOld = balance
    try {
      const result = await purchaseItem(item.id)
      bumpPulses(-item.price)
      setOldBalance(snapshotOld)
      setNewBalance(result.balance)
      trackShopItemPurchased(item, result.balance)
      onPurchased(result)
      setState('success')
      // Fire-and-forget consistency refresh
      refreshInventory().catch(() => {})
      refreshStats()
    } catch (err) {
      const message = err instanceof AppError ? mapErrorMessage(err.code) : 'Une erreur est survenue'
      toast.error(message)
      setState('detail')
    }
  }

  async function handleEquipOrView() {
    if (!item) return
    if (item.item_type === 'badge') {
      onClose()
      onGoToInventory?.()
      return
    }
    if (!user) { onClose(); return }
    const type = item.item_type as CosmeticType
    const id   = item.item_id
    const prevEquipped = profile?.equipped[EQUIPPED_KEY_BY_TYPE[type]] ?? null
    setLocalEquipped(type, id)
    onClose()
    try {
      await equipCosmetic(user.id, type, id)
      toast.success('Équipé !')
    } catch {
      setLocalEquipped(type, prevEquipped)
      toast.error('Impossible d\'équiper cet objet')
    }
  }

  function handleBackdrop(e: React.MouseEvent) {
    if (state === 'loading') return
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <AnimatePresence>
      <motion.div
        key="shop-modal-backdrop"
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
          key="shop-modal"
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          role="dialog"
          aria-modal="true"
          aria-label={state === 'success' ? 'Achat réussi' : 'Détail de l\'objet'}
          className="relative w-full max-w-[460px] overflow-hidden rounded-2xl border"
          style={{
            borderColor: state === 'success' ? 'rgba(34,197,94,0.3)' : '#1E1E2E',
            background:  'linear-gradient(180deg, #14141f, #0d0d14)',
            boxShadow:   state === 'success'
              ? '0 20px 60px rgba(0,0,0,0.6), 0 0 40px rgba(34,197,94,0.12)'
              : '0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.02)',
          }}
        >
          {state === 'success'
            ? (
                <SuccessView
                  item={item}
                  oldBalance={oldBalance}
                  newBalance={newBalance}
                  accent={accent}
                  kindText={kindText}
                  onClose={onClose}
                  onGoToInventory={onGoToInventory}
                  onEquipOrView={handleEquipOrView}
                />
              )
            : (
                <DetailView
                  item={item}
                  accent={accent}
                  kindText={kindText}
                  balance={balance}
                  owned={owned}
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
  item:         ShopItem
  accent:       (typeof TIER_ACCENT)[AchievementTier]
  kindText:     string
  balance:      number
  owned:        boolean
  unaffordable: boolean
  loading:      boolean
  onClose:      () => void
  onConfirm:    () => void
}

function DetailView({ item, accent, kindText, balance, owned, unaffordable, loading, onClose, onConfirm }: DetailViewProps) {
  const balanceAfter = Math.max(0, balance - item.price)
  const availabilityText = item.available_until
    ? 'Édition limitée'
    : item.is_new
      ? 'Cette semaine'
      : 'Toujours disponible'

  return (
    <>
      <header
        className="flex items-center justify-between border-b px-4 py-3"
        style={{ borderColor: '#1E1E2E' }}
      >
        <span
          className="text-[10px] font-bold uppercase tracking-[0.14em]"
          style={{ color: 'rgba(167,139,250,0.65)' }}
        >
          ✦ Objet boutique
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
        className="relative overflow-hidden px-5 pb-6 pt-8 text-center"
        style={{
          background: `radial-gradient(circle at 50% 40%, ${accent.sparkle}, transparent 60%)`,
          borderBottom: '1px solid #1E1E2E',
        }}
      >
        <Sparkles />
        <div className="relative z-[2] flex min-h-[120px] items-center justify-center">
          <LargeItemPreview itemType={item.item_type} itemId={item.item_id} tier={item.tier} />
        </div>

        <div
          className="mx-auto mt-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-[3px] text-[9px] font-extrabold uppercase tracking-[0.16em]"
          style={{ background: accent.pill, border: `1px solid ${accent.border}`, color: accent.text }}
        >
          <span className="h-[5px] w-[5px] rounded-full" style={{ background: accent.dot }} />
          {TIER_LABEL[item.tier]}
        </div>

        <h2 className="mt-2 text-[22px] font-extrabold leading-tight text-white" style={{ letterSpacing: '-0.01em' }}>
          {item.name}
        </h2>
        <p className="mt-1 text-[11px] font-semibold text-white/40">{kindText}</p>
      </div>

      {item.description && (
        <div className="border-b px-5 py-4" style={{ borderColor: '#1E1E2E' }}>
          <p className="text-[12px] leading-[1.55] text-white/60">{item.description}</p>
          <div className="mt-3 flex gap-4">
            <MetaItem label="Catégorie" value={TYPE_LABEL_FR[item.item_type]} />
            <MetaItem label="Disponibilité" value={availabilityText} />
          </div>
        </div>
      )}

      <div className="px-5 py-3.5" style={{ background: 'rgba(34,211,238,0.03)' }}>
        <PriceRow label="Prix" amount={item.price} />
        <PriceRow label="Ton solde après achat" amount={balanceAfter} variant="after" />
        <PriceRow label="Total à payer" amount={item.price} variant="total" />
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
          disabled={loading || owned || unaffordable}
          className="flex flex-1 items-center justify-center gap-2 rounded-[10px] border px-4 py-3 text-[12px] font-bold tracking-[0.04em] transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            background:  'linear-gradient(180deg, rgba(34,211,238,0.22), rgba(34,211,238,0.1))',
            borderColor: 'rgba(34,211,238,0.5)',
            color:       '#67e8f9',
            boxShadow:   '0 0 18px rgba(34,211,238,0.18)',
          }}
        >
          {loading
            ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#67e8f9] border-t-transparent" />
            : <>
                <ShopBagIcon />
                {owned ? 'Déjà possédé' : unaffordable ? 'Solde insuffisant' : 'Confirmer l\'achat'}
              </>}
        </button>
      </div>
    </>
  )
}

// ─── Success view ─────────────────────────────────────────────────────────────

interface SuccessViewProps {
  item:            ShopItem
  oldBalance:      number
  newBalance:      number
  accent:          (typeof TIER_ACCENT)[AchievementTier]
  kindText:        string
  onClose:         () => void
  onGoToInventory?: () => void
  onEquipOrView:   () => void
}

function SuccessView({ item, oldBalance, newBalance, accent, kindText, onClose, onGoToInventory, onEquipOrView }: SuccessViewProps) {
  const isBadge = item.item_type === 'badge'
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
          ✓ Achat réussi
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
        className="relative flex flex-col items-center border-b px-5 pb-5 pt-9"
        style={{
          borderColor: '#1E1E2E',
          background:  'radial-gradient(circle at 50% 40%, rgba(34,197,94,0.15), transparent 60%)',
        }}
      >
        <motion.div
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.05 }}
          className="mb-4 flex h-[60px] w-[60px] items-center justify-center rounded-full"
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
        <h3 className="text-[18px] font-extrabold text-white">C'est à toi !</h3>
        <p className="mt-1 text-center text-[12px] text-white/50">
          <b className="font-bold text-[#4ade80]">{item.name}</b> rejoint ton inventaire.
        </p>
      </div>

      <div
        className="mx-5 mt-4 flex items-center gap-3 overflow-hidden rounded-xl border p-3"
        style={{
          background:  `linear-gradient(180deg, ${accent.sparkle}, rgba(19,19,31,0.6))`,
          borderColor: accent.border,
        }}
      >
        <div className="flex h-[64px] w-[64px] flex-shrink-0 items-center justify-center">
          <LargeItemPreview itemType={item.item_type} itemId={item.item_id} tier={item.tier} variant="md" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-extrabold text-white">{item.name}</p>
          <p className="mt-0.5 truncate text-[10px] text-white/45">{kindText} · {TIER_LABEL[item.tier]}</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {item.is_limited && (
              <span
                className="rounded-full px-2 py-[3px] text-[8px] font-bold uppercase tracking-[0.1em]"
                style={{ background: accent.pill, border: `1px solid ${accent.border}`, color: accent.text }}
              >
                ✦ Limité
              </span>
            )}
            <span
              className="rounded-full px-2 py-[3px] text-[8px] font-bold uppercase tracking-[0.1em]"
              style={{ background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.25)', color: 'rgba(103,232,249,0.9)' }}
            >
              Boutique
            </span>
          </div>
        </div>
      </div>

      <div
        className="mx-5 mb-4 mt-2 flex items-center justify-between rounded-[10px] border px-3.5 py-3"
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

      <div className="flex gap-2.5 px-5 pb-5 pt-2">
        <button
          type="button"
          onClick={() => { onClose(); onGoToInventory?.() }}
          className="flex-[0_0_130px] rounded-[10px] border px-4 py-3 text-[12px] font-bold text-white/60 transition-colors hover:bg-white/10 hover:text-white"
          style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.1)' }}
        >
          Voir inventaire
        </button>
        <button
          type="button"
          onClick={onEquipOrView}
          className="flex flex-1 items-center justify-center gap-2 rounded-[10px] border px-4 py-3 text-[12px] font-bold tracking-[0.04em] transition-colors"
          style={{
            background:  'linear-gradient(180deg, rgba(139,92,246,0.25), rgba(139,92,246,0.12))',
            borderColor: 'rgba(139,92,246,0.5)',
            color:       '#c4b5fd',
          }}
        >
          {isBadge ? <BagIconSm /> : <ShieldIconSm />}
          {isBadge ? 'Voir inventaire' : 'Équiper maintenant'}
        </button>
      </div>
    </>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mapErrorMessage(code: string): string {
  switch (code) {
    case 'already_owned':        return 'Tu possèdes déjà cet objet'
    case 'insufficient_balance': return 'Solde insuffisant'
    case 'no_longer_available':  return 'Cet objet n\'est plus disponible'
    case 'not_yet_available':    return 'Cet objet n\'est pas encore disponible'
    case 'not_authenticated':    return 'Tu dois être connecté pour acheter'
    default:                     return 'Une erreur est survenue'
  }
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="flex-1 rounded-[10px] border px-3 py-2.5"
      style={{ background: 'rgba(255,255,255,0.02)', borderColor: '#1E1E2E' }}
    >
      <div className="mb-1 text-[8px] font-bold uppercase tracking-[0.14em] text-white/35">{label}</div>
      <div className="text-[12px] font-bold text-white">{value}</div>
    </div>
  )
}

function PriceRow({ label, amount, variant }: { label: string; amount: number; variant?: 'total' | 'after' }) {
  const isTotal = variant === 'total'
  const isAfter = variant === 'after'
  return (
    <div
      className={[
        'flex items-center justify-between py-1.5 text-[12px]',
        isTotal ? 'mt-1.5 border-t pt-2.5 text-white font-bold' : 'text-white/55',
      ].join(' ')}
      style={isTotal ? { borderColor: '#1E1E2E', fontSize: 14 } : undefined}
    >
      <span>{label}</span>
      <span
        className="inline-flex items-center gap-1 tabular-nums"
        style={{
          color:    isTotal ? '#67e8f9' : isAfter ? 'rgba(103,232,249,0.85)' : undefined,
          fontSize: isTotal ? 16 : undefined,
          fontWeight: isTotal ? 800 : undefined,
        }}
      >
        <span
          style={{
            color:      isTotal ? '#22d3ee' : 'rgba(34,211,238,0.8)',
            fontWeight: 700,
            fontSize:   isTotal ? 14 : undefined,
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
          top: '20%', left: '18%', width: 4, height: 4,
          borderRadius: '50%',
          background: 'radial-gradient(circle, #fde68a, transparent 70%)',
          opacity: 0.5,
          animation: 'shop-twinkle 2.4s ease-in-out infinite',
        }}
      />
      <span
        className="pointer-events-none absolute"
        style={{
          top: '35%', right: '22%', width: 3, height: 3,
          borderRadius: '50%',
          background: 'radial-gradient(circle, #fde68a, transparent 70%)',
          opacity: 0.5,
          animation: 'shop-twinkle 3.2s ease-in-out 0.6s infinite',
        }}
      />
      <style>{`@keyframes shop-twinkle { 0%,100% { opacity: 0.2; transform: scale(0.8); } 50% { opacity: 0.9; transform: scale(1.2); } }`}</style>
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

function BagIconSm() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
      <line x1="3" y1="6" x2="21" y2="6"/>
    </svg>
  )
}
