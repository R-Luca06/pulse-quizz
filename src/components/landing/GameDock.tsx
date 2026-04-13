import { motion } from 'framer-motion'
import type { GameSettings } from '../../hooks/useSettings'
import { CATEGORY_LABELS, DIFFICULTY_LABELS } from '../../constants/quiz'

interface Props {
  settings: GameSettings
  onPlay: () => void
  onOpenSettings: () => void
}

export default function GameDock({ settings, onPlay, onOpenSettings }: Props) {
  const isComp = settings.mode === 'compétitif'
  const categoryLabel = CATEGORY_LABELS[settings.category] ?? settings.category
  const difficultyLabel = DIFFICULTY_LABELS[settings.difficulty] ?? settings.difficulty

  return (
    // Wrapper externe pour le centrage — Framer Motion gère ses propres transforms
    // et écraserait le -translate-x-1/2 de Tailwind s'il était sur le motion.div
    <div className="pointer-events-none fixed bottom-5 left-0 right-0 z-40 flex justify-center">
      <motion.div
        className="pointer-events-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.5, ease: 'easeOut' }}
      >
        <div
          className="flex items-center gap-4 rounded-3xl px-5 py-3"
          style={{
            background: 'rgba(13,13,22,0.88)',
            border: '1px solid rgba(139,92,246,0.22)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 0 40px rgba(139,92,246,0.12), 0 8px 32px rgba(0,0,0,0.6)',
          }}
        >
          {/* Mode */}
          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] font-bold uppercase tracking-widest text-white/30">
              Mode
            </span>
            {isComp ? (
              <span className="text-[13px] font-bold text-neon-violet">⚡ Compétitif</span>
            ) : (
              <span className="text-[13px] font-bold text-neon-blue">Normal</span>
            )}
          </div>

          {/* Niveau — barré en mode compétitif */}
          <>
            <div className="h-8 w-px bg-white/[0.08]" />
            <div className={`flex flex-col gap-0.5 transition-opacity duration-200 ${isComp ? 'opacity-30' : ''}`}>
              <span className={`text-[9px] font-bold uppercase tracking-widest transition-all duration-200 ${isComp ? 'text-white/20 line-through' : 'text-white/30'}`}>
                Niveau
              </span>
              <span className="text-[13px] font-bold text-white/70">
                {isComp ? 'Aléatoire' : difficultyLabel}
              </span>
            </div>
          </>

          {/* Catégorie — barrée en mode compétitif */}
          <>
            <div className="h-8 w-px bg-white/[0.08]" />
            <div className={`flex flex-col gap-0.5 transition-opacity duration-200 ${isComp ? 'opacity-30' : ''}`}>
              <span className={`text-[9px] font-bold uppercase tracking-widest transition-all duration-200 ${isComp ? 'text-white/20 line-through' : 'text-white/30'}`}>
                Catégorie
              </span>
              <span className="max-w-[110px] truncate text-[13px] font-bold text-white/70">
                {isComp ? 'Aléatoire' : categoryLabel}
              </span>
            </div>
          </>

          <div className="h-8 w-px bg-white/[0.08]" />

          {/* Bouton JOUER */}
          <button
            type="button"
            onClick={onPlay}
            aria-label="Jouer"
            className="rounded-2xl px-7 py-2.5 text-sm font-black uppercase tracking-widest text-white transition-transform hover:scale-105 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neon-violet/60 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%)',
              boxShadow: '0 0 20px rgba(139,92,246,0.45), 0 4px 14px rgba(0,0,0,0.5)',
            }}
          >
            Jouer
          </button>

          {/* Icône paramètres */}
          <button
            type="button"
            onClick={onOpenSettings}
            aria-label="Paramètres de la partie"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/40 transition-colors hover:border-neon-violet/40 hover:text-white/70 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neon-violet/60"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        </div>
      </motion.div>
    </div>
  )
}
