import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../hooks/useAuth'

const AUTO_DISMISS_MS = 5500

export default function XpToast() {
  const { xpNotification, clearXpNotification } = useAuth()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!xpNotification) return
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(clearXpNotification, AUTO_DISMISS_MS)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [xpNotification?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const n = xpNotification
  const leveledUp = n !== null && n.levelAfter > n.levelBefore

  return (
    <AnimatePresence>
      {n && (
        <motion.div
          key={n.id}
          initial={{ opacity: 0, x: 80 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 80, transition: { duration: 0.2, ease: 'easeIn' } }}
          transition={{ type: 'spring', stiffness: 380, damping: 34 }}
          className="fixed right-4 top-4 z-[200] w-[calc(100vw-2rem)] max-w-xs"
        >
          <div
            className="relative overflow-hidden rounded-2xl border border-neon-violet/25 bg-game-bg/96 backdrop-blur-xl"
            style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.7), 0 0 40px rgba(139,92,246,0.12)' }}
          >
            {/* Close button */}
            <button
              onClick={clearXpNotification}
              className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full text-white/20 transition-colors hover:text-white/60 focus:outline-none"
              aria-label="Fermer"
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>

            <div className="px-5 pt-4 pb-3">
              {/* Level-up banner */}
              {leveledUp && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.15, duration: 0.3 }}
                  className="mb-3 rounded-xl px-3 py-2.5 text-center"
                  style={{
                    background: 'linear-gradient(135deg, rgba(124,58,237,0.18), rgba(37,99,235,0.18))',
                    border: '1px solid rgba(139,92,246,0.25)',
                  }}
                >
                  <p className="mb-1 text-[9px] font-black uppercase tracking-[0.18em] text-neon-violet/60">
                    Niveau supérieur !
                  </p>
                  <div className="flex items-center justify-center gap-2 text-lg font-black">
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
                </motion.div>
              )}

              {/* Header row */}
              <div className="flex items-center justify-between pr-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">XP gagnée</span>
                <motion.span
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 22, delay: 0.05 }}
                  className="text-xl font-black text-neon-violet"
                >
                  +{n.total} XP
                </motion.span>
              </div>

              {/* Breakdown pills */}
              <div className="mt-2 flex flex-wrap gap-1.5">
                {n.gameXp && (
                  <>
                    <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-semibold text-white/40">
                      Partie&nbsp;<span className="text-white/25">+{n.gameXp.base}</span>
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-semibold text-white/40">
                      Réponses&nbsp;<span className="text-white/25">+{n.gameXp.correct}</span>
                    </span>
                    {n.gameXp.bonus > 0 && (
                      <span className="rounded-full border border-yellow-500/20 bg-yellow-500/10 px-2.5 py-1 text-[10px] font-semibold text-yellow-400/70">
                        Parfait&nbsp;<span className="text-yellow-400/50">+{n.gameXp.bonus}</span>
                      </span>
                    )}
                  </>
                )}
                {n.achievementXp > 0 && (
                  <span className="rounded-full border border-neon-violet/25 bg-neon-violet/10 px-2.5 py-1 text-[10px] font-semibold text-neon-violet/70">
                    Achievement&nbsp;<span className="text-neon-violet/50">+{n.achievementXp}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Auto-dismiss timer bar */}
            <motion.div
              key={`bar-${n.id}`}
              className="h-[2px] w-full"
              style={{ background: 'linear-gradient(90deg, #7c3aed, #2563eb)', transformOrigin: 'left' }}
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
