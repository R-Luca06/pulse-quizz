import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getMuted, setMuted } from '../../utils/sounds'
import { FR_CATEGORIES, MODES, DIFFICULTIES, LANGUAGES, btnBase, btnSelected, btnIdle } from '../../constants/quiz'
import { useAuth } from '../../hooks/useAuth'
import type { GameSettings } from '../../hooks/useSettings'

interface Props {
  settings: GameSettings
  onSettingsChange: (patch: Partial<GameSettings>) => void
  onLaunch: () => void
  onClose: () => void
  onShowRules: () => void
  onRequireAuth?: () => void
}

export default function SettingsModal({ settings, onSettingsChange, onLaunch, onClose, onShowRules, onRequireAuth }: Props) {
  const { user } = useAuth()
  const isGuest = !user
  const { mode, difficulty, language, category } = settings
  const isCompetitif = mode === 'compétitif'
  const [muted, setMutedState] = useState(getMuted)

  useEffect(() => {
    if (isGuest && mode === 'compétitif') {
      onSettingsChange({ mode: 'normal', difficulty: 'easy', category: 'all' })
    }
  }, [isGuest, mode, onSettingsChange])

  function handleLaunch() {
    if (isCompetitif && isGuest) {
      onRequireAuth?.()
      return
    }
    onLaunch()
  }

  function handleMuteToggle() {
    const next = !muted
    setMuted(next)
    setMutedState(next)
  }

  const LAST_DIFF_KEY = 'pulse_last_normal_diff'

  function handleModeChange(newMode: GameSettings['mode']) {
    if (newMode === 'compétitif') {
      localStorage.setItem(LAST_DIFF_KEY, difficulty)
      onSettingsChange({ mode: newMode, difficulty: 'mixed', category: 'all' })
    } else {
      const saved = localStorage.getItem(LAST_DIFF_KEY) as GameSettings['difficulty'] | null
      const validDiffs: GameSettings['difficulty'][] = ['easy', 'medium', 'hard']
      onSettingsChange({ mode: newMode, difficulty: validDiffs.includes(saved as GameSettings['difficulty']) ? saved! : 'easy' })
    }
  }

  function handleLanguageChange(lang: GameSettings['language']) {
    onSettingsChange({ language: lang })
  }

  const availableCategories = FR_CATEGORIES
  const categoryDisabled = isCompetitif

  return (
    <AnimatePresence>
      <>
        {/* Backdrop */}
        <motion.div
          key="backdrop"
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
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
                onClick={onClose}
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
                  {MODES.map(m => {
                    const isComp = m.value === 'compétitif'
                    const isSelected = mode === m.value
                    const isLocked = isComp && isGuest
                    return (
                      <motion.div
                        key={m.value}
                        animate={isComp && !isLocked ? {
                          boxShadow: isSelected
                            ? ['0 0 10px rgba(249,115,22,0.3)', '0 0 24px rgba(249,115,22,0.65)', '0 0 10px rgba(249,115,22,0.3)']
                            : ['0 0 4px rgba(249,115,22,0.08)', '0 0 12px rgba(249,115,22,0.2)', '0 0 4px rgba(249,115,22,0.08)'],
                        } : { boxShadow: 'none' }}
                        transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                        className="relative flex-1 rounded-xl"
                      >
                        <button
                          onClick={() => {
                            if (isLocked) {
                              onRequireAuth?.()
                            } else {
                              handleModeChange(m.value)
                            }
                          }}
                          aria-disabled={isLocked}
                          title={isLocked ? 'Connexion requise' : undefined}
                          className={[
                            'w-full rounded-xl border px-4 py-3 text-sm font-semibold transition-all duration-150 text-left flex flex-col items-start gap-0.5',
                            isLocked
                              ? 'cursor-not-allowed border-orange-500/15 bg-orange-500/[0.03] text-white/40'
                              : isComp && isSelected
                              ? 'border-orange-500/60 bg-gradient-to-br from-orange-500/20 to-red-500/10 text-white'
                              : isComp && !isSelected
                              ? 'border-orange-500/20 bg-orange-500/5 text-white/60 hover:border-orange-500/40 hover:text-white/80'
                              : isSelected
                              ? btnSelected
                              : btnIdle,
                          ].join(' ')}
                        >
                          <span className={['font-bold flex items-center gap-1.5', isComp ? (isLocked ? 'text-orange-300/50' : 'text-orange-300') : ''].join(' ')}>
                            {isLocked && (
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                              </svg>
                            )}
                            {m.label}
                          </span>
                          <span className="text-xs opacity-60">
                            {isLocked ? 'Connexion requise' : m.desc}
                          </span>
                        </button>
                        {/* Info button pour le mode compétitif */}
                        {isComp && !isLocked && (
                          <button
                            onClick={(e) => { e.stopPropagation(); onShowRules() }}
                            aria-label="Règles du mode Compétitif"
                            className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border border-orange-500/30 bg-[#0d0d18] text-xs font-bold text-orange-400/70 hover:border-orange-500/60 hover:text-orange-400 transition-colors"
                          >
                            i
                          </button>
                        )}
                      </motion.div>
                    )
                  })}
                </div>
              </div>

              {/* Niveau — barré en mode compétitif */}
              <div className={`flex flex-col gap-2 ${isCompetitif ? 'pointer-events-none' : ''}`}>
                <div className="flex items-center gap-2">
                  <p className={`text-[10px] font-bold uppercase tracking-widest transition-all duration-200 ${isCompetitif ? 'text-white/20 line-through' : 'text-white/30'}`}>Niveau</p>
                  {isCompetitif && (
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-white/20">
                      Aléatoire
                    </span>
                  )}
                </div>
                <div className={`flex gap-2 transition-opacity duration-200 ${isCompetitif ? 'opacity-30' : ''}`}>
                  {DIFFICULTIES.map(d => (
                    <button
                      key={d.value}
                      onClick={() => onSettingsChange({ difficulty: d.value })}
                      className={[btnBase, difficulty === d.value ? btnSelected : btnIdle].join(' ')}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Catégorie — barrée en mode compétitif uniquement */}
              <div className={`flex flex-col gap-2 ${categoryDisabled ? 'pointer-events-none' : ''}`}>
                <div className="flex items-center gap-2">
                  <p className={`text-[10px] font-bold uppercase tracking-widest transition-all duration-200 ${isCompetitif ? 'text-white/20 line-through' : 'text-white/30'}`}>Catégorie</p>
                  {isCompetitif && (
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-white/20">
                      Aléatoire
                    </span>
                  )}
                </div>
                <div className={`relative transition-opacity duration-200 ${isCompetitif ? 'opacity-30' : ''}`}>
                  <select
                    value={String(category)}
                    onChange={(e) => {
                      const v = e.target.value
                      onSettingsChange({ category: v === 'all' ? 'all' : v })
                    }}
                    aria-label="Catégorie de questions"
                    className="w-full appearance-none rounded-xl border border-white/10 bg-white/5 py-3 pl-4 pr-10 text-sm font-semibold text-white focus:border-neon-violet/60 focus:outline-none"
                  >
                    {availableCategories.map(c => (
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
                  {LANGUAGES.map(l => (
                    <button
                      key={l.value}
                      onClick={() => handleLanguageChange(l.value)}
                      className={[btnBase, language === l.value ? btnSelected : btnIdle].join(' ')}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Launch */}
            <motion.button
              onClick={handleLaunch}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              animate={isCompetitif ? {
                boxShadow: ['0 0 16px rgba(249,115,22,0.35)', '0 0 32px rgba(249,115,22,0.7)', '0 0 16px rgba(249,115,22,0.35)'],
              } : { boxShadow: '0 0 0px rgba(0,0,0,0)' }}
              transition={{ duration: 1.4, repeat: isCompetitif ? Infinity : 0, ease: 'easeInOut' }}
              className={[
                'mt-6 w-full rounded-xl py-3 text-sm font-bold tracking-wide text-white',
                isCompetitif
                  ? 'bg-gradient-to-r from-orange-500 to-red-500'
                  : 'bg-gradient-to-r from-neon-violet to-neon-blue shadow-neon-violet',
              ].join(' ')}
            >
              {isCompetitif ? 'Entrer en compétition' : 'Lancer'}
            </motion.button>
          </motion.div>
        </motion.div>
      </>
    </AnimatePresence>
  )
}
