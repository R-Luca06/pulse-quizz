import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

interface Props {
  score: number
  onReplay: () => void
}

const TIERS = [
  { min: 10, label: 'Parfait !',         emoji: '🏆', color: '#EAB308' },
  { min: 7,  label: 'Impressionnant !',  emoji: '🎯', color: '#8B5CF6' },
  { min: 4,  label: 'Pas mal !',         emoji: '🔥', color: '#3B82F6' },
  { min: 0,  label: 'Retente ta chance', emoji: '😅', color: '#6B7280' },
]

function getTier(score: number) {
  return TIERS.find((t) => score >= t.min)!
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show:   { opacity: 1, y: 0 },
}

export default function ResultScreen({ score, onReplay }: Props) {
  const [displayed, setDisplayed] = useState(0)
  const tier = getTier(score)

  // Count-up animation
  useEffect(() => {
    if (score === 0) return
    let current = 0
    const step = Math.ceil(score / 12)
    const id = setInterval(() => {
      current = Math.min(current + step, score)
      setDisplayed(current)
      if (current >= score) clearInterval(id)
    }, 70)
    return () => clearInterval(id)
  }, [score])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-game-bg px-4"
    >
      {/* Background blobs */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
          style={{ background: `${tier.color}18` }}
        />
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        transition={{ staggerChildren: 0.1, delayChildren: 0.2 }}
        className="relative z-10 flex flex-col items-center gap-6 text-center"
      >
        {/* Emoji */}
        <motion.div
          variants={fadeUp}
          className="text-6xl"
          animate={{ rotate: [0, -8, 8, -4, 4, 0] }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          {tier.emoji}
        </motion.div>

        {/* Score */}
        <motion.div variants={fadeUp} className="flex items-end gap-2">
          <span
            className="text-8xl font-black leading-none tabular-nums sm:text-9xl"
            style={{ color: tier.color }}
          >
            {displayed}
          </span>
          <span className="mb-2 text-4xl font-black text-white/20 sm:text-5xl">/10</span>
        </motion.div>

        {/* Score dots */}
        <motion.div variants={fadeUp} className="flex gap-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <motion.div
              key={i}
              className="h-2 w-5 rounded-full"
              initial={{ scaleX: 0, backgroundColor: '#1E1E2E' }}
              animate={{
                scaleX: 1,
                backgroundColor: i < score ? tier.color : '#1E1E2E',
              }}
              transition={{ delay: 0.4 + i * 0.06, duration: 0.25 }}
              style={{ originX: 0 }}
            />
          ))}
        </motion.div>

        {/* Performance label */}
        <motion.div variants={fadeUp} className="flex flex-col items-center gap-1">
          <p className="text-2xl font-bold text-white">{tier.label}</p>
          <p className="text-sm text-white/30">
            {score === 10
              ? 'Tu as répondu juste à toutes les questions !'
              : score === 0
              ? 'Toutes les questions ont eu raison de toi.'
              : `${score} bonne${score > 1 ? 's' : ''} réponse${score > 1 ? 's' : ''} sur 10`}
          </p>
        </motion.div>

        {/* Replay button */}
        <motion.div variants={fadeUp} className="mt-4">
          <motion.button
            onClick={onReplay}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.96 }}
            className="rounded-full bg-gradient-to-r from-neon-violet to-neon-blue px-10 py-4 text-base font-bold tracking-wide text-white shadow-neon-violet"
          >
            Rejouer
          </motion.button>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}
