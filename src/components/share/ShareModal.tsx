import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import type { RefObject } from 'react'
import type { GameMode, QuestionResult } from '../../types/quiz'
import { computeBestStreak } from '../../utils/statsStorage'
import {
  generateScoreBlob,
  downloadBlob,
  copyBlobToClipboard,
  nativeShareBlob,
  canNativeShare,
} from '../../utils/shareScore'

const NORMAL_TIERS = [
  { min: 10, label: 'Parfait !',         color: '#EAB308' },
  { min: 7,  label: 'Impressionnant !',  color: '#8B5CF6' },
  { min: 4,  label: 'Pas mal !',         color: '#3B82F6' },
  { min: 0,  label: 'Retente ta chance', color: '#6B7280' },
]
const COMP_TIERS = [
  { min: 2000, label: 'Légendaire',  color: '#EAB308' },
  { min: 1000, label: 'Élite',       color: '#8B5CF6' },
  { min: 500,  label: 'Compétiteur', color: '#F97316' },
  { min: 0,    label: 'Débutant',    color: '#6B7280' },
]

interface Props {
  open: boolean
  onClose: () => void
  score: number
  results: QuestionResult[]
  gameMode: GameMode
  username: string | null
  userRank?: number | null
  cardRef: RefObject<HTMLDivElement | null>
}

type CopyState = 'idle' | 'ok' | 'err'
type DlState   = 'idle' | 'ok'

