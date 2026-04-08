import { motion, AnimatePresence } from 'framer-motion'

interface Props {
  progress: number  // 1 → 0
  timeLeft: number  // seconds
}

function getColor(timeLeft: number) {
  if (timeLeft > 6) return '#22C55E'   // green
  if (timeLeft > 3) return '#F97316'   // orange
  return '#EF4444'                      // red
}

export default function TimerBar({ progress, timeLeft }: Props) {
  const isUrgent = timeLeft <= 3 && timeLeft > 0
  const color = getColor(timeLeft)

  return (
    <>
      {/* Bar */}
      <div className="h-1.5 w-full bg-white/5">
        <motion.div
          className="h-full origin-left rounded-full"
          animate={{
            width: `${progress * 100}%`,
            backgroundColor: color,
          }}
          transition={{
            width: { duration: 0.12, ease: 'linear' },
            backgroundColor: { duration: 0.4 },
          }}
        />
      </div>

      {/* Urgency vignette — only at ≤3s */}
      <AnimatePresence>
        {isUrgent && (
          <motion.div
            key="vignette"
            className="pointer-events-none fixed inset-0 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              boxShadow: 'inset 0 0 120px rgba(239, 68, 68, 0.45)',
            }}
          />
        )}
      </AnimatePresence>
    </>
  )
}
