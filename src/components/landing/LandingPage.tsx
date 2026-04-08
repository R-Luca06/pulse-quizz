import { useEffect, useState } from 'react'
import { motion, useAnimationControls } from 'framer-motion'
import FloatingCardsBackground from './FloatingCardsBackground'
import StartButton from './StartButton'
import type { AppScreen } from '../../App'
import type { GameMode, Difficulty } from '../../types/quiz'

export type LaunchPhase = 'idle' | 'converging' | 'shaking' | 'exploding'

interface Props {
  onStart: (mode: GameMode, difficulty: Difficulty) => void
  onExplosion: () => void
  screen: AppScreen
}

const DIFFICULTIES: { value: Difficulty; label: string }[] = [
  { value: 'mixed',  label: 'Mixte' },
  { value: 'easy',   label: 'Facile' },
  { value: 'medium', label: 'Moyen' },
  { value: 'hard',   label: 'Difficile' },
]

export default function LandingPage({ onStart, onExplosion, screen }: Props) {
  const isLaunching = screen === 'launching'
  const [launchPhase, setLaunchPhase] = useState<LaunchPhase>('idle')
  const shakeControls = useAnimationControls()

  const [mode, setMode] = useState<GameMode>('normal')
  const [difficulty, setDifficulty] = useState<Difficulty>('mixed')

  useEffect(() => {
    if (!isLaunching) {
      setLaunchPhase('idle')
      return
    }

    let t1: ReturnType<typeof setTimeout>

    setLaunchPhase('converging')

    t1 = setTimeout(async () => {
      setLaunchPhase('shaking')
      await shakeControls.start({
        x: [0, -18, 18, -14, 14, -9, 9, -5, 5, 0],
        transition: { duration: 0.32, ease: 'linear' },
      })
      setLaunchPhase('exploding')
      onExplosion()
    }, 380)

    return () => { clearTimeout(t1) }
  }, [isLaunching]) // eslint-disable-line react-hooks/exhaustive-deps

  function handlePlay() {
    onStart(mode, difficulty)
  }

  const selectBase = 'cursor-pointer rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors duration-150'
  const selectActive = 'border-neon-violet bg-neon-violet/10 text-white'
  const selectInactive = 'border-white/10 bg-white/5 text-white/40 hover:border-white/20 hover:text-white/60'

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

      {/* Hero content */}
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

        {/* Mode selector */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.45 }}
          className="flex w-full max-w-xs flex-col items-center gap-2"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-white/30">Mode</p>
          <div className="flex w-full gap-2">
            <button
              onClick={() => setMode('normal')}
              className={[selectBase, 'flex flex-1 flex-col items-start gap-0.5 p-3', mode === 'normal' ? selectActive : selectInactive].join(' ')}
            >
              <span className="font-bold">Normal</span>
              <span className="text-[10px] opacity-60">10 questions</span>
            </button>
            <button
              onClick={() => setMode('survie')}
              className={[selectBase, 'flex flex-1 flex-col items-start gap-0.5 p-3', mode === 'survie' ? selectActive : selectInactive].join(' ')}
            >
              <span className="font-bold">Survie</span>
              <span className="text-[10px] opacity-60">1 erreur = fin</span>
            </button>
          </div>
        </motion.div>

        {/* Difficulty selector */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.55 }}
          className="flex flex-col items-center gap-2"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-white/30">Difficulté</p>
          <div className="flex gap-2">
            {DIFFICULTIES.map((d) => (
              <button
                key={d.value}
                onClick={() => setDifficulty(d.value)}
                className={[selectBase, difficulty === d.value ? selectActive : selectInactive].join(' ')}
              >
                {d.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Play button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.65, type: 'spring', stiffness: 200 }}
        >
          <StartButton onClick={handlePlay} />
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
