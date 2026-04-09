import { motion, AnimatePresence } from 'framer-motion'
import { URGENT_THRESHOLD } from '../../constants/game'

interface Props {
  progress: number  // 1 → 0
  timeLeft: number  // seconds
}

function getColor(timeLeft: number) {
  if (timeLeft > URGENT_THRESHOLD * 2) return '#22C55E'
  if (timeLeft > URGENT_THRESHOLD) return '#F97316'
  return '#EF4444'
}

export default function TimerBar({ progress, timeLeft }: Props) {
  const isUrgent = timeLeft <= URGENT_THRESHOLD && timeLeft > 0

  return (
    <>
      {/* Progress bar */}
      <div className="h-1.5 w-full bg-white/5">
        <motion.div
          className="h-full origin-left rounded-full"
          animate={{
            width: `${progress * 100}%`,
            backgroundColor: getColor(timeLeft),
          }}
          transition={{
            width: { duration: 0.12, ease: 'linear' },
            backgroundColor: { duration: 0.4 },
          }}
        />
      </div>

      {/* Urgency vignette — CSS handles the pulse, Framer Motion only show/hide */}
      <AnimatePresence>
        {isUrgent && (
          <motion.div
            key="urgency-vignette"
            className="vignette-pulse-red pointer-events-none fixed inset-0 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          />
        )}
      </AnimatePresence>
    </>
  )
}
