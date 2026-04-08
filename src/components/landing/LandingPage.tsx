import { motion } from 'framer-motion'
import FloatingCardsBackground from './FloatingCardsBackground'
import StartButton from './StartButton'
import type { AppScreen } from '../../App'

interface Props {
  onStart: () => void
  screen: AppScreen
}

export default function LandingPage({ onStart, screen }: Props) {
  const isLaunching = screen === 'launching'

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-game-bg">
      {/* Background gradient blobs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/4 top-1/4 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-neon-violet/10 blur-3xl" />
        <div className="absolute right-1/4 bottom-1/4 h-96 w-96 translate-x-1/2 translate-y-1/2 rounded-full bg-neon-blue/10 blur-3xl" />
      </div>

      {/* Floating cards */}
      <FloatingCardsBackground isLaunching={isLaunching} />

      {/* Hero content */}
      <motion.div
        className="relative z-10 flex flex-col items-center gap-10 text-center"
        animate={isLaunching ? { opacity: 0, scale: 0.8 } : { opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="rounded-full border border-neon-violet/30 bg-neon-violet/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-neon-violet"
        >
          10 questions · Beat the clock
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
        >
          <h1 className="text-7xl font-black tracking-tight text-white sm:text-8xl">
            Pulse
            <span className="bg-gradient-to-r from-neon-violet to-neon-blue bg-clip-text text-transparent">
              {' '}Quizz
            </span>
          </h1>
          <p className="mt-4 text-lg text-white/40 font-light tracking-wide">
            Test your knowledge. Feel the rush.
          </p>
        </motion.div>

        {/* Play button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.6, type: 'spring', stiffness: 200 }}
        >
          <StartButton onClick={onStart} />
        </motion.div>

        {/* Footer hint */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 1 }}
          className="text-xs text-white/20 tracking-widest uppercase"
        >
          10s per question · general knowledge
        </motion.p>
      </motion.div>
    </div>
  )
}
