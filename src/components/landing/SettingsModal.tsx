import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getMuted, setMuted } from '../../utils/sounds'
import { CATEGORIES, FR_CATEGORIES, MODES, DIFFICULTIES, LANGUAGES, btnBase, btnSelected, btnIdle } from '../../constants/quiz'
import type { GameSettings } from '../../hooks/useSettings'
import type { Category } from '../../types/quiz'

interface Props {
  settings: GameSettings
  onSettingsChange: (patch: Partial<GameSettings>) => void
  onLaunch: () => void
  onClose: () => void
  onShowRules: () => void
}

export default function SettingsModal({ settings, onSettingsChange, onLaunch, onClose, onShowRules }: Props) {
  const { mode, difficulty, language, category } = settings
  const isCompetitif = mode === 'compétitif'
  const isFrench = language === 'fr'
  const [muted, setMutedState] = useState(getMuted)

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
    // Réinitialise la catégorie si on bascule vers le français et que la catégorie actuelle
    // est un ID OpenTDB numérique (non disponible en FR)
    const patch: Partial<GameSettings> = { language: lang }
    if (lang === 'fr' && typeof category === 'number') patch.category = 'all'
    onSettingsChange(patch)
  }

  const availableCategories = isFrench ? FR_CATEGORIES : CATEGORIES
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
                    return (
                      <motion.div
                        key={m.value}
                        animate={isComp ? {
                          boxShadow: isSelected
                            ? ['0 0 10px rgba(249,115,22,0.3)', '0 0 24px rgba(249,115,22,0.65)', '0 0 10px rgba(249,115,22,0.3)']
                            : ['0 0 4px rgba(249,115,22,0.08)', '0 0 12px rgba(249,115,22,0.2)', '0 0 4px rgba(249,115,22,0.08)'],
                        } : { boxShadow: 'none' }}
                        transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                        className="relative flex-1 rounded-xl"
                      >
                        <button
                          onClick={() => handleModeChange(m.value)}
                          className={[
                            'w-full rounded-xl border px-4 py-3 text-sm font-semibold transition-all duration-150 text-left flex flex-col items-start gap-0.5',
                            isComp && isSelected
                              ? 'border-orange-500/60 bg-gradient-to-br from-orange-500/20 to-red-500/10 text-white'
                              : isComp && !isSelected
                              ? 'border-orange-500/20 bg-orange-500/5 text-white/60 hover:border-orange-500/40 hover:text-white/80'
                              : isSelected
                              ? btnSelected
                              : btnIdle,
                          ].join(' ')}
                        >
                          <span className={['font-bold', isComp ? 'text-orange-300' : ''].join(' ')}>
                            {m.label}
                          </span>
                          <span className="text-xs opacity-60">{m.desc}</span>
                        </button>
                        {/* Info button pour le mode compétitif */}
                        {isComp && (
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

              {/* Niveau — grisé en mode compétitif */}
              <div className={`flex flex-col gap-2 transition-opacity duration-200 ${isCompetitif ? 'pointer-events-none opacity-35' : ''}`}>
                <div className="flex items-center gap-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Niveau</p>
                  {isCompetitif && (
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-white/30">
                      Aléatoire
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
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

              {/* Catégorie — grisée en mode compétitif uniquement */}
              <div className={`flex flex-col gap-2 transition-opacity duration-200 ${categoryDisabled ? 'pointer-events-none opacity-35' : ''}`}>
                <div className="flex items-center gap-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Catégorie</p>
                  {isCompetitif && (
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-white/30">
                      Aléatoire
                    </span>
                  )}
                </div>
                <div className="relative">
                  <select
                    value={String(category)}
                    onChange={(e) => {
                      const v = e.target.value
                      if (isFrench) {
                        onSettingsChange({ category: v === 'all' ? 'all' : v })
                      } else {
                        onSettingsChange({ category: v === 'all' ? 'all' : Number(v) as Category })
                      }
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
              onClick={onLaunch}
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
