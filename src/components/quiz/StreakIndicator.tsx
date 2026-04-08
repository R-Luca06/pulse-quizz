import { motion, AnimatePresence } from 'framer-motion'

interface Props {
  streak: number
}

export default function StreakIndicator({ streak }: Props) {
  if (streak < 2) return null

  const isHot = streak >= 5
  const icon = isHot ? '⚡' : '🔥'

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={streak}
        initial={{ scale: 0.6, opacity: 0, y: -4 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 18 }}
        className="flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold"
        style={{
          background: isHot
            ? 'rgba(234, 179, 8, 0.12)'
            : 'rgba(251, 146, 60, 0.1)',
          border: isHot
            ? '1px solid rgba(234, 179, 8, 0.4)'
            : '1px solid rgba(251, 146, 60, 0.3)',
          color: isHot ? '#EAB308' : '#FB923C',
          boxShadow: isHot
            ? '0 0 16px rgba(234, 179, 8, 0.35)'
            : '0 0 10px rgba(251, 146, 60, 0.2)',
        }}
      >
        <motion.span
          animate={isHot ? { rotate: [0, -15, 15, -10, 10, 0] } : {}}
          transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1.5 }}
        >
          {icon}
        </motion.span>
        {streak}
      </motion.div>
    </AnimatePresence>
  )
}
