import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { fetchAllStats } from '../../services/cloudStats'
import { getUserBestScore } from '../../services/leaderboard'
import { getUserAchievements } from '../../services/achievements'
import MiniBadge from '../shared/MiniBadge'
import type { AchievementWithStatus } from '../../types/quiz'

interface StatsData {
  gamesPlayed: number
  bestStreak: number
  bestComp: number
  lastAchievement: AchievementWithStatus | null
}

interface Props {
  onShowStats: (tab: 'stats') => void
}

function fmt(value: number): string {
  return value > 0 ? value.toLocaleString('fr-FR') : '—'
}


export default function PlayerStatsCard({ onShowStats }: Props) {
  const { user, statsRefreshKey } = useAuth()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<StatsData | null>(null)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    setLoading(true)

    Promise.all([
      fetchAllStats(user.id),
      getUserBestScore(user.id, 'fr'),
      getUserAchievements(user.id),
    ])
      .then(([allStats, bestComp, achievements]) => {
        if (cancelled) return
        const global = allStats.global
        const unlocked = achievements
          .filter(a => a.unlocked && a.unlocked_at)
          .sort((a, b) => (b.unlocked_at ?? '').localeCompare(a.unlocked_at ?? ''))
        setData({
          gamesPlayed: global?.games_played ?? 0,
          bestStreak:  global?.best_streak ?? 0,
          bestComp,
          lastAchievement: unlocked[0] ?? null,
        })
        setLoading(false)
      })
      .catch(() => {
        if (!cancelled) {
          setData({ gamesPlayed: 0, bestStreak: 0, bestComp: 0, lastAchievement: null })
          setLoading(false)
        }
      })

    return () => { cancelled = true }
  }, [user, statsRefreshKey])

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onShowStats('stats')}
      onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onShowStats('stats')}
      className="w-64 cursor-pointer rounded-xl border border-game-border bg-game-card/90 px-4 py-4 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:border-neon-violet/40 sm:w-72"
      style={{ boxShadow: '0 0 24px rgba(139,92,246,0.12)', transition: 'box-shadow 0.3s ease, transform 0.3s ease, border-color 0.3s ease' }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 0 48px rgba(139,92,246,0.3), 0 0 16px rgba(139,92,246,0.15)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 0 24px rgba(139,92,246,0.12)' }}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-[10.5px] font-extrabold uppercase tracking-widest text-neon-violet">
          Mes Stats
        </h2>
        <span className="text-[10px] text-neon-violet/50">→</span>
      </div>

      <div className="mt-3">
        {loading ? (
          <div className="grid grid-cols-2 gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-lg bg-white/5 p-3">
                <div className="mb-2 h-3 w-14 rounded bg-game-border" />
                <div className="h-6 w-10 rounded bg-game-border" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">

            {/* Score compétitif — orange comme StatsPage */}
            <div className="rounded-lg bg-white/[0.03] p-3" style={{ border: '1px solid rgba(249,115,22,0.2)' }}>
              <p className="mb-1 text-[9px] font-bold uppercase tracking-widest text-white/35">
                Score compét.
              </p>
              <p className="text-xl font-black tabular-nums leading-none text-orange-400">
                {data?.bestComp ? data.bestComp.toLocaleString('fr-FR') : '—'}
              </p>
            </div>

            {/* Parties jouées */}
            <div className="rounded-lg bg-white/[0.03] p-3" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
              <p className="mb-1 text-[9px] font-bold uppercase tracking-widest text-white/35">
                Parties
              </p>
              <p className="text-xl font-black tabular-nums leading-none text-white/80">
                {fmt(data?.gamesPlayed ?? 0)}
              </p>
            </div>

            {/* Série max — yellow-400 comme StatsPage */}
            <div className="rounded-lg bg-white/[0.03] p-3" style={{ border: '1px solid rgba(234,179,8,0.2)' }}>
              <p className="mb-1 text-[9px] font-bold uppercase tracking-widest text-white/35">
                Série max
              </p>
              <p className="text-xl font-black tabular-nums leading-none text-yellow-400">
                {fmt(data?.bestStreak ?? 0)}
              </p>
            </div>

            {/* Dernier badge — hexagone SVG sans nom */}
            <div
              className="flex flex-col items-center justify-center rounded-lg bg-white/[0.03] p-3"
              style={{ border: '1px solid rgba(139,92,246,0.18)' }}
            >
              <p className="mb-2 self-start text-[9px] font-bold uppercase tracking-widest text-white/35">
                Dernier badge
              </p>
              {data?.lastAchievement ? (
                <MiniBadge achievementId={data.lastAchievement.id} size={52} unlocked={true} />
              ) : (
                <p className="text-[11px] text-white/25">Aucun encore</p>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  )
}
