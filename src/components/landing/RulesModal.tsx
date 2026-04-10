import { motion, AnimatePresence } from 'framer-motion'
import { COMP_SPEED_TIERS_LABELS } from '../../constants/quiz'

interface Props {
  onClose: () => void
}

export default function RulesModal({ onClose }: Props) {
  return (
    <AnimatePresence>
      <>
        <motion.div
          key="rules-backdrop"
          className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        />
        <motion.div
          key="rules-modal"
          className="fixed inset-0 z-[70] flex items-center justify-center px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="relative w-full max-w-sm rounded-2xl border border-orange-500/20 bg-[#0d0d18] p-6 shadow-[0_0_40px_rgba(249,115,22,0.15)]"
            initial={{ scale: 0.92, y: 16 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 8 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">🔥</span>
                <h2 className="text-base font-black text-orange-300">Mode Compétitif</h2>
              </div>
              <button
                onClick={onClose}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/40 transition-colors hover:border-white/20 hover:text-white/70"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            <div className="flex flex-col gap-3 text-sm text-white/60">
              {/* Règles */}
              <div className="flex flex-col gap-2">
                {[
                  { icon: '∞', text: 'Questions infinies — la partie s\'arrête dès la première erreur ou timeout' },
                  { icon: '🎲', text: 'Thème et difficulté aléatoires — aucun filtre, seule la langue est choisie' },
                  { icon: '⚡', text: 'Réponds vite pour multiplier tes points' },
                  { icon: '🏆', text: 'Ton meilleur score est publié automatiquement dans le classement' },
                ].map((rule, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2.5">
                    <span className="shrink-0 text-base leading-none">{rule.icon}</span>
                    <span className="leading-snug">{rule.text}</span>
                  </div>
                ))}
              </div>

              {/* Tableau des multiplicateurs */}
              <div className="rounded-xl border border-orange-500/15 bg-orange-500/5 p-3">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-orange-400/60">Multiplicateurs de vitesse</p>
                <div className="flex flex-col gap-1">
                  {COMP_SPEED_TIERS_LABELS.map(t => (
                    <div key={t.label} className="flex items-center justify-between">
                      <span className="text-xs text-white/40">{t.label}</span>
                      <span className={['text-xs font-bold', t.color].join(' ')}>{t.multiplier}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <motion.button
              onClick={onClose}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="mt-5 w-full rounded-xl bg-gradient-to-r from-orange-500 to-red-500 py-2.5 text-sm font-bold text-white shadow-[0_0_20px_rgba(249,115,22,0.3)]"
            >
              Compris !
            </motion.button>
          </motion.div>
        </motion.div>
      </>
    </AnimatePresence>
  )
}
