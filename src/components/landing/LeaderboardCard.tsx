import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { getCompTopScores } from '../../services/leaderboard'
import type { LeaderboardEntry } from '../../services/leaderboard'

// Ordre d'affichage : 2e à gauche, 1er au centre, 3e à droite
const PODIUM_ORDER = [1, 0, 2]

const PODIUM_CONFIG = [
  // index 0 → 2e place (gauche)
  { color: '#94A3B8', borderColor: 'rgba(148,163,184,0.35)', bg: 'rgba(148,163,184,0.08)', paddingTop: 'pt-6',  barHeight: 'h-7',  medal: '🥈' },
  // index 1 → 1re place (centre)
  { color: '#EAB308', borderColor: 'rgba(234,179,8,0.45)',   bg: 'rgba(234,179,8,0.1)',   paddingTop: 'pt-0',  barHeight: 'h-12', medal: '🥇' },
  // index 2 → 3e place (droite)
  { color: '#CD7F32', borderColor: 'rgba(205,127,50,0.35)',  bg: 'rgba(205,127,50,0.08)', paddingTop: 'pt-10', barHeight: 'h-4',  medal: '🥉' },
]

interface Props {
  onShowStats: (tab: 'leaderboard') => void
}

function truncate(str: string, max = 9) {
  return str.length > max ? str.slice(0, max - 1) + '…' : str
}

export default function LeaderboardCard({ onShowStats }: Props) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(false)
    getCompTopScores('fr', 5)
      .then(data => { if (!cancelled) { setEntries(data); setLoading(false) } })
      .catch(() => { if (!cancelled) { setError(true); setLoading(false) } })
    return () => { cancelled = true }
  }, [])

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onShowStats('leaderboard')}
      onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onShowStats('leaderboard')}
      className="w-full cursor-pointer rounded-xl border border-game-border bg-game-card/90 px-4 py-4 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:border-neon-violet/40"
      style={{ boxShadow: '0 0 24px rgba(139,92,246,0.12)', transition: 'box-shadow 0.3s ease, transform 0.3s ease, border-color 0.3s ease' }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 0 48px rgba(139,92,246,0.3), 0 0 16px rgba(139,92,246,0.15)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 0 24px rgba(139,92,246,0.12)' }}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-[10.5px] font-extrabold uppercase tracking-widest text-neon-violet">
          Hall of Gloire
        </h2>
        <span className="text-[10px] text-neon-violet/50">→</span>
      </div>

      <div className="mt-3">
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex animate-pulse items-center gap-3 py-1">
                <div className="h-4 w-4 rounded bg-game-border" />
                <div className="h-4 flex-1 rounded bg-game-border" />
                <div className="h-4 w-10 rounded bg-game-border" />
              </div>
            ))}
          </div>
        ) : error || entries.length === 0 ? (
          <p className="text-xs text-white/40">Pas encore de scores</p>
        ) : (
          <>
            {/* ── Podium top 3 ────────────────────────────── */}
            <div className="mb-3 flex items-end justify-center gap-2">
              {PODIUM_ORDER.map((dataIdx, displayPos) => {
                const entry = entries[dataIdx]
                const cfg = PODIUM_CONFIG[displayPos]
                if (!entry) return <div key={dataIdx} className="w-[76px]" />
                const isMe = user?.id === entry.user_id
                return (
                  <div key={entry.id} className={`flex w-[76px] flex-col items-center ${cfg.paddingTop}`}>
                    {/* Médaille dans le cercle */}
                    <div
                      className="mb-1 flex h-9 w-9 items-center justify-center rounded-full text-lg"
                      style={{
                        background: cfg.bg,
                        border: `1.5px solid ${cfg.borderColor}`,
                        boxShadow: isMe ? `0 0 10px ${cfg.color}55` : 'none',
                      }}
                    >
                      {cfg.medal}
                    </div>
                    {/* Username */}
                    <span
                      className="mb-1 max-w-full truncate text-center text-[10px] font-semibold leading-tight"
                      style={{ color: isMe ? '#fff' : 'rgba(255,255,255,0.7)' }}
                    >
                      {truncate(entry.username)}
                      {isMe && <span className="ml-0.5 text-neon-cyan"> ★</span>}
                    </span>
                    {/* Score */}
                    <span
                      className="mb-1 text-[11px] font-black tabular-nums"
                      style={{ color: cfg.color }}
                    >
                      {entry.score.toLocaleString('fr-FR')}
                    </span>
                    {/* Barre podium */}
                    <div
                      className={`w-full rounded-t-md ${cfg.barHeight}`}
                      style={{ background: cfg.bg, border: `1px solid ${cfg.borderColor}`, borderBottom: 'none' }}
                    />
                  </div>
                )
              })}
            </div>

            {/* ── #4 et #5 en liste compacte ──────────────── */}
            {entries.slice(3, 5).map((entry, i) => {
              const isMe = user?.id === entry.user_id
              return (
                <div
                  key={entry.id}
                  className={`flex items-center gap-2 rounded-lg px-2 py-1 text-xs ${
                    isMe ? 'bg-neon-violet/15 text-white' : 'text-white/65'
                  }`}
                >
                  <span className="w-5 shrink-0 text-center font-bold text-white/30">#{i + 4}</span>
                  <span className="min-w-0 flex-1 truncate font-medium">
                    {entry.username}
                    {isMe && <span className="ml-1 text-neon-cyan">★</span>}
                  </span>
                  <span className="shrink-0 font-bold text-white/50 tabular-nums">
                    {entry.score.toLocaleString('fr-FR')}
                  </span>
                </div>
              )
            })}
          </>
        )}
      </div>
    </div>
  )
}
