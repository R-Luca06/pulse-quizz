import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../hooks/useAuth'

const AUTO_DISMISS_MS = 5500

export default function RewardToast() {
  const { rewardNotification, clearRewardNotification } = useAuth()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!rewardNotification) return
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(clearRewardNotification, AUTO_DISMISS_MS)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [rewardNotification?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const n = rewardNotification
  const leveledUp = n !== null && n.levelAfter > n.levelBefore

  // Lignes de décomposition XP
  const xpRows: { label: string; value: number; accent?: 'violet' }[] = []
  if (n?.gameXp) {
    xpRows.push({ label: 'Partie',   value: n.gameXp.base })
    xpRows.push({ label: 'Réponses', value: n.gameXp.correct })
    if (n.gameXp.bonus > 0) xpRows.push({ label: 'Bonus', value: n.gameXp.bonus, accent: 'violet' })
  }
  if (n && n.achievementXp > 0) xpRows.push({ label: 'Achievement', value: n.achievementXp, accent: 'violet' })

  // Lignes de décomposition Pulses
  const pulsesRows: { label: string; value: number; accent?: 'cyan' }[] = []
  if (n?.gamePulses) {
    pulsesRows.push({ label: 'Partie',   value: n.gamePulses.base })
    pulsesRows.push({ label: 'Réponses', value: n.gamePulses.correct })
    if (n.gamePulses.streak > 0) pulsesRows.push({ label: 'Série', value: n.gamePulses.streak, accent: 'cyan' })
  }
  if (n && n.achievementPulses > 0) pulsesRows.push({ label: 'Achievement', value: n.achievementPulses, accent: 'cyan' })

  return (
    <AnimatePresence>
      {n && (
        <motion.div
          key={n.id}
          initial={{ opacity: 0, x: 80 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 80, transition: { duration: 0.2, ease: 'easeIn' } }}
          transition={{ type: 'spring', stiffness: 380, damping: 34 }}
          className="fixed right-4 top-4 z-[200] w-[calc(100vw-2rem)] max-w-[320px]"
        >
          <div
            className="relative overflow-hidden rounded-2xl border border-white/10 bg-game-bg/96 backdrop-blur-xl"
            style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.7), 0 0 40px rgba(139,92,246,0.08), 0 0 40px rgba(34,211,238,0.06)' }}
          >
            {/* Close button */}
            <button
              onClick={clearRewardNotification}
              className="absolute right-2.5 top-2.5 z-10 flex h-5 w-5 items-center justify-center rounded-full text-white/25 transition-colors hover:text-white/60 focus:outline-none"
              aria-label="Fermer"
            >
              <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
                <path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>

            {/* Level-up banner */}
            {leveledUp && (
              <motion.div
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15, duration: 0.3 }}
                className="px-3 pt-3"
              >
                <div
                  className="rounded-lg px-2.5 py-1.5 text-center"
                  style={{
                    background: 'linear-gradient(135deg, rgba(124,58,237,0.18), rgba(37,99,235,0.18))',
                    border: '1px solid rgba(139,92,246,0.25)',
                  }}
                >
                  <p className="text-[8.5px] font-black uppercase tracking-[0.18em] text-neon-violet/60">
                    Niveau supérieur !
                  </p>
                  <div className="flex items-center justify-center gap-1.5 text-sm font-black">
                    <span className="text-white/30">Niv.{n.levelBefore}</span>
                    <span className="text-white/20">→</span>
                    <span
                      style={{
                        background: 'linear-gradient(90deg, #a78bfa, #60a5fa)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}
                    >
                      Niv.{n.levelAfter}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Header — titre + 2 pills */}
            <div className="flex items-center gap-1.5 border-b border-white/5 px-3 py-2.5 pr-8">
              <span className="text-[9.5px] font-black uppercase tracking-[0.18em] text-white/30">
                Récompenses
              </span>
              <span className="ml-auto flex items-center gap-1 rounded-full border border-neon-violet/30 bg-neon-violet/10 px-2 py-0.5 text-[10px] font-black text-neon-violet">
                <span className="text-[9px]">✦</span>
                +{n.totalXp.toLocaleString('fr-FR')}
                <span className="text-[8.5px] text-neon-violet/60">XP</span>
              </span>
              <span className="flex items-center gap-1 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2 py-0.5 text-[10px] font-black text-cyan-300">
                <span className="text-[9px]">◈</span>
                +{n.totalPulses.toLocaleString('fr-FR')}
              </span>
            </div>

            {/* Body — 2 colonnes */}
            <div className="grid grid-cols-2 divide-x divide-white/5">
              {/* Col XP */}
              <div className="flex flex-col gap-1 px-3 py-2.5">
                <div className="flex items-center gap-1">
                  <span className="text-[9px] font-black leading-none text-neon-violet">✦</span>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-white/35">XP</span>
                </div>
                {xpRows.length > 0 ? (
                  <ul className="flex flex-col gap-0.5 text-[10.5px]">
                    {xpRows.map((r, i) => (
                      <RewardRow key={i} label={r.label} value={r.value} accent={r.accent} />
                    ))}
                  </ul>
                ) : (
                  <span className="text-[10.5px] text-white/15">—</span>
                )}
              </div>

              {/* Col Pulses */}
              <div className="flex flex-col gap-1 px-3 py-2.5">
                <div className="flex items-center gap-1">
                  <span className="text-[9px] font-black leading-none text-cyan-400">◈</span>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-white/35">Pulses</span>
                </div>
                {pulsesRows.length > 0 ? (
                  <ul className="flex flex-col gap-0.5 text-[10.5px]">
                    {pulsesRows.map((r, i) => (
                      <RewardRow key={i} label={r.label} value={r.value} accent={r.accent} />
                    ))}
                  </ul>
                ) : (
                  <span className="text-[10.5px] text-white/15">—</span>
                )}
              </div>
            </div>

            {/* Auto-dismiss timer bar */}
            <motion.div
              key={`bar-${n.id}`}
              className="h-[2px] w-full"
              style={{ background: 'linear-gradient(90deg, #7c3aed, #2563eb, #22d3ee)', transformOrigin: 'left' }}
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{ duration: AUTO_DISMISS_MS / 1000, ease: 'linear' }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function RewardRow({ label, value, accent }: { label: string; value: number; accent?: 'violet' | 'cyan' }) {
  const valueClass =
    accent === 'violet' ? 'text-neon-violet'
    : accent === 'cyan' ? 'text-cyan-300'
    : 'text-white/65'
  return (
    <li className="flex items-baseline justify-between gap-1.5">
      <span className="truncate text-white/40">{label}</span>
      <span className={`tabular-nums font-bold ${valueClass}`}>+{value.toLocaleString('fr-FR')}</span>
    </li>
  )
}
