import { useMemo } from 'react'
import { motion } from 'framer-motion'
import type { TargetAndTransition, Transition } from 'framer-motion'
import type { LaunchPhase } from './LandingPage'

interface PlanetDef {
  key: string
  label: string
  letter: string
  color: string
  colorDeep: string
  hasRing: boolean
}

const PLANETS: PlanetDef[] = [
  { key: 'culture', label: 'Culture',    letter: 'C', color: '#A78BFA', colorDeep: '#4C1D95', hasRing: false },
  { key: 'geo',     label: 'Géographie', letter: 'G', color: '#34D399', colorDeep: '#064E3B', hasRing: true  },
  { key: 'histoire',label: 'Histoire',   letter: 'H', color: '#FBBF24', colorDeep: '#78350F', hasRing: false },
  { key: 'info',    label: 'Informatique', letter: 'I', color: '#22D3EE', colorDeep: '#155E75', hasRing: false },
  { key: 'jeu',     label: 'Jeux vidéo', letter: 'J', color: '#F472B6', colorDeep: '#831843', hasRing: false },
  { key: 'math',    label: 'Maths',      letter: 'M', color: '#60A5FA', colorDeep: '#1E3A8A', hasRing: true  },
  { key: 'science', label: 'Sciences',   letter: 'S', color: '#86EFAC', colorDeep: '#14532D', hasRing: false },
]

const ORBIT_POSITIONS = [
  { x: -30, y: -28 },
  { x:  30, y: -28 },
  { x:   0, y: -36 },
  { x: -38, y:  -2 },
  { x:  38, y:  -2 },
  { x: -28, y:  22 },
  { x:  28, y:  22 },
]

interface PlanetConfig extends PlanetDef {
  id: number
  x: number
  y: number
  size: number
  floatY: number
  duration: number
  delay: number
  ringTilt: number
  explosionX: string
  explosionY: string
  explosionRotate: number
}

interface StarConfig {
  id: number
  x: number
  y: number
  r: number
  opacity: number
  blinkDelay: number
  blinkDuration: number
}

const STAR_COUNT = 90

function generatePlanets(): PlanetConfig[] {
  return PLANETS.map((p, i) => {
    const pos = ORBIT_POSITIONS[i] ?? ORBIT_POSITIONS[0]
    const angle = Math.atan2(pos.y, pos.x)
    const dist = 75 + Math.random() * 40
    return {
      ...p,
      id: i,
      x: pos.x,
      y: pos.y,
      size: 60 + (i % 3) * 10,
      floatY: 2 + Math.random() * 2.5,
      duration: 9 + Math.random() * 5,
      delay: Math.random() * -8,
      ringTilt: -15 - Math.random() * 30,
      explosionX: `${Math.cos(angle) * dist}vw`,
      explosionY: `${Math.sin(angle) * dist * 0.65}vh`,
      explosionRotate: (Math.random() - 0.5) * 140,
    }
  })
}

function generateStars(): StarConfig[] {
  return Array.from({ length: STAR_COUNT }, (_, id) => {
    const layer = id < 50 ? 0 : id < 75 ? 1 : 2
    const r = layer === 0 ? 0.5 + Math.random() * 0.6
            : layer === 1 ? 0.8 + Math.random() * 0.8
            : 1.2 + Math.random() * 1.2
    const opacity = layer === 0 ? 0.25 + Math.random() * 0.25
                  : layer === 1 ? 0.4 + Math.random() * 0.3
                  : 0.6 + Math.random() * 0.35
    return {
      id,
      x: Math.random() * 100,
      y: Math.random() * 100,
      r,
      opacity,
      blinkDelay: Math.random() * -6,
      blinkDuration: 3 + Math.random() * 4,
    }
  })
}

interface Props {
  launchPhase: LaunchPhase
}

