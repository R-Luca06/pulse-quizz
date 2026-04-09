import { useEffect, useState } from 'react'
import { motion, useAnimationControls, AnimatePresence } from 'framer-motion'
import FloatingCardsBackground from './FloatingCardsBackground'
import StartButton from './StartButton'
import { getMuted, setMuted } from '../../utils/sounds'
import { CATEGORIES, MODES, DIFFICULTIES, LANGUAGES, btnBase, btnSelected, btnIdle } from '../../constants/quiz'
import { useSettings } from '../../hooks/useSettings'
import type { AppScreen } from '../../App'
import type { Category } from '../../types/quiz'

export type LaunchPhase = 'idle' | 'converging' | 'shaking' | 'exploding'

interface Props {
  onStart: (mode: GameMode, difficulty: Difficulty, language: Language, category: Category) => void
  onExplosion: () => void
  screen: AppScreen
  autoOpenSettings?: boolean
  onShowStats: () => void
}

export default function LandingPage({ onStart, onExplosion, screen, autoOpenSettings, onShowStats }: Props) {
  const isLaunching = screen === 'launching'
  const [launchPhase, setLaunchPhase] = useState<LaunchPhase>('idle')
  const shakeControls = useAnimationControls()

  const { settings, update } = useSettings()
  const { mode, difficulty, language, category } = settings
  const [openSettings, setOpenSettings] = useState(autoOpenSettings ?? false)
  const [muted, setMutedState]    = useState(getMuted)

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

  function handleMuteToggle() {
    const next = !muted
    setMuted(next)
    setMutedState(next)
  }

  function handleLaunch() {
    setOpenSettings(false)
    onStart(mode, difficulty, language, category)
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

      {/* Stats button */}
      <motion.button
        onClick={onShowStats}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        aria-label="Voir les statistiques"
        className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/30 transition-colors hover:border-white/20 hover:text-white/60"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="18" y="3" width="4" height="18" rx="1"/>
          <rect x="10" y="8" width="4" height="13" rx="1"/>
          <rect x="2" y="13" width="4" height="8" rx="1"/>
        </svg>
      </motion.button>

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

      {/* Settings popup */}
      <AnimatePresence>
        {openSettings && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setOpenSettings(false)}
            />

            {/* Modal */}
            <motion.div
              key="modal"
              className="fixed inset-0 z-50 flex items-center justify-center px-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <motion.div
                className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-[#0d0d18] p-6 shadow-2xl"
                initial={{ scale: 0.92, y: 16 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 8 }}
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal header */}
                <div className="mb-5 flex items-center justify-between">
                  <button
                    onClick={handleMuteToggle}
                    aria-label={muted ? 'Activer le son' : 'Couper le son'}
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/40 transition-colors hover:border-white/20 hover:text-white/70"
                  >
                    {muted ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                        <line x1="23" y1="9" x2="17" y2="15"/>
                        <line x1="17" y1="9" x2="23" y2="15"/>
                      </svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                        <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                        <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
                      </svg>
                    )}
                  </button>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Paramètres</p>
                  <button
                    onClick={() => setOpenSettings(false)}
                    aria-label="Fermer les paramètres"
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/40 transition-colors hover:border-white/20 hover:text-white/70"
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>

                <div className="flex flex-col gap-5">
                  {/* Mode */}
                  <div className="flex flex-col gap-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Mode</p>
                    <div className="flex gap-2">
                      {MODES.map(m => (
                        <button
                          key={m.value}
                          onClick={() => update({ mode: m.value })}
                          className={[btnBase, 'flex flex-col items-start gap-0.5 px-4 py-3', mode === m.value ? btnSelected : btnIdle].join(' ')}
                        >
                          <span className="font-bold">{m.label}</span>
                          <span className="text-xs opacity-60">{m.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Niveau */}
                  <div className="flex flex-col gap-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Niveau</p>
                    <div className="flex gap-2">
                      {DIFFICULTIES.map(d => (
                        <button
                          key={d.value}
                          onClick={() => update({ difficulty: d.value })}
                          className={[btnBase, difficulty === d.value ? btnSelected : btnIdle].join(' ')}
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Catégorie */}
                  <div className="flex flex-col gap-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Catégorie</p>
                    <div className="relative">
                      <select
                        value={String(category)}
                        onChange={(e) => {
                          const v = e.target.value
                          update({ category: v === 'all' ? 'all' : Number(v) as Category })
                        }}
                        aria-label="Catégorie de questions"
                        className="w-full appearance-none rounded-xl border border-white/10 bg-white/5 py-3 pl-4 pr-10 text-sm font-semibold text-white focus:border-neon-violet/60 focus:outline-none"
                      >
                        {CATEGORIES.map(c => (
                          <option key={String(c.value)} value={String(c.value)} className="bg-[#0d0d18]">
                            {c.label}
                          </option>
                        ))}
                      </select>
                      <svg
                        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/30"
                        width="12" height="12" viewBox="0 0 12 12" fill="none"
                      >
                        <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>

                  {/* Langue */}
                  <div className="flex flex-col gap-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Langue</p>
                    <div className="flex gap-2">
                      {LANGUAGES.map(l => {
                        const disabled = l.value === 'fr'
                        return (
                          <button
                            key={l.value}
                            onClick={() => !disabled && update({ language: l.value })}
                            disabled={disabled}
                            className={[
                              btnBase,
                              'relative',
                              disabled
                                ? 'cursor-not-allowed border-white/5 bg-white/3 text-white/20 opacity-50'
                                : language === l.value ? btnSelected : btnIdle,
                            ].join(' ')}
                          >
                            {l.label}
                            {disabled && (
                              <span className="absolute -right-1 -top-2 rounded-full bg-white/10 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-white/30">
                                bientôt
                              </span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* Launch */}
                <motion.button
                  onClick={handleLaunch}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="mt-6 w-full rounded-xl bg-gradient-to-r from-neon-violet to-neon-blue py-3 text-sm font-bold tracking-wide text-white shadow-neon-violet"
                >
                  Lancer
                </motion.button>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
