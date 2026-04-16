import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { COMP_SPEED_TIERS } from '../../constants/game'
import { AvatarContainer } from '../avatar'
import { useAuth } from '../../hooks/useAuth'
import FriendsPanel from '../social/FriendsPanel'
import NotificationBell from '../notifications/NotificationBell'
import { getLevelProgress, getLevelFromXp } from '../../constants/levels'
import { getDailyTheme, getDailyEntry, getDailyStreak, getTodayDate } from '../../services/dailyChallenge'
import type { DailyTheme, DailyEntry, DailyStreak } from '../../types/quiz'
import PulseLogo from '../brand/PulseLogo'

interface ConnectedHeaderProps {
  onShowStats: (tab?: 'stats' | 'leaderboard' | 'daily') => void
  onShowProfile: (tab?: string) => void
  onShowAchievements: () => void
  onSignOut: () => void
  username: string
  onViewProfile: (username: string) => void
  onShowSocial?: () => void
  onShowDaily?: () => void
  onShowCollection?: () => void
}

const dropdownItemClass =
  'flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-white/80 transition-colors hover:bg-white/5 hover:text-white text-left'

const dropdownStyle = {
  background: 'rgba(19,19,31,0.96)',
  border: '1px solid rgba(255,255,255,0.1)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(139,92,246,0.1)',
  backdropFilter: 'blur(20px)',
}

// ─── Countdown helper ─────────────────────────────────────────────────────────

function useCountdown() {
  const [remaining, setRemaining] = useState('')
  useEffect(() => {
    function calc() {
      const now = new Date()
      const midnight = new Date()
      midnight.setUTCHours(24, 0, 0, 0)
      const diff = midnight.getTime() - now.getTime()
      if (diff <= 0) { setRemaining('0h'); return }
      const h = Math.floor(diff / 3_600_000)
      const m = Math.floor((diff % 3_600_000) / 60_000)
      setRemaining(h > 0 ? `${h}h ${m}min` : `${m}min`)
    }
    calc()
    const id = setInterval(calc, 60_000)
    return () => clearInterval(id)
  }, [])
  return remaining
}