export default function KnowledgeUniverse({ launchPhase }: Props) {
  const planets = useMemo(() => generatePlanets(), [])
  const stars = useMemo(() => generateStars(), [])
  const isIdle = launchPhase === 'idle'

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute left-1/4 top-1/3 h-[40vw] w-[40vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-neon-violet/15 blur-[120px]" />
        <div className="absolute right-1/4 bottom-1/4 h-[36vw] w-[36vw] translate-x-1/2 translate-y-1/2 rounded-full bg-neon-blue/15 blur-[120px]" />
        <div className="absolute left-1/2 top-1/2 h-[24vw] w-[24vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-neon-cyan/10 blur-[100px]" />
      </div>

      <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 100">
        {stars.map((s) => (
          <motion.circle
            key={s.id}
            cx={s.x}
            cy={s.y}
            r={s.r / 10}
            fill="#ffffff"
            initial={{ opacity: s.opacity }}
            animate={{ opacity: [s.opacity, s.opacity * 0.3, s.opacity] }}
            transition={{
              duration: s.blinkDuration,
              delay: s.blinkDelay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
      </svg>

      {planets.map((planet) => {
        let animateTarget: TargetAndTransition
        let transition: Transition

        if (isIdle) {
          animateTarget = {
            x: `calc(${planet.x}vw - 50%)`,
            y: [
              `calc(${planet.y}vh - 50%)`,
              `calc(${planet.y - planet.floatY}vh - 50%)`,
              `calc(${planet.y}vh - 50%)`,
            ],
            opacity: 1,
          }
          transition = {
            duration: planet.duration,
            delay: planet.delay,
            repeat: Infinity,
            ease: 'easeInOut',
            opacity: { duration: 1.2, delay: planet.id * 0.08, repeat: 0 },
          }
        } else if (launchPhase === 'converging' || launchPhase === 'shaking') {
          animateTarget = {
            x: 'calc(0vw - 50%)',
            y: 'calc(0vh - 50%)',
            scale: 0.6,
            opacity: 1,
          }
          transition = { duration: 0.36, ease: [0.32, 0, 0.67, 0] }
        } else {
          animateTarget = {
            x: `calc(${planet.explosionX} - 50%)`,
            y: `calc(${planet.explosionY} - 50%)`,
            scale: [0.9, 1.4, 0.3],
            rotate: planet.explosionRotate,
            opacity: [1, 1, 0],
          }
          transition = {
            duration: 0.5,
            ease: [0.25, 0, 1, 1],
            opacity: { duration: 0.4, delay: 0.1 },
          }
        }

        return (
          <motion.div
            key={planet.id}
            className="absolute left-1/2 top-1/2 flex flex-col items-center"
            initial={{
              x: `calc(${planet.x}vw - 50%)`,
              y: `calc(${planet.y}vh - 50%)`,
              opacity: 0,
            }}
            animate={animateTarget}
            transition={transition}
          >
            <div className="relative" style={{ width: planet.size, height: planet.size }}>
              {planet.hasRing && (
                <div
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border"
                  style={{
                    width: planet.size * 1.55,
                    height: planet.size * 0.38,
                    borderColor: `${planet.color}66`,
                    borderWidth: 1.5,
                    transform: `translate(-50%, -50%) rotate(${planet.ringTilt}deg)`,
                    boxShadow: `0 0 14px ${planet.color}33`,
                  }}
                />
              )}
              <div
                className="relative flex h-full w-full items-center justify-center rounded-full"
                style={{
                  background: `radial-gradient(circle at 30% 28%, ${planet.color} 0%, ${planet.color} 35%, ${planet.colorDeep} 100%)`,
                  boxShadow: `0 0 24px ${planet.color}55, inset -6px -8px 14px rgba(0,0,0,0.35), inset 4px 4px 10px rgba(255,255,255,0.12)`,
                }}
              >
                <span
                  className="select-none font-black leading-none"
                  style={{
                    fontSize: planet.size * 0.42,
                    color: '#ffffff',
                    textShadow: `0 0 8px ${planet.color}`,
                    letterSpacing: '-0.04em',
                  }}
                >
                  {planet.letter}
                </span>
              </div>
            </div>
            <span
              className="mt-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55"
              style={{ textShadow: `0 0 10px ${planet.color}88` }}
            >
              {planet.label}
            </span>
          </motion.div>
        )
      })}
    </div>
  )
}
