interface Props {
  onOpenSignIn: () => void
  onOpenSignUp: () => void
}

export default function GuestHeader({ onOpenSignIn, onOpenSignUp }: Props) {
  return (
    <nav className="sticky top-0 z-30 w-full border-b border-white/5 bg-[#0B0820]/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
        <a href="#top" className="select-none text-lg font-black tracking-tight text-white" aria-label="Pulse Quizz — retour en haut">
          Pulse<span className="text-neon-violet">Quizz</span>
        </a>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenSignIn}
            aria-label="Se connecter à Pulse Quizz"
            className="rounded-full border border-white/15 bg-white/[0.04] px-4 py-1.5 text-xs font-semibold text-white/80 transition-colors hover:border-white/30 hover:bg-white/[0.08] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-violet/60"
          >
            Se connecter
          </button>
          <button
            onClick={onOpenSignUp}
            aria-label="S'inscrire à Pulse Quizz"
            className="rounded-full bg-gradient-to-r from-neon-violet to-neon-blue px-4 py-1.5 text-xs font-semibold text-white shadow-[0_4px_20px_-4px_rgba(139,92,246,0.6)] transition-transform hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-violet/60"
          >
            S'inscrire
          </button>
        </div>
      </div>
    </nav>
  )
}
