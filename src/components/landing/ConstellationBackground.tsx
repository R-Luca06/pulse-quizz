import { motion, useReducedMotion } from 'framer-motion'

const VIEWBOX_W = 1000
const VIEWBOX_H = 600
const STAR_COUNT = 130
const MAX_LINE_DIST = 120
const SHOOTING_STAR_COUNT = 3

interface Star {
  x: number
  y: number
  r: number
  delay: number
  duration: number
  bright: boolean
  driftX: number
  driftY: number
  driftDuration: number
}

interface Shooting {
  x1: number
  y1: number
  x2: number
  y2: number
  delay: number
  repeatDelay: number
  duration: number
}

function seededRandom(seed: number) {
  let s = seed
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

const STARS: Star[] = (() => {
  const rng = seededRandom(7)
  return Array.from({ length: STAR_COUNT }, (_, i) => {
    const bright = i % 11 === 0
    return {
      x: rng() * VIEWBOX_W,
      y: rng() * VIEWBOX_H,
      r: bright ? 1.6 + rng() * 1.6 : 0.5 + rng() * 1.3,
      delay: rng() * 3,
      duration: 1.4 + rng() * 2.4,
      bright,
      driftX: (rng() - 0.5) * 22,
      driftY: (rng() - 0.5) * 14,
      driftDuration: 12 + rng() * 14,
    }
  })
})()

interface Line {
  x1: number
  y1: number
  x2: number
  y2: number
  opacity: number
  key: string
}

const LINES: Line[] = (() => {
  const lines: Line[] = []
  for (let i = 0; i < STARS.length; i++) {
    for (let j = i + 1; j < STARS.length; j++) {
      const dx = STARS[i].x - STARS[j].x
      const dy = STARS[i].y - STARS[j].y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < MAX_LINE_DIST) {
        lines.push({
          x1: STARS[i].x,
          y1: STARS[i].y,
          x2: STARS[j].x,
          y2: STARS[j].y,
          opacity: 0.22 * (1 - dist / MAX_LINE_DIST),
          key: `${i}-${j}`,
        })
      }
    }
  }
  return lines
})()

const SHOOTING_STARS: Shooting[] = (() => {
  const rng = seededRandom(42)
  return Array.from({ length: SHOOTING_STAR_COUNT }, () => {
    const startX = rng() * VIEWBOX_W * 0.6
    const startY = rng() * VIEWBOX_H * 0.5
    const length = 140 + rng() * 120
    const angle = (rng() * 0.4 + 0.15) * Math.PI // diagonale vers le bas-droite
    return {
      x1: startX,
      y1: startY,
      x2: startX + Math.cos(angle) * length,
      y2: startY + Math.sin(angle) * length,
      delay: rng() * 10,
      repeatDelay: 6 + rng() * 10,
      duration: 0.9 + rng() * 0.6,
    }
  })
})()

export default function ConstellationBackground() {
  const reduce = useReducedMotion()

  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <radialGradient id="constellation-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="shooting-trail" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="60%" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#a78bfa" stopOpacity="1" />
        </linearGradient>
      </defs>

      {LINES.map(line => (
        <line
          key={line.key}
          x1={line.x1}
          y1={line.y1}
          x2={line.x2}
          y2={line.y2}
          stroke="#8b5cf6"
          strokeOpacity={line.opacity}
          strokeWidth={0.4}
        />
      ))}

      {STARS.map((star, i) => {
        if (reduce) {
          return (
            <circle
              key={i}
              cx={star.x}
              cy={star.y}
              r={star.r}
              fill={star.bright ? '#fef3c7' : 'white'}
              opacity={star.bright ? 0.85 : 0.55}
            />
          )
        }

        // Amplitude forte pour un scintillement bien marqué
        const opacityKeyframes = star.bright
          ? [0.4, 1, 0.4]
          : [0.15, 0.95, 0.15]
        const scaleKeyframes = star.bright ? [0.8, 1.25, 0.8] : [0.7, 1.15, 0.7]

        return (
          <motion.circle
            key={i}
            cx={star.x}
            cy={star.y}
            r={star.r}
            fill={star.bright ? '#fef3c7' : 'white'}
            initial={{ opacity: 0.3, scale: 1 }}
            animate={{
              opacity: opacityKeyframes,
              scale: scaleKeyframes,
              x: [0, star.driftX, 0],
              y: [0, star.driftY, 0],
            }}
            transition={{
              opacity: {
                duration: star.duration,
                repeat: Infinity,
                delay: star.delay,
                ease: 'easeInOut',
              },
              scale: {
                duration: star.duration,
                repeat: Infinity,
                delay: star.delay,
                ease: 'easeInOut',
              },
              x: {
                duration: star.driftDuration,
                repeat: Infinity,
                ease: 'easeInOut',
              },
              y: {
                duration: star.driftDuration,
                repeat: Infinity,
                ease: 'easeInOut',
              },
            }}
            style={{ transformOrigin: `${star.x}px ${star.y}px` }}
          />
        )
      })}

      {!reduce &&
        SHOOTING_STARS.map((s, i) => (
          <motion.line
            key={`shoot-${i}`}
            x1={s.x1}
            y1={s.y1}
            x2={s.x2}
            y2={s.y2}
            stroke="url(#shooting-trail)"
            strokeWidth={1.4}
            strokeLinecap="round"
            initial={{ opacity: 0, pathLength: 0 }}
            animate={{ opacity: [0, 1, 0], pathLength: [0, 1, 1] }}
            transition={{
              duration: s.duration,
              delay: s.delay,
              repeat: Infinity,
              repeatDelay: s.repeatDelay,
              ease: 'easeOut',
              times: [0, 0.5, 1],
            }}
          />
        ))}
    </svg>
  )
}