export default function ConnectedHeader({
  onShowStats,
  onShowProfile,
  onSignOut,
  username,
  onViewProfile,
  onShowSocial,
  onShowDaily,
}: ConnectedHeaderProps) {
  const { user, totalXp } = useAuth()
  const xpData = getLevelProgress(totalXp)
  const level  = getLevelFromXp(totalXp)

  // ── Dropdown states ───────────────────────────────────────────────────────
  const [navIconOpen,      setNavIconOpen]      = useState(false)
  const [mobileAvatarOpen, setMobileAvatarOpen] = useState(false)
  const [navOpen,          setNavOpen]          = useState(false)

  const navIconRef       = useRef<HTMLDivElement>(null)
  const avatarMobileRef  = useRef<HTMLDivElement>(null)
  const navRef           = useRef<HTMLDivElement>(null)

  const countdown = useCountdown()
  const [showDailyInfo, setShowDailyInfo] = useState(false)

  // ── Fetch daily state ──────────────────────────────────────────────────────
  const [dailyTheme, setDailyTheme]   = useState<DailyTheme | null>(null)
  const [dailyEntry, setDailyEntry]   = useState<DailyEntry | null>(null)
  const [dailyStreak, setDailyStreak] = useState<DailyStreak | null>(null)

  useEffect(() => {
    getDailyTheme().then(setDailyTheme).catch(() => {})
  }, [])

  useEffect(() => {
    if (!user) return
    const today = getTodayDate()
    getDailyEntry(user.id, today).then(setDailyEntry).catch(() => {})
    getDailyStreak(user.id).then(setDailyStreak).catch(() => {})
  }, [user])

  const isCompleted = dailyEntry !== null && dailyEntry !== undefined

  // ── Click-outside handler ──────────────────────────────────────────────────
  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (navIconRef.current       && !navIconRef.current.contains(e.target as Node))        setNavIconOpen(false)
      if (avatarMobileRef.current  && !avatarMobileRef.current.contains(e.target as Node))   setMobileAvatarOpen(false)
      if (navRef.current           && !navRef.current.contains(e.target as Node))            setNavOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [])

  function closeAll() {
    setNavIconOpen(false); setMobileAvatarOpen(false); setNavOpen(false)
  }

  return (
    <>
    {/* ── Nav bar ── */}
    <motion.nav
      className="absolute inset-x-0 top-0 z-20 flex h-14 items-center justify-between border-b border-white/10 bg-game-bg/70 px-4 backdrop-blur-md sm:px-8"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      {/* ── Gauche : logo + défi journalier ── */}
      <div className="flex items-center gap-3 sm:gap-5">
        <span className="flex select-none items-center gap-1.5 text-base font-black tracking-tight text-white">
          <PulseLogo size={24} />
          <span className="hidden sm:inline">Pulse<span className="text-neon-violet">Quizz</span></span>
        </span>

        {/* Défi journalier — visible sur tous les écrans */}
        <DailyNavButton
          isCompleted={isCompleted}
          score={dailyEntry?.score ?? null}
          countdown={countdown}
          hasTheme={!!dailyTheme}
          onClick={() => onShowDaily?.()}
          onShowInfo={() => setShowDailyInfo(true)}
        />
      </div>

      {/* ── Droite desktop ── */}
      <div className="hidden items-center gap-2 sm:flex">
        {/* Nav icon — classement, journalier, achievements */}
        <div ref={navIconRef} className="relative">
          <button
            type="button"
            onClick={() => setNavIconOpen(v => !v)}
            aria-label="Navigation"
            aria-expanded={navIconOpen}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/50 transition-colors hover:border-neon-violet/40 hover:text-white focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-neon-violet/60"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <rect x="3"  y="3"  width="7" height="7" rx="1.5"/>
              <rect x="14" y="3"  width="7" height="7" rx="1.5"/>
              <rect x="3"  y="14" width="7" height="7" rx="1.5"/>
              <rect x="14" y="14" width="7" height="7" rx="1.5"/>
            </svg>
          </button>

          {navIconOpen && (
            <div className="absolute right-0 top-11 z-50 min-w-[200px] overflow-hidden rounded-xl py-1.5" style={dropdownStyle}>
              <button type="button" onClick={() => { onShowStats('leaderboard'); closeAll() }} className={dropdownItemClass}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                Classement
              </button>
              <button type="button" onClick={() => { onShowProfile('stats'); closeAll() }} className={dropdownItemClass}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                Statistiques
              </button>
              <button type="button" onClick={() => { onShowProfile('achievements'); closeAll() }} className={dropdownItemClass}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>
                Achievements
              </button>
              <button type="button" onClick={() => { onShowProfile('collection'); closeAll() }} className={dropdownItemClass}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/></svg>
                Collections
              </button>
            </div>
          )}
        </div>

        {user && (
          <FriendsPanel
            userId={user.id}
            onViewProfile={u => onViewProfile(u)}
            onShowSocialPage={onShowSocial ?? (() => {})}
          />
        )}

        {user && <NotificationBell userId={user.id} />}

        {/* Username — accès direct au profil */}
        <button
          type="button"
          onClick={() => { onShowProfile(); closeAll() }}
          className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2.5 transition-colors hover:bg-white/5 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-neon-violet/60"
        >
          <div className="relative flex-shrink-0">
            <AvatarContainer className="h-7 w-7" />
            {level > 0 && (
              <div
                className="absolute -bottom-1 -right-1 z-10 flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-black text-white leading-none"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)', border: '1.5px solid rgba(10,7,20,1)' }}
              >
                {level}
              </div>
            )}
          </div>
          <span className="text-xs font-bold text-white/60">@{username}</span>
        </button>

        {/* Déconnexion directe */}
        <button
          type="button"
          onClick={() => onSignOut()}
          title="Se déconnecter"
          className="flex h-7 w-7 items-center justify-center text-white/25 transition-colors hover:text-red-400 focus:outline-none"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        </button>
      </div>

      {/* ── Mobile right section ── */}
      <div className="flex items-center gap-2 sm:hidden">
        {/* Nav dropdown (Classement / Achievements) */}
        <div ref={navRef} className="relative">
          <button
            type="button"
            onClick={() => { setNavOpen(v => !v); setMobileAvatarOpen(false) }}
            aria-label="Menu de navigation"
            aria-expanded={navOpen}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/60 transition-colors hover:border-neon-violet/40 hover:text-white/90 focus:outline-none"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <rect x="3"  y="3"  width="7" height="7" rx="1.5"/>
              <rect x="14" y="3"  width="7" height="7" rx="1.5"/>
              <rect x="3"  y="14" width="7" height="7" rx="1.5"/>
              <rect x="14" y="14" width="7" height="7" rx="1.5"/>
            </svg>
          </button>

          {navOpen && (
            <div className="absolute right-0 top-11 z-50 min-w-[180px] overflow-hidden rounded-xl py-1.5" style={dropdownStyle}>
              <button type="button" onClick={() => { onShowStats('leaderboard'); closeAll() }} className={dropdownItemClass}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                Classement
              </button>
              <button type="button" onClick={() => { onShowProfile('stats'); closeAll() }} className={dropdownItemClass}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                Statistiques
              </button>
              <button type="button" onClick={() => { onShowProfile('achievements'); closeAll() }} className={dropdownItemClass}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>
                Achievements
              </button>
              <button type="button" onClick={() => { onShowProfile('collection'); closeAll() }} className={dropdownItemClass}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/></svg>
                Collections
              </button>
            </div>
          )}
        </div>

        {/* Amis */}
        {user && (
          <FriendsPanel
            userId={user.id}
            onViewProfile={u => onViewProfile(u)}
            onShowSocialPage={onShowSocial ?? (() => {})}
          />
        )}

        {/* Notifications */}
        {user && <NotificationBell userId={user.id} />}

        {/* Avatar dropdown (mobile) */}
        <div ref={avatarMobileRef} className="relative">
          <button
            type="button"
            onClick={() => { setMobileAvatarOpen(v => !v); setNavOpen(false) }}
            aria-label={`Menu de ${username}`}
            aria-expanded={mobileAvatarOpen}
            className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-white/10 transition-colors hover:border-neon-violet/40 focus:outline-none"
          >
            <AvatarContainer className="h-full w-full" />
          </button>

          {mobileAvatarOpen && (
            <div className="absolute right-0 top-11 z-50 min-w-[180px] overflow-hidden rounded-xl py-1.5" style={dropdownStyle}>
              <div className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white/30">
                @{username}
              </div>
              <div className="border-t border-white/[0.06]" />
              <button type="button" onClick={() => { onShowProfile(); closeAll() }} className={dropdownItemClass}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                Mon compte
              </button>
              <div className="border-t border-white/[0.06]" />
              <button type="button" onClick={() => { onSignOut(); closeAll() }} className={`${dropdownItemClass} text-red-400/80 hover:text-red-400`}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                Se déconnecter
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.nav>

    {/* ── Unified sub-header : XP + défi journalier — même ligne ── */}
    {user && (
      <motion.div
        className="absolute inset-x-0 top-14 z-10 flex h-8 items-center border-b border-white/[0.05] bg-game-bg/80 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.5 }}
      >
        {/* Daily theme (left, clickable) */}
        {dailyTheme ? (
          <button
            type="button"
            onClick={() => onShowDaily?.()}
            className="flex min-w-0 flex-1 items-center gap-2 px-4 text-left transition-colors hover:bg-white/[0.02] h-full"
          >
            <span className="shrink-0 text-sm leading-none">{dailyTheme.emoji}</span>
            <span className="shrink-0 text-[10px] font-bold uppercase tracking-widest text-white/30">
              {new Date(dailyTheme.date + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
            </span>
            <span className="text-white/[0.08] shrink-0">·</span>
            <span className="truncate text-[11px] font-semibold text-white/55">
              {dailyTheme.title}
            </span>
            <div className="ml-auto shrink-0 pl-3">
              {isCompleted ? (
                <span className="flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-[9px] font-bold text-green-400">
                  🔥 {dailyStreak?.current_streak ?? 0} jours
                </span>
              ) : (
                <span className="text-[9px] text-white/20">{countdown}</span>
              )}
            </div>
          </button>
        ) : (
          <div className="flex-1" />
        )}

        {/* XP bar (right) */}
        <div className="flex shrink-0 items-center gap-2 px-4 sm:border-l sm:border-white/[0.05] sm:ml-2">
          <span className="shrink-0 text-[9px] font-black text-neon-violet/70">Niv.{xpData.level}</span>
          <div className="h-1 w-16 overflow-hidden rounded-full bg-white/10 sm:w-20">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${xpData.percentage}%`, background: 'linear-gradient(90deg, #7c3aed, #2563eb)' }}
            />
          </div>
          <span className="hidden tabular-nums text-[9px] text-white/25 sm:block">
            {xpData.progressXp.toLocaleString('fr-FR')}&thinsp;/&thinsp;{xpData.neededXp.toLocaleString('fr-FR')}
          </span>
        </div>
      </motion.div>
    )}
      {/* ── Daily info modal ── */}
      <AnimatePresence>
        {showDailyInfo && (
          <>
            <motion.div
              key="daily-info-backdrop"
              className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => setShowDailyInfo(false)}
            />
            <motion.div
              key="daily-info-modal"
              className="fixed inset-0 z-[70] flex items-center justify-center px-4"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <motion.div
                className="relative w-full max-w-sm rounded-2xl border border-neon-violet/20 bg-[#0d0d18] p-6 shadow-[0_0_40px_rgba(139,92,246,0.15)]"
                initial={{ scale: 0.92, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 8 }}
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">📅</span>
                    <h2 className="text-base font-black text-neon-violet">Défi Journalier</h2>
                  </div>
                  <button
                    onClick={() => setShowDailyInfo(false)}
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/40 transition-colors hover:border-white/20 hover:text-white/70"
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>
                <div className="flex flex-col gap-3 text-sm text-white/60">
                  <div className="flex flex-col gap-2">
                    {[
                      { icon: '📅', text: '10 questions thématiques — une seule tentative par jour' },
                      { icon: '⚡', text: 'Réponds vite pour multiplier tes points — même système que le mode compétitif' },
                      { icon: '✓', text: 'Pas d\'élimination — la partie continue même sur une mauvaise réponse' },
                      { icon: '🔥', text: 'Ton multiplicateur XP augmente avec ta série de jours consécutifs' },
                    ].map((rule, i) => (
                      <div key={i} className="flex items-start gap-3 rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2.5">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center text-base leading-none">{rule.icon}</span>
                        <span className="leading-snug">{rule.text}</span>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-xl border border-neon-violet/15 bg-neon-violet/5 p-3">
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-neon-violet/60">Multiplicateurs de vitesse</p>
                    <div className="flex flex-col gap-1">
                      {COMP_SPEED_TIERS.map(t => {
                        const label = t.maxTime === Infinity ? '> 8s' : `≤ ${t.maxTime}s`
                        const color = t.multiplier >= 3 ? 'text-yellow-400' : t.multiplier >= 2 ? 'text-purple-400' : t.multiplier >= 1.5 ? 'text-blue-400' : t.multiplier >= 1.2 ? 'text-white/50' : 'text-white/30'
                        return (
                          <div key={t.maxTime} className="flex items-center justify-between">
                            <span className="text-xs text-white/40">{label}</span>
                            <span className={`text-xs font-bold ${color}`}>×{t.multiplier}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
                <motion.button
                  onClick={() => setShowDailyInfo(false)}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  className="mt-5 w-full rounded-xl bg-gradient-to-r from-neon-violet to-neon-blue py-2.5 text-sm font-bold text-white shadow-[0_0_20px_rgba(139,92,246,0.3)]"
                >
                  Compris !
                </motion.button>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

// ─── DailyNavButton (desktop) ─────────────────────────────────────────────────

interface DailyNavButtonProps {
  isCompleted: boolean
  score: number | null
  countdown: string
  hasTheme: boolean
  onClick: () => void
  onShowInfo: () => void
}

function DailyNavButton({ isCompleted, score, countdown, hasTheme, onClick, onShowInfo }: DailyNavButtonProps) {
  if (!hasTheme) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-left transition-colors hover:border-white/20 hover:bg-white/[0.06]"
      >
        <span className="text-sm">📅</span>
        <div>
          <div className="text-[11px] font-bold text-white/50">Défi journalier</div>
          <div className="text-[9px] text-white/25">Pas de défi aujourd'hui</div>
        </div>
      </button>
    )
  }

  if (isCompleted) {
    return (
      <div className="relative">
        <button
          type="button"
          onClick={onClick}
          className="flex items-center gap-2 rounded-lg border border-green-500/25 bg-green-500/[0.06] px-3 py-1.5 text-left transition-colors hover:border-green-500/40 hover:bg-green-500/10"
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500/20 text-[10px]">✓</span>
          <div>
            <div className="text-[11px] font-bold text-green-400">Défi journalier</div>
            <div className="text-[9px] text-white/30">{score !== null ? `${score.toLocaleString('fr-FR')} pts` : '—'}</div>
          </div>
        </button>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onShowInfo() }}
          aria-label="Règles du défi journalier"
          className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full border border-neon-violet/30 bg-[#0d0d18] text-[10px] font-bold text-neon-violet/70 transition-colors hover:border-neon-violet/60 hover:text-neon-violet"
        >
          i
        </button>
      </div>
    )
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onClick}
        className="relative flex items-center gap-2 rounded-lg border border-neon-violet/30 bg-neon-violet/[0.06] px-3 py-1.5 text-left transition-colors hover:border-neon-violet/50 hover:bg-neon-violet/10"
      >
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-500" />
        </span>
        <div>
          <div className="text-[11px] font-bold text-neon-violet/90">Défi journalier</div>
          <div className="text-[9px] text-white/30">Non joué · {countdown}</div>
        </div>
      </button>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onShowInfo() }}
        aria-label="Règles du défi journalier"
        className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full border border-neon-violet/30 bg-[#0d0d18] text-[10px] font-bold text-neon-violet/70 transition-colors hover:border-neon-violet/60 hover:text-neon-violet"
      >
        i
      </button>
    </div>
  )
}
