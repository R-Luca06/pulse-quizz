import { useSettings } from '../../hooks/useSettings'
import StartButton from './StartButton'

const DIFFICULTY_LABEL: Record<string, string> = {
  easy: 'Facile',
  medium: 'Moyen',
  hard: 'Difficile',
  mixed: 'Mixte',
}

interface Props {
  onPlay: () => void
}

export default function PlayZoneCard({ onPlay }: Props) {
  const { settings } = useSettings()
  const isComp = settings.mode === 'compétitif'

  return (
    <div
      className="flex flex-col items-center gap-4 rounded-2xl border border-game-border/60 bg-game-bg/60 px-8 py-5 backdrop-blur-md"
      style={{ boxShadow: '0 0 40px rgba(139, 92, 246, 0.1), 0 8px 32px rgba(0,0,0,0.4)' }}
    >
      {/* Badges mode + difficulté */}
      <div className="flex items-center gap-2">
        {isComp ? (
          <span className="rounded-full border border-neon-violet/40 bg-neon-violet/20 px-3 py-0.5 text-xs font-bold uppercase tracking-wide text-neon-violet">
            ⚡ Compétitif
          </span>
        ) : (
          <>
            <span className="rounded-full border border-neon-blue/40 bg-neon-blue/10 px-3 py-0.5 text-xs font-bold uppercase tracking-wide text-neon-blue">
              Normal
            </span>
            <span className="rounded-full border border-white/20 bg-white/5 px-3 py-0.5 text-xs text-white/50 uppercase tracking-wide">
              {DIFFICULTY_LABEL[settings.difficulty] ?? settings.difficulty}
            </span>
          </>
        )}
        <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs text-white/40">
          🇫🇷 Français
        </span>
      </div>

      {/* Bouton JOUER */}
      <StartButton onClick={onPlay} />

      {/* CTA bas : Personnaliser l'avatar (futur) */}
      <button
        disabled
        title="Bientôt disponible"
        className="flex cursor-not-allowed items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs text-white/30 transition-colors hover:border-neon-violet/20 hover:text-white/40"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-60">
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
        </svg>
        Personnaliser l'avatar
        <span className="rounded-full bg-neon-violet/20 px-1.5 py-0.5 text-[10px] font-semibold text-neon-violet/60">
          bientôt
        </span>
      </button>
    </div>
  )
}
