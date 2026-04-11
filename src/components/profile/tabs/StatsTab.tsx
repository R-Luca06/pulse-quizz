import StatsPage from '../../stats/StatsPage'

interface Props {
  onBack: () => void
}

export default function StatsTab({ onBack }: Props) {
  return (
    <div className="flex flex-col">
      {/* Hero header — même pattern que ConfidentialityTab */}
      <div className="relative overflow-hidden px-6 py-7 bg-gradient-to-br from-game-border/20 via-game-card/30 to-transparent">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/[0.03] blur-3xl" />
        <div className="relative flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-orange-500/20 bg-orange-500/10 text-orange-400/60">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10"/>
              <line x1="12" y1="20" x2="12" y2="4"/>
              <line x1="6" y1="20" x2="6" y2="14"/>
            </svg>
          </div>
          <div>
            <p className="text-lg font-bold text-white">Statistiques</p>
            <p className="mt-0.5 text-xs text-white/35">Tes performances et classements</p>
          </div>
        </div>
      </div>

      {/* Contenu stats */}
      <StatsPage onBack={onBack} defaultTab="stats" hideNav />
    </div>
  )
}
