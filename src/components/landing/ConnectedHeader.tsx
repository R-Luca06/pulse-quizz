import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { AvatarContainer } from '../avatar'
import { useAuth } from '../../hooks/useAuth'
import FriendsPanel from '../social/FriendsPanel'
import NotificationBell from '../notifications/NotificationBell'
import { getLevelProgress, getLevelFromXp } from '../../constants/levels'

interface ConnectedHeaderProps {
  onShowStats: (tab?: 'stats' | 'leaderboard') => void
  onShowProfile: () => void
  onShowAchievements: () => void
  onSignOut: () => void
  username: string
  onViewProfile: (username: string) => void
  onShowSocial?: () => void
}

const navLinkClass =
  'rounded-md px-2 py-1 text-sm font-bold tracking-wide text-white/75 transition-colors hover:text-white focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neon-violet/60'

const dropdownItemClass =
  'flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-white/80 transition-colors hover:bg-white/5 hover:text-white text-left'

export default function ConnectedHeader({
  onShowStats,
  onShowProfile,
  onShowAchievements,
  onSignOut,
  username,
  onViewProfile,
  onShowSocial,
}: ConnectedHeaderProps) {
  const { user, totalXp } = useAuth()
  const xpData = getLevelProgress(totalXp)
  const level  = getLevelFromXp(totalXp)
  const [navOpen, setNavOpen] = useState(false)
  const [avatarOpen, setAvatarOpen] = useState(false)
  const navRef = useRef<HTMLDivElement>(null)
  const avatarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setNavOpen(false)
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) setAvatarOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [])

  function closeAll() {
    setNavOpen(false)
    setAvatarOpen(false)
  }

  return (
    <>
    <motion.nav
      className="absolute inset-x-0 top-0 z-20 flex h-14 items-center justify-between border-b border-white/10 bg-game-bg/70 px-4 backdrop-blur-md sm:px-8"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      {/* ── Gauche : logo + nav (desktop) ── */}
      <div className="flex items-center gap-8">
        <span className="select-none text-base font-black tracking-tight text-white">
          Pulse<span className="text-neon-violet">Quizz</span>
        </span>

        <div className="hidden items-center gap-1 sm:flex">
          <button type="button" onClick={() => onShowStats('leaderboard')} aria-label="Voir le classement" className={navLinkClass}>
            Classement
          </button>
          <button type="button" onClick={() => onShowStats('stats')} aria-label="Voir les statistiques" className={navLinkClass}>
            Stats
          </button>
          <button type="button" onClick={onShowAchievements} aria-label="Voir les achievements" className={navLinkClass}>
            Achievements
          </button>
        </div>
      </div>

      {/* ── Droite : user chip (desktop) ── */}
      <div className="hidden items-center gap-2 sm:flex">
        {user && (
          <FriendsPanel
            userId={user.id}
            onViewProfile={username => { onViewProfile(username) }}
            onShowSocialPage={onShowSocial ?? (() => {})}
          />
        )}
        {user && <NotificationBell userId={user.id} />}
        <button
          type="button"
          onClick={onShowProfile}
          aria-label={`Ouvrir le profil de ${username}`}
          className="group flex items-center gap-2 rounded-full py-1 pl-1 pr-3 text-sm font-semibold text-white/80 transition-colors hover:text-white focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neon-violet/60"
        >
          <div className="relative flex-shrink-0">
            <AvatarContainer className="h-7 w-7" />
            {level > 0 && (
              <div
                className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-black text-white leading-none"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)', border: '1.5px solid rgba(10,7,20,1)' }}
              >
                {level}
              </div>
            )}
          </div>
          <span className="underline decoration-white/20 decoration-1 underline-offset-4 transition-colors group-hover:decoration-neon-violet">
            @{username}
          </span>
        </button>
        <button
          type="button"
          onClick={onSignOut}
          aria-label="Se déconnecter"
          className="flex h-7 w-7 items-center justify-center rounded-full text-white/40 transition-colors hover:text-white/80 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neon-violet/60"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </div>

      {/* ── Mobile right section (< sm) ── */}
      <div className="flex items-center gap-2 sm:hidden">

        {/* Nav menu dropdown */}
        <div ref={navRef} className="relative">
          <button
            type="button"
            onClick={() => { setNavOpen(v => !v); setAvatarOpen(false) }}
            aria-label="Menu de navigation"
            aria-expanded={navOpen}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60 transition-colors hover:border-neon-violet/40 hover:text-white/90 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-neon-violet/60"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          {navOpen && (
            <div
              className="absolute right-0 top-11 z-50 min-w-[180px] overflow-hidden rounded-xl py-1.5"
              style={{
                background: 'rgba(19,19,31,0.96)',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(139,92,246,0.1)',
                backdropFilter: 'blur(20px)',
              }}
            >
              <button type="button" onClick={() => { onShowStats('leaderboard'); closeAll() }} className={dropdownItemClass}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
                Classement
              </button>
              <button type="button" onClick={() => { onShowStats('stats'); closeAll() }} className={dropdownItemClass}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="18" y="3" width="4" height="18" rx="1" />
                  <rect x="10" y="8" width="4" height="13" rx="1" />
                  <rect x="2" y="13" width="4" height="8" rx="1" />
                </svg>
                Stats
              </button>
              <button type="button" onClick={() => { onShowAchievements(); closeAll() }} className={dropdownItemClass}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="8" r="6" />
                  <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
                </svg>
                Achievements
              </button>
            </div>
          )}
        </div>

        {/* Avatar dropdown */}
        <div ref={avatarRef} className="relative">
          <button
            type="button"
            onClick={() => { setAvatarOpen(v => !v); setNavOpen(false) }}
            aria-label={`Menu de ${username}`}
            aria-expanded={avatarOpen}
            className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-white/10 transition-colors hover:border-neon-violet/40 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-neon-violet/60"
          >
            <AvatarContainer className="h-full w-full" />
          </button>

          {avatarOpen && (
            <div
              className="absolute right-0 top-11 z-50 min-w-[180px] overflow-hidden rounded-xl py-1.5"
              style={{
                background: 'rgba(19,19,31,0.96)',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(139,92,246,0.1)',
                backdropFilter: 'blur(20px)',
              }}
            >
              <div className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white/30">
                @{username}
              </div>
              <div className="border-t border-white/[0.06]" />
              <button type="button" onClick={() => { onShowProfile(); closeAll() }} className={dropdownItemClass}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                Mon compte
              </button>
              <div className="border-t border-white/[0.06]" />
              <button type="button" onClick={() => { onSignOut(); closeAll() }} className={`${dropdownItemClass} text-red-400/80 hover:text-red-400`}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Se déconnecter
              </button>
            </div>
          )}
        </div>

        {/* Social (FriendsPanel) */}
        {user && (
          <FriendsPanel
            userId={user.id}
            onViewProfile={username => { onViewProfile(username) }}
            onShowSocialPage={onShowSocial ?? (() => {})}
          />
        )}

        {/* Cloche notifications — rightmost = dropdown aligné bord droit écran */}
        {user && <NotificationBell userId={user.id} />}

      </div>
    </motion.nav>

    {/* ── Étiquette XP desktop — dépasse sous la navbar à droite ────── */}
    {user && (
      <motion.div
        className="absolute right-8 top-14 z-10 hidden sm:flex items-center gap-2 rounded-b-lg border border-t-0 border-white/10 bg-game-bg/90 px-3 py-1.5 backdrop-blur-sm"
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.6 }}
      >
        <span className="shrink-0 text-[9px] font-black text-neon-violet/70">Niv.{xpData.level}</span>
        <div className="h-1 w-20 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${xpData.percentage}%`, background: 'linear-gradient(90deg, #7c3aed, #2563eb)' }}
          />
        </div>
        <span className="shrink-0 tabular-nums text-[9px] text-white/25">
          {xpData.progressXp.toLocaleString('fr-FR')}&thinsp;/&thinsp;{xpData.neededXp.toLocaleString('fr-FR')}
        </span>
      </motion.div>
    )}

    {/* ── Bande XP mobile — masquée à partir de sm ───────────────────── */}
    {user && (
      <motion.div
        className="absolute inset-x-0 top-14 z-10 flex items-center gap-2.5 border-b border-white/[0.05] bg-game-bg/80 px-4 py-1.5 backdrop-blur-sm sm:hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.5 }}
      >
        <span className="shrink-0 text-[10px] font-black text-neon-violet/80">Niv.{xpData.level}</span>
        <div className="flex-1 h-1 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${xpData.percentage}%`, background: 'linear-gradient(90deg, #7c3aed, #2563eb)' }}
          />
        </div>
        <span className="shrink-0 tabular-nums text-[10px] text-white/25">
          {xpData.progressXp.toLocaleString('fr-FR')}&thinsp;/&thinsp;{xpData.neededXp.toLocaleString('fr-FR')} XP
        </span>
      </motion.div>
    )}
    </>
  )
}
