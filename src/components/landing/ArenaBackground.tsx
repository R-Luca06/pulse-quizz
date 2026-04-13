import { useMemo } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

const COLUMN_COUNT = 6
const PARTICLE_COUNT = 10

interface Column {
  left: string
  height: string
  delay: number
  duration: number
}

interface Particle {
  left: string
  duration: number
  delay: number
  size: number
}

function generateColumns(): Column[] {
  return Array.from({ length: COLUMN_COUNT }, (_, i) => {
    const t = (i + 0.5) / COLUMN_COUNT
    const angle = (t - 0.5) * Math.PI * 0.9
    const x = 50 + Math.sin(angle) * 35
    const heightFactor = 1 - Math.abs(t - 0.5) * 0.7
    return {
      left: `${x}%`,
      height: `${55 * heightFactor}vh`,
      delay: i * 0.8,
      duration: 4.5 + (i % 3) * 0.5,
    }
  })
}

function generateParticles(): Particle[] {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
    left: `${15 + ((i * 73) % 70)}%`,
    duration: 15 + ((i * 37) % 5),
    delay: (i * 1.7) % 18,
    size: 1 + (i % 2) * 0.5,
  }))
}

export default function ArenaBackground() {
  const reduced = useReducedMotion()
  const columns = useMemo(() => generateColumns(), [])
  const particles = useMemo(() => generateParticles(), [])

  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden bg-game-bg"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center 60%, #1a0f2e 0%, #0a0612 70%)',
        }}
      />

      <div
        className="absolute left-1/2 top-[68%] -translate-x-1/2 -translate-y-1/2 rounded-[50%] border border-neon-violet/30"
        style={{
          width: '72vw',
          height: '22vh',
          boxShadow: '0 0 60px rgba(139, 92, 246, 0.15) inset',
        }}
      />

      <div
        className="absolute left-1/2 top-[68%] -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl"
        style={{
          width: '34vw',
          height: '10vh',
          background:
            'radial-gradient(ellipse at center, rgba(234, 179, 8, 0.28) 0%, rgba(234, 179, 8, 0.08) 55%, transparent 80%)',
        }}
      />

      <div
        className="absolute -top-10 left-[18%] h-[85vh] w-[28vw] rounded-full bg-neon-violet/20 blur-3xl"
        style={{ opacity: 0.3 }}
      />
      <div
        className="absolute -top-10 right-[18%] h-[85vh] w-[28vw] rounded-full bg-neon-cyan/20 blur-3xl"
        style={{ opacity: 0.3 }}
      />

      {columns.map((col, i) => (
        <motion.div
          key={`col-${i}`}
          className="absolute w-[2px] rounded-full bg-gradient-to-t from-neon-violet to-neon-cyan blur-sm"
          style={{
            left: col.left,
            height: col.height,
            bottom: '32%',
            transform: 'translateX(-50%)',
          }}
          initial={{ opacity: 0.6 }}
          animate={reduced ? { opacity: 0.8 } : { opacity: [0.6, 1, 0.6] }}
          transition={{
            duration: col.duration,
            delay: col.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}

      <svg
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="none"
        viewBox="0 0 100 100"
      >
        <path
          d="M 38 42 Q 50 30, 62 42"
          fill="none"
          stroke="#06B6D4"
          strokeOpacity="0.4"
          strokeWidth="0.15"
        />
        <path
          d="M 30 48 Q 50 28, 70 48"
          fill="none"
          stroke="#06B6D4"
          strokeOpacity="0.28"
          strokeWidth="0.12"
        />
        <path
          d="M 22 54 Q 50 26, 78 54"
          fill="none"
          stroke="#06B6D4"
          strokeOpacity="0.18"
          strokeWidth="0.1"
        />
      </svg>

      {particles.map((p, i) => (
        <motion.div
          key={`p-${i}`}
          className="absolute rounded-full bg-neon-gold"
          style={{
            left: p.left,
            bottom: '28%',
            width: `${p.size * 3}px`,
            height: `${p.size * 3}px`,
            boxShadow: '0 0 6px rgba(234, 179, 8, 0.8)',
          }}
          initial={{ opacity: 0, y: 0 }}
          animate={
            reduced
              ? { opacity: 0.4 }
              : { y: [0, -420], opacity: [0, 1, 1, 0] }
          }
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'linear',
            opacity: {
              duration: p.duration,
              delay: p.delay,
              repeat: Infinity,
              times: [0, 0.15, 0.85, 1],
              ease: 'linear',
            },
          }}
        />
      ))}

      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 50%, transparent 45%, rgba(5, 2, 10, 0.55) 82%, rgba(5, 2, 10, 0.8) 100%)',
        }}
      />
    </motion.div>
  )
}
