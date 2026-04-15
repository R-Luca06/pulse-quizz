import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import MiniBadge from '../components/shared/MiniBadge'
import { BADGE_TIER, TIER_GLOW_COLOR } from '../constants/achievementColors'
import { ACHIEVEMENT_MAP } from '../constants/achievements'
import type { AchievementId, AchievementTier } from '../types/quiz'
import { getPublicProfile, type PublicProfile } from '../services/publicProfile'
import { useAuth } from '../hooks/useAuth'
import { updateFeaturedBadges, updateUsername, updateDescription } from '../services/profile'
import { sendFriendRequest, removeFriendship, getFriendshipStatus, type FriendshipStatus } from '../services/social'
import { useToast } from '../contexts/ToastContext'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ALL_BADGE_IDS = Object.keys(ACHIEVEMENT_MAP) as AchievementId[]

const TIER_LABEL: Record<AchievementTier, string> = {
  common: 'Commun', rare: 'Rare', epic: 'Épique', legendary: 'Légendaire',
}

function computeTitle(rank: number | null): string {
  if (!rank) return 'Joueur'
  if (rank === 1) return 'Champion Mondial'
  if (rank <= 3) return 'Top 3 Mondial'
  if (rank <= 10) return 'Élite Mondiale'
  if (rank <= 50) return 'Maître du Quiz'
  if (rank <= 100) return 'Expert'
  return 'Compétiteur'
}

function computeRankLabel(rank: number | null, total: number): string | null {
  if (!rank) return null
  if (total > 0) {
    const pct = Math.ceil((rank / total) * 100)
    return `Top ${pct}%`
  }
  return null
}

// ─── Wall sub-components ──────────────────────────────────────────────────────

