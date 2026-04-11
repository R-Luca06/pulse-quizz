import { useEffect, useState } from 'react'
import { motion, useAnimationControls, AnimatePresence } from 'framer-motion'
import FloatingCardsBackground from './FloatingCardsBackground'
import StartButton from './StartButton'
import SettingsModal from './SettingsModal'
import RulesModal from './RulesModal'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../contexts/ToastContext'
import type { AppScreen } from '../../App'
import type { GameSettings } from '../../hooks/useSettings'

export type LaunchPhase = 'idle' | 'converging' | 'shaking' | 'exploding'

interface Props {
  settings: GameSettings
  onSettingsChange: (patch: Partial<GameSettings>) => void
  onStart: () => void
  onExplosion: () => void
  screen: AppScreen
  autoOpenSettings?: boolean
  onShowStats: (tab?: 'stats' | 'leaderboard') => void
  onOpenAuth: () => void
  onShowProfile: () => void
}

export default function LandingPage({ settings, onSettingsChange, onStart, onExplosion, screen, autoOpenSettings, onShowStats, onOpenAuth, onShowProfile }: Props) {
  const { user, profile, signOut } = useAuth()
  const toast = useToast()
  const isLaunching = screen === 'launching'
  const [launchPhase, setLaunchPhase] = useState<LaunchPhase>('idle')
  const shakeControls = useAnimationControls()

  const [openSettings, setOpenSettings] = useState(autoOpenSettings ?? false)
  const [showRules, setShowRules] = useState(false)

  useEffect(() => {
    if (!isLaunching) {
      setLaunchPhase('idle')
      return
    }
    setLaunchPhase('converging')
    const t = setTimeout(async () => {
      setLaunchPhase('shaking')
      await shakeControls.start({
        x: [0, -18, 18, -14, 14, -9, 9, -5, 5, 0],
        transition: { duration: 0.32, ease: 'linear' },
      })
      setLaunchPhase('exploding')
      onExplosion()
    }, 380)
    return () => clearTimeout(t)
  }, [isLaunching, shakeControls])

  function handleLaunch() {
    setOpenSettings(false)
    onStart()
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-game-bg">
      {/* Background blobs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/4 top-1/4 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-neon-violet/10 blur-3xl" />
        <div className="absolute right-1/4 bottom-1/4 h-96 w-96 translate-x-1/2 translate-y-1/2 rounded-full bg-neon-blue/10 blur-3xl" />
      </div>

      {/* Cards + shake wrapper */}
      <motion.div animate={shakeControls} className="absolute inset-0">
        <FloatingCardsBackground launchPhase={launchPhase} />
      </motion.div>

      {/* Flash */}
      {launchPhase === 'exploding' && (
        <motion.div
          className="pointer-events-none absolute inset-0 z-20 bg-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.3, 0] }}
          transition={{ duration: 0.45 }}
        />
      )}

      {/* Top nav bar */}
      <motion.nav
        className="absolute inset-x-0 top-0 z-10 flex h-14 items-center justify-between px-4 sm:px-6"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        {/* Wordmark */}
        <span className="select-none text-sm font-black tracking-tight text-white/70">
          Pulse<span className="text-neon-violet">Quizz</span>
        </span>

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onShowStats('leaderboard')}
            aria-label="Voir le classement"
            className="group flex h-8 items-center overflow-hidden rounded-full border border-white/20 bg-white/[0.08] pl-[9px] pr-[9px] text-white/60 transition-[border-color,color,padding] duration-300 ease-in-out hover:border-white/35 hover:pr-3 hover:text-white/80"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
              <path d="M8 6h8M8 12h8M8 18h8M3 6h.01M3 12h.01M3 18h.01"/>
            </svg>
            <span className="max-w-0 overflow-hidden whitespace-nowrap text-xs font-semibold transition-[max-width,margin,opacity] duration-300 ease-in-out [opacity:0] group-hover:ml-1.5 group-hover:max-w-[80px] group-hover:[opacity:1] group-hover:[transition-delay:60ms]">
              Classement
            </span>
          </button>
          <button
            onClick={() => onShowStats('stats')}
            aria-label="Voir les statistiques"
            className="group flex h-8 items-center overflow-hidden rounded-full border border-white/20 bg-white/[0.08] pl-[9px] pr-[9px] text-white/60 transition-[border-color,color,padding] duration-300 ease-in-out hover:border-white/35 hover:pr-3 hover:text-white/80"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
              <rect x="18" y="3" width="4" height="18" rx="1"/>
              <rect x="10" y="8" width="4" height="13" rx="1"/>
              <rect x="2" y="13" width="4" height="8" rx="1"/>
            </svg>
            <span className="max-w-0 overflow-hidden whitespace-nowrap text-xs font-semibold transition-[max-width,margin,opacity] duration-300 ease-in-out [opacity:0] group-hover:ml-1.5 group-hover:max-w-[80px] group-hover:[opacity:1] group-hover:[transition-delay:60ms]">
              Statistiques
            </span>
          </button>

          {/* Separator */}
          <div className="mx-1 h-4 w-px bg-white/10" />

          {/* Auth */}
          {user ? (
            <div className="flex items-center gap-2">
              <button
                onClick={onShowProfile}
                className="select-none cursor-pointer text-xs font-semibold text-white/70 transition-colors hover:text-white"
              >
                @{profile?.username}
              </button>
              <button
                onClick={() => signOut().then(() => toast.success('Déconnecté'))}
                aria-label="Se déconnecter"
                className="flex h-7 w-7 items-center justify-center rounded-full border border-white/20 bg-white/5 text-white/60 transition-colors hover:border-white/35 hover:text-white/80"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              aria-label="Se connecter"
              className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5 text-xs font-semibold text-white/65 transition-colors hover:border-white/25 hover:text-white/80"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              Connexion
            </button>
          )}
        </div>
      </motion.nav>

      {/* Hero */}
      <motion.div
        className="relative z-10 flex flex-col items-center gap-8 text-center"
        animate={
          isLaunching
            ? { opacity: 0, scale: 0.85, transition: { duration: 0.25 } }
            : { opacity: 1, scale: 1 }
        }
      >
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="rounded-full border border-neon-violet/30 bg-neon-violet/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-neon-violet"
        >
          Teste tes connaissances · Ressens l'adrénaline
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
        >
          <h1 className="text-4xl font-black tracking-tight text-white sm:text-6xl md:text-7xl lg:text-8xl">
            Pulse
            <span className="bg-gradient-to-r from-neon-violet to-neon-blue bg-clip-text text-transparent">
              {' '}Quizz
            </span>
          </h1>
        </motion.div>

        {/* Play button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.5, type: 'spring', stiffness: 200 }}
        >
          <StartButton onClick={() => setOpenSettings(true)} />
        </motion.div>
      </motion.div>

      {/* Modals */}
      <AnimatePresence>
        {openSettings && (
          <SettingsModal
            key="settings"
            settings={settings}
            onSettingsChange={onSettingsChange}
            onLaunch={handleLaunch}
            onClose={() => setOpenSettings(false)}
            onShowRules={() => setShowRules(true)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showRules && (
          <RulesModal key="rules" onClose={() => setShowRules(false)} />
        )}
      </AnimatePresence>
    </div>
  )
}
