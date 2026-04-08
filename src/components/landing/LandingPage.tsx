import { useEffect, useState } from 'react'
import { motion, useAnimationControls } from 'framer-motion'
import FloatingCardsBackground from './FloatingCardsBackground'
import StartButton from './StartButton'
import type { AppScreen } from '../../App'

export type LaunchPhase = 'idle' | 'converging' | 'shaking' | 'exploding'

interface Props {
  onStart: () => void
  onExplosion: () => void
  screen: AppScreen
}

export default function LandingPage({ onStart, onExplosion, screen }: Props) {
  const isLaunching = screen === 'launching'
  const [launchPhase, setLaunchPhase] = useState<LaunchPhase>('idle')
  const shakeControls = useAnimationControls()

  useEffect(() => {
    if (!isLaunching) {
      setLaunchPhase('idle')
      return
    }

    let t1: ReturnType<typeof setTimeout>

    setLaunchPhase('converging')

    // After cards have converged → shake
    t1 = setTimeout(async () => {
      setLaunchPhase('shaking')
      await shakeControls.start({
        x: [0, -18, 18, -14, 14, -9, 9, -5, 5, 0],
        transition: { duration: 0.32, ease: 'linear' },
      })
      // Shake done → explode and signal App to mount quiz
      setLaunchPhase('exploding')
      onExplosion()
    }, 380)

    return () => {
      clearTimeout(t1)
    }
  }, [isLaunching]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-game-bg">
      {/* Background gradient blobs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/4 top-1/4 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-neon-violet/10 blur-3xl" />
        <div className="absolute right-1/4 bottom-1/4 h-96 w-96 translate-x-1/2 translate-y-1/2 rounded-full bg-neon-blue/10 blur-3xl" />
      </div>

      {/* Cards + shake wrapper */}
      <motion.div animate={shakeControls} className="absolute inset-0">
        <FloatingCardsBackground launchPhase={launchPhase} />
      </motion.div>

      {/* White flash at explosion moment */}
      {launchPhase === 'exploding' && (
        <motion.div
          className="pointer-events-none absolute inset-0 z-20 bg-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.3, 0] }}
          transition={{ duration: 0.45 }}
        />
      )}

      {/* Hero content — fades out on launch */}
      <motion.div
        className="relative z-10 flex flex-col items-center gap-6 text-center sm:gap-8 md:gap-10"
        animate={
          isLaunching
            ? { opacity: 0, scale: 0.85, transition: { duration: 0.25 } }
            : { opacity: 1, scale: 1 }
        }
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
          <h1 className="text-4xl font-black tracking-tight text-white sm:text-6xl md:text-7xl lg:text-8xl">
            Pulse
            <span className="bg-gradient-to-r from-neon-violet to-neon-blue bg-clip-text text-transparent">
              {' '}Quizz
            </span>
          </h1>
          <p className="mt-4 text-lg font-light tracking-wide text-white/40">
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
          className="text-xs uppercase tracking-widest text-white/20"
        >
          10s per question · general knowledge
        </motion.p>
      </motion.div>
    </div>
  )
}