function Blason({ rank }: { rank: number | null }) {
  const isTop10 = !!rank && rank <= 10
  const isTop50 = !!rank && rank <= 50
  const color   = !rank ? 'rgba(255,255,255,0.18)' : isTop10 ? '#f59e0b' : isTop50 ? '#94a3b8' : '#6b7280'

  return (
    <motion.div
      initial={{ opacity: 0, y: -14, scale: 0.85 }}
      animate={{ opacity: 1, y: 0,   scale: 1 }}
      transition={{ delay: 0.25, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
    >
      {rank && <div style={{ position: 'absolute', inset: -10, background: `radial-gradient(circle, ${color}28 0%, transparent 70%)`, filter: 'blur(8px)', pointerEvents: 'none' }} />}
      <svg width="64" height="74" viewBox="-32 -37 64 74" fill="none">
        <path d="M -24,-33 L 24,-33 L 24,4 C 24,16 9,30 0,36 C -9,30 -24,16 -24,4 Z" fill="rgba(14,10,28,0.95)" stroke={color} strokeWidth="1.5" strokeDasharray={rank ? undefined : '4 3'} />
        <path d="M -19,-28 L 19,-28 L 19,2 C 19,12 7,24 0,29 C -7,24 -19,12 -19,2 Z" fill="none" stroke={color + '55'} strokeWidth="0.8" />
        <circle cx="-24" cy="-33" r="2.5" fill={color + '80'} />
        <circle cx="24" cy="-33" r="2.5" fill={color + '80'} />
        {rank
          ? <>
              <text x="0" y="-4" textAnchor="middle" dominantBaseline="middle" fill={color} fontSize="13" fontWeight="900" letterSpacing="-0.5">#{rank}</text>
              <text x="0" y="12" textAnchor="middle" dominantBaseline="middle" fill={color + 'aa'} fontSize="6" fontWeight="700" letterSpacing="1">RANG</text>
            </>
          : <>
              <text x="0" y="-4" textAnchor="middle" dominantBaseline="middle" fill={color} fontSize="18" fontWeight="900">?</text>
              <text x="0" y="12" textAnchor="middle" dominantBaseline="middle" fill={color + 'aa'} fontSize="5.5" fontWeight="700" letterSpacing="0.8">À CLASSER</text>
            </>
        }
      </svg>
      <div style={{ display: 'flex', gap: 3, marginTop: -2 }}>
        {[0,1,2].map(i => <div key={i} style={{ width: 3, height: 3, borderRadius: '50%', background: `${color}60`, border: `1px solid ${color}80` }} />)}
      </div>
      <div style={{ width: 1.5, height: 8, background: `${color}40` }} />
    </motion.div>
  )
}

function Banner({ id, index, onClick }: { id: AchievementId | null; index: number; onClick?: () => void }) {
  if (!id || !ACHIEVEMENT_MAP[id]) return <EmptyBanner index={index} onClick={onClick} />
  const achievement = ACHIEVEMENT_MAP[id]
  const tier = BADGE_TIER[id]
  const glow = TIER_GLOW_COLOR[tier]
  const inner = (
    <>
      <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'rgba(255,255,255,0.10)', border: '1.5px solid rgba(255,255,255,0.22)', boxShadow: '0 2px 4px rgba(0,0,0,0.5)', marginBottom: -1 }} />
      <div style={{ width: 1.5, height: 10, background: 'rgba(255,255,255,0.15)' }} />
      <div style={{
        width: 84,
        clipPath: 'polygon(0 0, 100% 0, 100% 84%, 50% 100%, 0 84%)',
        background: `linear-gradient(170deg, ${glow}20 0%, ${glow}0c 55%, transparent 100%)`,
        borderLeft: `1px solid ${glow}55`, borderRight: `1px solid ${glow}55`, borderTop: `1px solid ${onClick ? 'rgba(196,181,253,0.55)' : glow + '65'}`,
        boxShadow: `0 8px 40px ${glow}22, inset 0 0 24px ${glow}08`,
        padding: '14px 10px 30px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
        position: 'relative', overflow: 'hidden',
        transition: 'opacity 0.15s',
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '35%', background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 0%, transparent 100%)', pointerEvents: 'none' }} />
        {onClick && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'rgba(0,0,0,0.55)', clipPath: 'polygon(0 0, 100% 0, 100% 84%, 50% 100%, 0 84%)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(196,181,253,0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </div>
        )}
        <span style={{ fontSize: 7.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.13em', color: glow + 'bb' }}>{TIER_LABEL[tier]}</span>
        <MiniBadge achievementId={id} size={44} unlocked />
        <span style={{ fontSize: 10.5, fontWeight: 700, color: 'rgba(255,255,255,0.88)', textAlign: 'center', lineHeight: 1.35 }}>{achievement.name}</span>
      </div>
    </>
  )
  if (onClick) return (
    <motion.button
      type="button" onClick={onClick}
      initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.45 + index * 0.16, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      className="group flex flex-col items-center focus:outline-none"
      whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
    >{inner}</motion.button>
  )
  return (
    <motion.div
      initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.45 + index * 0.16, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
    >{inner}</motion.div>
  )
}

function EmptyBanner({ index, onClick }: { index: number; onClick?: () => void }) {
  const inner = (
    <>
      <div style={{ width: 12, height: 12, borderRadius: '50%', background: onClick ? 'rgba(196,181,253,0.10)' : 'rgba(255,255,255,0.04)', border: `1.5px solid ${onClick ? 'rgba(196,181,253,0.25)' : 'rgba(255,255,255,0.10)'}`, marginBottom: -1 }} />
      <div style={{ width: 1.5, height: 10, background: onClick ? 'rgba(196,181,253,0.15)' : 'rgba(255,255,255,0.07)' }} />
      <div style={{ width: 84, minHeight: 148, clipPath: 'polygon(0 0, 100% 0, 100% 84%, 50% 100%, 0 84%)', background: onClick ? 'rgba(196,181,253,0.04)' : 'rgba(255,255,255,0.015)', border: `1px dashed ${onClick ? 'rgba(196,181,253,0.22)' : 'rgba(255,255,255,0.08)'}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '16px 10px 30px', transition: 'background 0.15s' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={onClick ? 'rgba(196,181,253,0.45)' : 'rgba(255,255,255,0.15)'} strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        <span style={{ fontSize: 9, color: onClick ? 'rgba(196,181,253,0.35)' : 'rgba(255,255,255,0.14)', textAlign: 'center' }}>Badge<br/>épinglé</span>
      </div>
    </>
  )
  if (onClick) return (
    <motion.button
      type="button" onClick={onClick}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      transition={{ delay: 0.45 + index * 0.16 }}
      className="flex flex-col items-center focus:outline-none"
      whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
    >{inner}</motion.button>
  )
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.35 }} transition={{ delay: 0.45 + index * 0.16 }}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
    >{inner}</motion.div>
  )
}

function Nameplate({ username, title }: { username: string; title: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55, duration: 0.65 }}
      style={{ position: 'relative', display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}
    >
      <div style={{ width: 1.5, height: 8, background: 'rgba(255,255,255,0.12)' }} />
      <div style={{ position: 'relative', padding: '7px 28px 6px', background: 'linear-gradient(180deg, rgba(255,255,255,0.065) 0%, rgba(255,255,255,0.03) 100%)', border: '1px solid rgba(255,255,255,0.13)', borderRadius: 3, boxShadow: '0 4px 16px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.07)', minWidth: 180, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
        {[['top','left'], ['top','right'], ['bottom','left'], ['bottom','right']].map(([v, h]) => (
          <div key={`${v}${h}`} style={{ position: 'absolute', [v]: 4, [h]: 7, width: 9, height: 9, borderTop: v==='top' ? '1px solid rgba(255,255,255,0.22)' : 'none', borderBottom: v==='bottom' ? '1px solid rgba(255,255,255,0.22)' : 'none', borderLeft: h==='left' ? '1px solid rgba(255,255,255,0.22)' : 'none', borderRight: h==='right' ? '1px solid rgba(255,255,255,0.22)' : 'none' }} />
        ))}
        <span style={{ fontSize: 14, fontWeight: 900, color: 'rgba(255,255,255,0.88)', letterSpacing: '0.06em' }}>@{username}</span>
        <span style={{ fontSize: 8.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.16em', color: 'rgba(255,255,255,0.32)' }}>{title}</span>
      </div>
      <div style={{ width: '90%', height: 3, background: 'rgba(0,0,0,0.3)', borderRadius: '0 0 3px 3px', filter: 'blur(2px)', marginTop: 1 }} />
    </motion.div>
  )
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    .format(new Date(iso))
}

type TooltipState = { id: AchievementId; x: number; y: number } | null

function BadgeShelf({ achievements, achievementDates }: { achievements: AchievementId[]; achievementDates: Record<string, string> }) {
  const unlockedSet = new Set(achievements)
  const TIER_ORDER: Record<AchievementTier, number> = { legendary: 0, epic: 1, rare: 2, common: 3 }
  const sorted = [...ALL_BADGE_IDS].sort((a, b) => {
    const au = unlockedSet.has(a), bu = unlockedSet.has(b)
    if (au !== bu) return au ? -1 : 1
    return TIER_ORDER[BADGE_TIER[a]] - TIER_ORDER[BADGE_TIER[b]]
  })

  const [tooltip, setTooltip] = useState<TooltipState>(null)

  function handleEnter(e: React.MouseEvent, id: AchievementId) {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
    setTooltip({ id, x: r.left + r.width / 2, y: r.top })
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.85, duration: 0.5 }}>
      {/* Face supérieure */}
      <div style={{ height: 5, background: 'linear-gradient(180deg, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0.04) 100%)', borderTop: '1px solid rgba(255,255,255,0.15)', borderLeft: '1px solid rgba(255,255,255,0.07)', borderRight: '1px solid rgba(255,255,255,0.07)' }} />
      {/* Surface */}
      <div style={{ background: 'linear-gradient(180deg, rgba(20,14,38,0.75) 0%, rgba(10,7,20,0.92) 100%)', borderLeft: '1px solid rgba(255,255,255,0.07)', borderRight: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center' }}>
        {/* Zone scrollable */}
        <div style={{ flex: 1, overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 16px', width: 'max-content' }}>
            {sorted.map((id, idx) => {
              const unlocked = unlockedSet.has(id)
              const tier = BADGE_TIER[id]
              const glow = TIER_GLOW_COLOR[tier]
              return (
                <motion.div
                  key={id}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.95 + idx * 0.025, duration: 0.3, ease: 'easeOut' }}
                  style={{ position: 'relative', flexShrink: 0, filter: unlocked ? 'none' : 'grayscale(1)', opacity: unlocked ? 1 : 0.2, cursor: 'default' }}
                  onMouseEnter={e => handleEnter(e, id)}
                  onMouseLeave={() => setTooltip(null)}
                >
                  <MiniBadge achievementId={id} size={28} unlocked={unlocked} />
                  {unlocked && (tier === 'legendary' || tier === 'epic') && (
                    <div style={{ position: 'absolute', inset: -4, borderRadius: '50%', background: `radial-gradient(circle, ${glow}28 0%, transparent 70%)`, filter: 'blur(4px)', pointerEvents: 'none' }} />
                  )}
                </motion.div>
              )
            })}
          </div>
        </div>
        {/* Compteur fixe */}
        <div style={{ flexShrink: 0, padding: '9px 14px 9px 10px', borderLeft: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
          <span style={{ fontSize: 13, fontWeight: 900, lineHeight: 1 }}>
            <span style={{ color: '#a78bfa' }}>{achievements.length}</span>
            <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10 }}>/{ALL_BADGE_IDS.length}</span>
          </span>
          <span style={{ fontSize: 7, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.18)' }}>succès</span>
        </div>
      </div>
      {/* Ombre */}
      <div style={{ height: 7, background: 'rgba(0,0,0,0.5)', filter: 'blur(2px)' }} />

      {/* Tooltip — rendu dans document.body via portal pour échapper overflow/transform */}
      {tooltip && createPortal(
        <div style={{
          position: 'fixed',
          left: tooltip.x,
          top: tooltip.y - 10,
          transform: 'translate(-50%, -100%)',
          zIndex: 99999,
          pointerEvents: 'none',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
          background: 'rgba(12,8,26,0.96)',
          border: '1px solid rgba(255,255,255,0.10)',
          borderRadius: 8,
          padding: '6px 11px 7px',
          boxShadow: '0 8px 28px rgba(0,0,0,0.6)',
          backdropFilter: 'blur(6px)',
          whiteSpace: 'nowrap',
        }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.88)' }}>
            {ACHIEVEMENT_MAP[tooltip.id]?.name ?? tooltip.id}
          </span>
          {achievementDates[tooltip.id] ? (
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>
              {formatDate(achievementDates[tooltip.id])}
            </span>
          ) : (
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.20)', fontStyle: 'italic' }}>
              Non débloqué
            </span>
          )}
          {/* Flèche */}
          <div style={{
            position: 'absolute', bottom: -4, left: '50%',
            width: 7, height: 7,
            background: 'rgba(12,8,26,0.96)',
            border: '1px solid rgba(255,255,255,0.10)',
            borderTop: 'none', borderLeft: 'none',
            transform: 'translateX(-50%) rotate(45deg)',
          }} />
        </div>,
        document.body
      )}
    </motion.div>
  )
}

function BadgePicker({
  achievements,
  currentBadges,
  slotIndex,
  onSelect,
  onClose,
}: {
  achievements: AchievementId[]
  currentBadges: (AchievementId | null)[]
  slotIndex: number
  onSelect: (id: AchievementId | null) => void
  onClose: () => void
}) {
  const unlockedSet = new Set(achievements)
  const TIER_ORDER: Record<AchievementTier, number> = { legendary: 0, epic: 1, rare: 2, common: 3 }
  const sorted = [...ALL_BADGE_IDS].sort((a, b) => {
    const au = unlockedSet.has(a), bu = unlockedSet.has(b)
    if (au !== bu) return au ? -1 : 1
    return TIER_ORDER[BADGE_TIER[a]] - TIER_ORDER[BADGE_TIER[b]]
  })
  const currentSlotBadge = currentBadges[slotIndex]

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-end justify-center"
    >
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 380, damping: 40 }}
        className="relative w-full max-w-lg rounded-t-2xl border-t border-game-border bg-game-card flex flex-col"
        style={{ maxHeight: '72vh' }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-white/10" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-game-border">
          <div>
            <p className="text-sm font-bold text-white/80">Bannière {slotIndex + 1}</p>
            <p className="text-[11px] text-white/30">Choisir un badge à épingler</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white/30 transition-colors hover:bg-white/5 hover:text-white/60"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {currentSlotBadge && (
            <button
              onClick={() => onSelect(null)}
              className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl border border-game-border py-2.5 text-xs font-semibold text-white/35 transition-colors hover:border-red-500/30 hover:bg-red-500/5 hover:text-red-400/70"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
              </svg>
              Retirer le badge
            </button>
          )}
          <div className="grid grid-cols-5 gap-2.5 sm:grid-cols-6">
            {sorted.map(id => {
              const unlocked = unlockedSet.has(id)
              const pinnedInOtherSlot = currentBadges.some((b, i) => b === id && i !== slotIndex)
              const isCurrentSlot = currentBadges[slotIndex] === id
              const isDisabled = !unlocked || pinnedInOtherSlot
              const tier = BADGE_TIER[id]
              const glow = TIER_GLOW_COLOR[tier]
              return (
                <motion.button
                  key={id}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => !isDisabled && onSelect(id)}
                  whileHover={!isDisabled ? { scale: 1.08 } : undefined}
                  whileTap={!isDisabled ? { scale: 0.95 } : undefined}
                  className="relative flex flex-col items-center gap-1.5 rounded-xl p-2 focus:outline-none transition-colors"
                  style={{
                    background: isCurrentSlot ? `${glow}18` : 'transparent',
                    border: isCurrentSlot ? `1px solid ${glow}55` : '1px solid transparent',
                    opacity: isDisabled ? 0.2 : 1,
                    cursor: isDisabled ? 'default' : 'pointer',
                  }}
                >
                  <div style={{ filter: unlocked ? 'none' : 'grayscale(1)' }}>
                    <MiniBadge achievementId={id} size={32} unlocked={unlocked} />
                  </div>
                  {/* checkmark pour le slot courant */}
                  {isCurrentSlot && (
                    <div className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full" style={{ background: glow }}>
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    </div>
                  )}
                </motion.button>
              )
            })}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

function StatCard({ label, value, accent, delay }: { label: string; value: string; accent: string; delay: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.5 }}
      className="flex flex-col items-center gap-1 rounded-xl border border-game-border bg-game-card/60 px-4 py-3"
      style={{ boxShadow: `0 0 18px ${accent}0e` }}
    >
      <span className="text-xl font-black tabular-nums" style={{ color: accent }}>{value}</span>
      <span className="text-[10px] font-semibold uppercase tracking-wide text-white/30">{label}</span>
    </motion.div>
  )
}

// ─── États de chargement / erreur ─────────────────────────────────────────────

function LoadingState({ onClose, hideNav }: { onClose: () => void; hideNav?: boolean }) {
  return (
    <div className={hideNav ? 'flex flex-col' : 'flex h-full flex-col bg-game-bg'}>
      {!hideNav && (
        <div className="flex items-center border-b border-game-border px-3 py-2">
          <button onClick={onClose} className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-white/35 transition-colors hover:bg-white/5 hover:text-white/70">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
            Retour
          </button>
        </div>
      )}
      <div className="flex items-start gap-3 border-b border-game-border px-5 py-4">
        <div className="h-12 w-12 animate-pulse rounded-full bg-white/[0.06]" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-4 w-32 animate-pulse rounded bg-white/[0.06]" />
          <div className="h-3 w-48 animate-pulse rounded bg-white/[0.04]" />
        </div>
      </div>
      <div className="px-4 pt-4">
        <div className="h-[340px] animate-pulse rounded-2xl bg-white/[0.03]" />
      </div>
    </div>
  )
}

function NotFoundState({ username, onClose, hideNav }: { username: string; onClose: () => void; hideNav?: boolean }) {
  return (
    <div className={hideNav ? 'flex flex-col' : 'flex h-full flex-col bg-game-bg'}>
      {!hideNav && (
        <div className="flex items-center border-b border-game-border px-3 py-2">
          <button onClick={onClose} className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-white/35 transition-colors hover:bg-white/5 hover:text-white/70">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
            Retour
          </button>
        </div>
      )}
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-game-border text-3xl">
          👤
        </div>
        <div>
          <p className="text-lg font-black text-white/70">@{username}</p>
          <p className="mt-1 text-sm text-white/30">Ce profil n'existe pas</p>
        </div>
      </div>
    </div>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────

function WallPage({ profile, onClose, hideNav }: { profile: PublicProfile; onClose: () => void; hideNav?: boolean }) {
  const { user, profile: authProfile, setLocalFeaturedBadges, setLocalDescription: setAuthDescription, refreshProfile, triggerAchievementCheck } = useAuth()
  const toast = useToast()
  const [isOwnProfile] = useState(() =>
    !!user && !!authProfile && authProfile.username.toLowerCase() === profile.username.toLowerCase()
  )

  const title     = computeTitle(profile.rank)
  const rankLabel = computeRankLabel(profile.rank, profile.total_players)

  // ── Friendship state ──
  const [friendStatus,   setFriendStatus]   = useState<FriendshipStatus | null>(null)
  const [friendshipId,   setFriendshipId]   = useState<string | null>(null)
  const [isRequester,    setIsRequester]    = useState<boolean | null>(null)
  const [friendLoading,  setFriendLoading]  = useState(false)

  useEffect(() => {
    if (!user || isOwnProfile || !profile.userId) return
    getFriendshipStatus(user.id, profile.userId).then(res => {
      setFriendStatus(res.status)
      setFriendshipId(res.friendshipId)
      setIsRequester(res.isRequester)
    })
  }, [user, isOwnProfile, profile.userId])

  async function handleFriendAction() {
    if (!user || !profile.userId) return
    setFriendLoading(true)
    try {
      if (friendStatus === null) {
        const row = await sendFriendRequest(user.id, profile.userId)
        setFriendStatus('pending')
        setFriendshipId(row.id)
        setIsRequester(true)
        toast.success('Demande envoyée !')
      } else if (friendStatus === 'pending' && isRequester) {
        await removeFriendship(friendshipId!)
        setFriendStatus(null)
        setFriendshipId(null)
        setIsRequester(null)
        toast.success('Demande annulée')
      } else if (friendStatus === 'accepted') {
        await removeFriendship(friendshipId!)
        setFriendStatus(null)
        setFriendshipId(null)
        setIsRequester(null)
        toast.success('Ami supprimé')
      }
    } catch {
      toast.error("Une erreur est survenue")
    } finally {
      setFriendLoading(false)
    }
  }

  // Champs éditables localement
  const [localUsername,    setLocalUsername]    = useState(profile.username)
  const [localDescription, setLocalDescription] = useState(
    isOwnProfile && authProfile?.description !== undefined ? authProfile.description : profile.description
  )
  // Sync description depuis AuthContext (changement fait dans GeneralTab)
  const prevAuthDesc = useRef(authProfile?.description)
  useEffect(() => {
    if (!isOwnProfile) return
    if (authProfile?.description !== undefined && authProfile.description !== prevAuthDesc.current) {
      setLocalDescription(authProfile.description)
      prevAuthDesc.current = authProfile.description
    }
  }, [isOwnProfile, authProfile?.description])

  // Bannières épinglées — toujours 3 slots (null = slot vide), éditable si own profile
  const [localFeatured, setLocalFeatured] = useState<(AchievementId | null)[]>([
    profile.featured_badges[0] ?? null,
    profile.featured_badges[1] ?? null,
    profile.featured_badges[2] ?? null,
  ])
  const [pickerSlot, setPickerSlot] = useState<0 | 1 | 2 | null>(null)

  // Édition inline
  const [editingField, setEditingField] = useState<'username' | 'description' | null>(null)
  const [editValue,    setEditValue]    = useState('')
  const [editError,    setEditError]    = useState<string | null>(null)
  const [editSaving,   setEditSaving]   = useState(false)

  function startEdit(field: 'username' | 'description') {
    setEditingField(field)
    setEditValue(field === 'username' ? localUsername : localDescription)
    setEditError(null)
  }

  async function handleSaveEdit() {
    if (!user || !editingField) return
    setEditSaving(true)
    setEditError(null)
    try {
      if (editingField === 'username') {
        await updateUsername(user.id, editValue)
        setLocalUsername(editValue.trim())
        await refreshProfile()
        triggerAchievementCheck()
      } else {
        await updateDescription(user.id, editValue)
        const trimmed = editValue.trim()
        setLocalDescription(trimmed)
        setAuthDescription(trimmed)
      }
      setEditingField(null)
    } catch (e) {
      setEditError(e instanceof Error ? e.message : 'Erreur lors de la sauvegarde')
    } finally {
      setEditSaving(false)
    }
  }

  async function handleSelectBadge(id: AchievementId | null) {
    if (pickerSlot === null || !user) return
    const prev = localFeatured
    const next = localFeatured.map((b, i) => i === pickerSlot ? id : b) as (AchievementId | null)[]
    const toSave = next.filter((b): b is AchievementId => b !== null)
    setLocalFeatured(next)
    setLocalFeaturedBadges(toSave)
    setPickerSlot(null)
    try {
      await updateFeaturedBadges(user.id, toSave)
    } catch {
      setLocalFeatured(prev)
      setLocalFeaturedBadges(prev.filter((b): b is AchievementId => b !== null))
    }
  }

  const pinnedBadges = localFeatured

  const stats = [
    { label: 'Parties',        value: profile.games_played > 0 ? String(profile.games_played) : '—', accent: 'rgba(255,255,255,0.75)' },
    { label: 'Meilleur score', value: profile.best_comp_score > 0 ? profile.best_comp_score.toLocaleString('fr-FR') : '—', accent: '#fb923c' },
    { label: 'Streak max',     value: profile.best_streak > 0 ? `×${profile.best_streak}` : '—', accent: '#facc15' },
    { label: 'Rang global',    value: profile.rank ? `#${profile.rank}` : '—', accent: '#60a5fa' },
  ]

  const PencilIcon = () => (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  )

  return (
    <div className={hideNav ? 'flex flex-col' : 'flex h-full flex-col bg-game-bg'}>

      {/* ── Barre retour — masquée quand embarqué dans ProfilePage ────────── */}
      {!hideNav && (
        <div className="flex items-center border-b border-game-border px-3 py-2">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-white/35 transition-colors hover:bg-white/5 hover:text-white/70"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Retour
          </button>
        </div>
      )}

      {/* ── Carte identité ────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="flex items-start gap-3 border-b border-game-border px-5 py-4"
      >
        {/* Avatar */}
        {profile.avatar_emoji ? (
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-2xl"
            style={{
              background: `radial-gradient(circle at 35% 35%, ${profile.avatar_color}55, ${profile.avatar_color}22)`,
              border: `2px solid ${profile.avatar_color}80`,
              boxShadow: `0 0 20px ${profile.avatar_color}40`,
            }}
          >
            {profile.avatar_emoji}
          </div>
        ) : (
          <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full">
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(139,92,246,0.22) 0%, rgba(139,92,246,0.06) 55%, transparent 75%)',
                transform: 'scale(1.4)',
              }}
            />
            <div
              className="relative z-10 flex h-full w-full items-center justify-center rounded-full"
              style={{
                background: 'linear-gradient(135deg, rgba(139,92,246,0.3) 0%, rgba(59,130,246,0.18) 100%)',
                border: '2px solid rgba(139,92,246,0.5)',
                boxShadow: '0 0 20px rgba(139,92,246,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
              }}
            >
              <span className="relative z-10 select-none text-lg font-black text-white/90">
                {profile.username[0]?.toUpperCase() ?? '?'}
              </span>
            </div>
          </div>
        )}

        {/* Info */}
        <div className="min-w-0 flex-1">

          {/* ── Pseudo ── */}
          {editingField === 'username' ? (
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5">
                <span className="shrink-0 text-sm font-black text-white/30">@</span>
                <input
                  autoFocus
                  value={editValue}
                  onChange={e => setEditValue(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleSaveEdit(); if (e.key === 'Escape') { setEditingField(null); setEditError(null) } }}
                  className="min-w-0 flex-1 rounded-lg border border-neon-violet/30 bg-white/5 px-2 py-1 text-sm font-black text-white focus:border-neon-violet/60 focus:outline-none"
                  maxLength={20}
                  placeholder="pseudo"
                />
                <button
                  onClick={handleSaveEdit} disabled={editSaving}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-neon-violet/15 text-neon-violet transition-colors hover:bg-neon-violet/25 disabled:opacity-40"
                >
                  {editSaving
                    ? <div className="h-3 w-3 animate-spin rounded-full border border-neon-violet/40 border-t-neon-violet" />
                    : <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  }
                </button>
                <button
                  onClick={() => { setEditingField(null); setEditError(null) }}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white/25 transition-colors hover:bg-white/5 hover:text-white/50"
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
              {editError && <p className="pl-5 text-[10px] text-red-400/80">{editError}</p>}
            </div>
          ) : (
            <div className="group flex flex-wrap items-center gap-2">
              <span className="text-base font-black text-white">@{localUsername}</span>
              {rankLabel && (
                <span className="rounded-full bg-neon-blue/10 px-2 py-0.5 text-[10px] font-bold text-neon-blue">
                  {profile.rank && `#${profile.rank} · `}{rankLabel}
                </span>
              )}
              {isOwnProfile && (
                <button
                  onClick={() => startEdit('username')}
                  className="flex h-5 w-5 items-center justify-center rounded text-white/20 opacity-0 transition-all hover:bg-white/5 hover:text-white/50 group-hover:opacity-100"
                >
                  <PencilIcon />
                </button>
              )}
            </div>
          )}

          {/* ── Description ── */}
          {editingField === 'description' ? (
            <div className="mt-1.5 flex flex-col gap-1.5">
              <textarea
                autoFocus
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                onKeyDown={e => { if (e.key === 'Escape') { setEditingField(null); setEditError(null) } }}
                className="w-full resize-none rounded-lg border border-neon-violet/30 bg-white/5 px-2 py-1.5 text-xs text-white/70 focus:border-neon-violet/60 focus:outline-none"
                maxLength={120}
                rows={2}
                placeholder="Décris-toi en quelques mots…"
              />
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-white/20">{editValue.length}/120</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => { setEditingField(null); setEditError(null) }}
                    className="text-[11px] text-white/30 transition-colors hover:text-white/60"
                  >Annuler</button>
                  <button
                    onClick={handleSaveEdit} disabled={editSaving}
                    className="text-[11px] font-semibold text-neon-violet transition-colors hover:text-neon-violet/70 disabled:opacity-40"
                  >{editSaving ? 'Sauvegarde…' : 'Enregistrer'}</button>
                </div>
              </div>
            </div>
          ) : (
            <div className="group mt-0.5 flex items-center gap-1.5">
              {localDescription ? (
                <p className="min-w-0 truncate text-xs text-white/40">{localDescription}</p>
              ) : (
                <p className="text-xs italic text-white/20">
                  {isOwnProfile ? 'Ajouter une description…' : 'Aucune description'}
                </p>
              )}
              {isOwnProfile && (
                <button
                  onClick={() => startEdit('description')}
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-white/20 opacity-0 transition-all hover:bg-white/5 hover:text-white/50 group-hover:opacity-100"
                >
                  <PencilIcon />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        {!isOwnProfile && (
          <div className="flex shrink-0 items-center pt-0.5">
            {!user ? (
              <div className="group relative">
                <div
                  className="flex cursor-not-allowed items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold select-none"
                  style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.22)' }}
                >
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                    <line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
                  </svg>
                  Ajouter
                </div>
                <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md border border-game-border bg-game-card px-2.5 py-1 text-[10px] font-semibold text-white/40 opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                  Connecte-toi pour ajouter des amis
                </div>
              </div>
            ) : friendStatus === 'accepted' ? (
              <button
                onClick={handleFriendAction}
                disabled={friendLoading}
                className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold transition-all disabled:opacity-50"
                style={{ border: '1px solid rgba(74,222,128,0.35)', background: 'rgba(74,222,128,0.08)', color: 'rgba(74,222,128,0.85)' }}
              >
                {friendLoading
                  ? <div className="h-2.5 w-2.5 animate-spin rounded-full border border-current/40 border-t-current" />
                  : <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                }
                Amis
              </button>
            ) : friendStatus === 'pending' && isRequester ? (
              <button
                onClick={handleFriendAction}
                disabled={friendLoading}
                className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold transition-all disabled:opacity-50"
                style={{ border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.45)' }}
              >
                {friendLoading
                  ? <div className="h-2.5 w-2.5 animate-spin rounded-full border border-current/40 border-t-current" />
                  : <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                }
                En attente…
              </button>
            ) : friendStatus === 'pending' && !isRequester ? (
              <button
                onClick={handleFriendAction}
                disabled={friendLoading}
                className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold transition-all disabled:opacity-50"
                style={{ border: '1px solid rgba(251,191,36,0.35)', background: 'rgba(251,191,36,0.08)', color: 'rgba(251,191,36,0.85)' }}
              >
                {friendLoading
                  ? <div className="h-2.5 w-2.5 animate-spin rounded-full border border-current/40 border-t-current" />
                  : <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                }
                Accepter
              </button>
            ) : (
              <button
                onClick={handleFriendAction}
                disabled={friendLoading}
                className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold transition-all hover:opacity-80 disabled:opacity-50"
                style={{ border: '1px solid rgba(139,92,246,0.4)', background: 'rgba(139,92,246,0.1)', color: 'rgba(196,181,253,0.9)' }}
              >
                {friendLoading
                  ? <div className="h-2.5 w-2.5 animate-spin rounded-full border border-current/40 border-t-current" />
                  : <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                      <line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
                    </svg>
                }
                Ajouter
              </button>
            )}
          </div>
        )}
      </motion.div>

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto pb-8 pt-4" style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>

        {/* ── La Salle ───────────────────────────────────────────────────── */}
        <div className="px-4">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.18, duration: 0.5 }}
            className="relative overflow-hidden rounded-2xl"
            style={{ background: 'radial-gradient(ellipse at 50% -10%, #241545 0%, #120d28 45%, #080614 100%)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div style={{ position: 'absolute', top: -30, left: '50%', transform: 'translateX(-50%)', width: 200, height: 100, background: 'radial-gradient(ellipse, rgba(196,181,253,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />

            {/* Corniche */}
            <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.3, duration: 0.6, ease: 'easeOut' }}
              style={{ position: 'absolute', inset: '44px 0 auto', height: 6, background: 'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)', borderTop: '1px solid rgba(255,255,255,0.12)', borderBottom: '1px solid rgba(255,255,255,0.04)', transformOrigin: 'left' }}
            />

            {/* Contenu mural */}
            <div style={{ padding: '18px 12px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <Blason rank={profile.rank} />
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', gap: 8, width: '100%' }}>
                {pinnedBadges.map((id, i) => (
                  <Banner
                    key={i} id={id} index={i}
                    onClick={isOwnProfile ? () => setPickerSlot(i as 0 | 1 | 2) : undefined}
                  />
                ))}
              </div>
              <Nameplate username={profile.username} title={title} />
              <div style={{ height: 10 }} />
            </div>

            {/* Étagère */}
            <BadgeShelf achievements={profile.achievements} achievementDates={profile.achievement_dates} />

            {/* Sol */}
            <div style={{ position: 'relative', height: 40, background: 'linear-gradient(180deg, rgba(6,4,14,0) 0%, rgba(4,3,10,0.98) 100%)', borderTop: '1px solid rgba(255,255,255,0.04)', overflow: 'hidden' }}>
              <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} preserveAspectRatio="none">
                {[-50,-20,10,40,70,100,130,160,190,220,250,280,310,340,370].map((x, i) => (
                  <line key={i} x1={x} y1="100%" x2="50%" y2="0%" stroke="rgba(255,255,255,0.025)" strokeWidth="1" />
                ))}
              </svg>
            </div>
          </motion.div>
        </div>

        {/* ── Stats ──────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3 px-4 sm:grid-cols-4">
          {stats.map((s, i) => (
            <StatCard key={s.label} label={s.label} value={s.value} accent={s.accent} delay={1.0 + i * 0.07} />
          ))}
        </div>

      </div>

      {/* ── Badge picker ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {pickerSlot !== null && (
          <BadgePicker
            key="picker"
            achievements={profile.achievements}
            currentBadges={localFeatured}
            slotIndex={pickerSlot}
            onSelect={handleSelectBadge}
            onClose={() => setPickerSlot(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Export ───────────────────────────────────────────────────────────────────

export default function PublicProfilePage({ username, onClose, hideNav }: { username: string; onClose: () => void; hideNav?: boolean }) {
  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [status, setStatus]   = useState<'loading' | 'found' | 'not_found'>('loading')

  useEffect(() => {
    if (!username) return
    setStatus('loading')
    getPublicProfile(username).then(data => {
      if (data) {
        setProfile(data)
        setStatus('found')
      } else {
        setStatus('not_found')
      }
    })
  }, [username])

  if (status === 'loading')   return <LoadingState onClose={onClose} hideNav={hideNav} />
  if (status === 'not_found') return <NotFoundState username={username} onClose={onClose} hideNav={hideNav} />
  return <WallPage profile={profile!} onClose={onClose} hideNav={hideNav} />
}