export default function ShareModal({
  open, onClose, score, results, gameMode, userRank, cardRef,
}: Props) {
  const isCompetitif = gameMode === 'compétitif'
  const tiers = isCompetitif ? COMP_TIERS : NORMAL_TIERS
  const tier = tiers.find(t => score >= t.min) ?? tiers[tiers.length - 1]
  const accent = tier.color

  const [blob, setBlob] = useState<Blob | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [copyState, setCopyState] = useState<CopyState>('idle')
  const [dlState, setDlState]     = useState<DlState>('idle')
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
  const hasNativeShare = canNativeShare()

  const correct = results.filter(r => r.isCorrect).length
  const bestStreak = computeBestStreak(results)

  // Reset & generate blob when modal opens
  useEffect(() => {
    if (!open) {
      setBlob(null)
      setLoading(false)
      setError(false)
      setCopyState('idle')
      setDlState('idle')
      return
    }
    if (!cardRef.current) return
    setLoading(true)
    setError(false)
    generateScoreBlob(cardRef.current)
      .then(b => { setBlob(b); setLoading(false) })
      .catch(() => { setError(true); setLoading(false) })
  }, [open, cardRef])

  async function handleShare() {
    if (!blob) return
    try { await nativeShareBlob(blob) } catch { /* user cancelled */ }
  }

  async function handleCopy() {
    if (!blob) return
    try {
      await copyBlobToClipboard(blob)
      setCopyState('ok')
      setTimeout(() => setCopyState('idle'), 2200)
    } catch {
      setCopyState('err')
      setTimeout(() => setCopyState('idle'), 2200)
    }
  }

  function handleDownload() {
    if (!blob) return
    downloadBlob(blob, 'pulse-score.png')
    setDlState('ok')
    setTimeout(() => setDlState('idle'), 2200)
  }

  // Card preview (mini — HTML only, not from ref)
  const modePillBg = isCompetitif ? 'rgba(249,115,22,0.1)' : 'rgba(139,92,246,0.1)'
  const modePillBorder = isCompetitif ? 'rgba(249,115,22,0.2)' : 'rgba(139,92,246,0.2)'
  const modePillColor = isCompetitif ? 'rgba(251,146,60,0.75)' : 'rgba(167,139,250,0.75)'
  const cardBg = isCompetitif ? '#120a04' : '#0e0e1d'
  const cardBorder = isCompetitif ? 'rgba(249,115,22,0.18)' : 'rgba(139,92,246,0.2)'
  const ctaText = isCompetitif ? 'Peux-tu me battre ?' : 'Peux-tu faire mieux ?'

  const MiniCard = (
    <div style={{
      background: cardBg,
      border: `1px solid ${cardBorder}`,
      borderRadius: 12,
      padding: '12px 14px',
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      fontFamily: 'inherit',
    }}>
      {/* Brand row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="14" height="12" viewBox="0 0 200 160" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <defs>
              <linearGradient id="share-mini-logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8B5CF6" />
                <stop offset="50%" stopColor="#3B82F6" />
                <stop offset="100%" stopColor="#06B6D4" />
              </linearGradient>
            </defs>
            <path
              d="M 35 145 L 35 25 A 28 28 0 0 1 35 81 L 75 81 Q 92 52 108 81 T 142 81 L 170 81"
              fill="none"
              stroke="url(#share-mini-logo-grad)"
              strokeWidth="20"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.38)' }}>
            Pulse Quizz
          </span>
        </div>
        <span style={{
          fontSize: 7, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const,
          padding: '2px 7px', borderRadius: 999,
          background: modePillBg, border: `1px solid ${modePillBorder}`, color: modePillColor,
        }}>
          {isCompetitif ? '🔥 Comp' : 'Normal'}
        </span>
      </div>

      {/* Score */}
      <div>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.1em', color: accent, opacity: 0.65, marginBottom: 2 }}>
          {tier.label}
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2 }}>
          <span style={{ fontSize: 38, fontWeight: 900, lineHeight: 1, letterSpacing: '-0.04em', color: accent }}>{score}</span>
          <span style={{ fontSize: 16, fontWeight: 800, color: 'rgba(255,255,255,0.25)', marginBottom: 4 }}>
            {isCompetitif ? ' pts' : '/10'}
          </span>
        </div>
      </div>

      {/* Dots or rank */}
      {!isCompetitif ? (
        <div style={{ display: 'flex', gap: 3 }}>
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} style={{ height: 4, flex: 1, borderRadius: 999, background: i < score ? accent : 'rgba(255,255,255,0.08)' }} />
          ))}
        </div>
      ) : userRank != null ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', background: 'rgba(249,115,22,0.07)', border: '1px solid rgba(249,115,22,0.15)', borderRadius: 7 }}>
          <span style={{ fontSize: 18, fontWeight: 900, color: '#FB923C' }}>#{userRank}</span>
          <div style={{ fontSize: 8, color: 'rgba(251,146,60,0.5)', textTransform: 'uppercase' as const, letterSpacing: '0.07em', fontWeight: 700 }}>Mondial</div>
        </div>
      ) : null}

      {/* Stats summary */}
      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>
        {correct} bonne{correct > 1 ? 's' : ''} réponse{correct > 1 ? 's' : ''} · {bestStreak}× meilleure série
      </div>

      {/* CTA footer */}
      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', fontWeight: 600, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 7 }}>
        {ctaText} → pulse-quizz.vercel.app
      </div>
    </div>
  )

  const title = isCompetitif ? '⚔️ Défier mes amis' : '↑ Partager mon score'

  // ── Shared inner content ──
  const ModalContent = (
    <>
      {/* Handle (mobile only) */}
      {isMobile && (
        <div className="mx-auto mb-1 h-1 w-10 rounded-full bg-white/15" />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-black uppercase tracking-[0.1em] text-white/60">{title}</span>
        <button
          onClick={onClose}
          className="flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm text-white/40 transition-colors hover:bg-white/10 hover:text-white/70"
        >
          ×
        </button>
      </div>

      {/* Mini card preview */}
      {MiniCard}

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center gap-3 rounded-xl border border-white/6 bg-white/[0.03] px-4 py-3.5">
          <div
            className="h-4 w-4 animate-spin rounded-full border-2 border-white/10"
            style={{ borderTopColor: isCompetitif ? 'rgba(251,146,60,0.8)' : 'rgba(167,139,250,0.8)' }}
          />
          <span className="text-[11px] font-semibold text-white/30">Génération de la carte…</span>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-center text-[11px] text-red-400/70">
          Impossible de générer l'image. Réessaie.
        </div>
      )}

      {/* Action buttons */}
      {!loading && !error && blob && (
        <div className="flex gap-2">
          {/* Partager — mobile native share */}
          {(isMobile || hasNativeShare) && (
            <button
              onClick={handleShare}
              className="flex flex-1 flex-col items-center gap-1.5 rounded-[13px] border border-white/8 bg-white/[0.03] px-2 py-3 transition-colors hover:border-white/16 hover:bg-white/[0.06]"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-blue-500/12 text-base">📤</div>
              <span className="text-[9px] font-bold text-white/50">Partager</span>
              <span className="text-[8px] text-white/22">iOS / Android</span>
            </button>
          )}

          {/* Copier */}
          <button
            onClick={handleCopy}
            className={[
              'flex flex-1 flex-col items-center gap-1.5 rounded-[13px] border px-2 py-3 transition-colors',
              copyState === 'ok'
                ? 'border-green-400/30 bg-green-400/8'
                : copyState === 'err'
                ? 'border-red-400/30 bg-red-400/8'
                : 'border-white/8 bg-white/[0.03] hover:border-white/16 hover:bg-white/[0.06]',
            ].join(' ')}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-neon-violet/12 text-base">🖼️</div>
            <span className="text-[9px] font-bold text-white/50">
              {copyState === 'ok' ? '✓ Copié !' : copyState === 'err' ? 'Erreur' : 'Copier'}
            </span>
            <span className="text-[8px] text-white/22">Presse-papiers</span>
          </button>

          {/* Télécharger */}
          <button
            onClick={handleDownload}
            className={[
              'flex flex-1 flex-col items-center gap-1.5 rounded-[13px] border px-2 py-3 transition-colors',
              dlState === 'ok'
                ? 'border-blue-400/30 bg-blue-400/8'
                : 'border-white/8 bg-white/[0.03] hover:border-white/16 hover:bg-white/[0.06]',
            ].join(' ')}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-green-400/12 text-base">💾</div>
            <span className="text-[9px] font-bold text-white/50">
              {dlState === 'ok' ? '✓ Téléchargé !' : isMobile ? 'Sauvegarder' : 'Télécharger'}
            </span>
            <span className="text-[8px] text-white/22">
              {isMobile ? 'Pellicule' : 'pulse-score.png'}
            </span>
          </button>
        </div>
      )}
    </>
  )

  if (isMobile) {
    return createPortal(
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="sheet-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 z-40 bg-black/55"
              onClick={onClose}
            />
            <motion.div
              key="sheet"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.38, ease: [0.32, 0.72, 0, 1] }}
              className="fixed inset-x-0 bottom-0 z-50 flex flex-col gap-3.5 rounded-t-[22px] border-t border-white/9 bg-[#14142a] px-[18px] pb-9 pt-[10px]"
            >
              {ModalContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>,
      document.body
    )
  }

  // Desktop modal
  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="fixed inset-0 z-40 bg-black/60"
            onClick={onClose}
          />
          {/* Centering wrapper — flex, pas de transform CSS pour ne pas interférer avec Framer Motion */}
          <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center">
            <motion.div
              key="modal"
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.22 }}
              className="pointer-events-auto flex w-[360px] flex-col gap-4 rounded-[20px] border border-white/10 bg-[#16162c] p-5 shadow-[0_32px_80px_rgba(0,0,0,0.5)]"
            >
              {ModalContent}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body
  )
}
