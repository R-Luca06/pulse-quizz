import { useMemo } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import type { TargetAndTransition, Transition } from 'framer-motion'
import type { LaunchPhase } from './LandingPage'

const BOOK_PALETTE: Array<[string, string]> = [
  ['#7F1D1D', '#B91C1C'],
  ['#14532D', '#166534'],
  ['#1E3A8A', '#1E40AF'],
  ['#78350F', '#B45309'],
  ['#3730A3', '#4338CA'],
  ['#831843', '#9F1239'],
  ['#92400E', '#C2410C'],
  ['#064E3B', '#047857'],
]

const MAGIC_PALETTE: Array<[string, string]> = [
  ['#8B5CF6', '#A78BFA'],
  ['#06B6D4', '#22D3EE'],
  ['#EC4899', '#F472B6'],
]

const GLYPHS = ['A', 'B', 'C', 'D', '?', 'Σ', 'π', 'Ω', '1', '2', '3', 'α', 'β', '∫', '∞']
const SHELF_COUNT = 5

interface Spine {
  x: number
  y: number
  w: number
  h: number
  color: string
  colorLight: string
  isMagic: boolean
  magicDelay: number
}

interface Dust {
  id: number
  x: number
  y: number
  r: number
  duration: number
  delay: number
  drift: number
}

interface Glyph {
  id: number
  char: string
  x: number
  y: number
  size: number
  duration: number
  delay: number
  drift: number
  rotateEnd: number
}

interface FloatingBook {
  id: number
  x: number
  y: number
  w: number
  h: number
  color: string
  colorLight: string
  rotation: number
  floatY: number
  duration: number
  delay: number
  explosionX: string
  explosionY: string
  explosionRotate: number
}

function generateShelves(): Spine[][] {
  return Array.from({ length: SHELF_COUNT }, (_, shelfIdx) => {
    const shelfH = 100 / SHELF_COUNT
    const shelfTop = shelfIdx * shelfH
    const spines: Spine[] = []
    let x = 0
    while (x < 100) {
      const w = 1.2 + Math.random() * 2.6
      const h = shelfH * 0.55 + Math.random() * (shelfH * 0.32)
      const isMagic = Math.random() < 0.06
      const palette = isMagic
        ? MAGIC_PALETTE[Math.floor(Math.random() * MAGIC_PALETTE.length)]
        : BOOK_PALETTE[Math.floor(Math.random() * BOOK_PALETTE.length)]
      spines.push({
        x,
        y: shelfTop + shelfH - h - 0.25,
        w,
        h,
        color: palette[0],
        colorLight: palette[1],
        isMagic,
        magicDelay: Math.random() * -5,
      })
      x += w + 0.08 + Math.random() * 0.18
    }
    return spines
  })
}

function generateDust(): Dust[] {
  return Array.from({ length: 35 }, (_, id) => ({
    id,
    x: Math.random() * 100,
    y: 90 + Math.random() * 20,
    r: 0.12 + Math.random() * 0.22,
    duration: 12 + Math.random() * 10,
    delay: Math.random() * -15,
    drift: (Math.random() - 0.5) * 8,
  }))
}

function generateGlyphs(): Glyph[] {
  return Array.from({ length: 14 }, (_, id) => ({
    id,
    char: GLYPHS[Math.floor(Math.random() * GLYPHS.length)],
    x: Math.random() * 100,
    y: 10 + Math.random() * 80,
    size: 14 + Math.random() * 18,
    duration: 16 + Math.random() * 12,
    delay: Math.random() * -18,
    drift: (Math.random() - 0.5) * 12,
    rotateEnd: (Math.random() - 0.5) * 15,
  }))
}

const FLOATING_POSITIONS = [
  { x: -30, y: -24 },
  { x:  28, y: -26 },
  { x: -34, y:   4 },
  { x:  34, y:   2 },
  { x: -24, y:  22 },
  { x:  26, y:  24 },
]

function generateFloatingBooks(): FloatingBook[] {
  return FLOATING_POSITIONS.map((pos, i) => {
    const isMagic = i % 2 === 0
    const palette = isMagic
      ? MAGIC_PALETTE[i % MAGIC_PALETTE.length]
      : BOOK_PALETTE[i % BOOK_PALETTE.length]
    const angle = Math.atan2(pos.y, pos.x)
    const dist = 75 + Math.random() * 30
    return {
      id: i,
      x: pos.x,
      y: pos.y,
      w: 42 + Math.random() * 14,
      h: 56 + Math.random() * 16,
      color: palette[0],
      colorLight: palette[1],
      rotation: (Math.random() - 0.5) * 18,
      floatY: 2 + Math.random() * 2,
      duration: 8 + Math.random() * 5,
      delay: Math.random() * -8,
      explosionX: `${Math.cos(angle) * dist}vw`,
      explosionY: `${Math.sin(angle) * dist * 0.65}vh`,
      explosionRotate: (Math.random() - 0.5) * 140,
    }
  })
}

interface Props {
  launchPhase: LaunchPhase
}

export default function LibraryBackground({ launchPhase }: Props) {
  const reduced = useReducedMotion()
  const shelves = useMemo(() => generateShelves(), [])
  const dust = useMemo(() => generateDust(), [])
  const glyphs = useMemo(() => generateGlyphs(), [])
  const books = useMemo(() => generateFloatingBooks(), [])
  const isIdle = launchPhase === 'idle'

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 50%, #2A1430 0%, #1C0B22 45%, #0D0513 100%)',
        }}
      />

      <svg
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="none"
        viewBox="0 0 100 100"
      >
        <defs>
          <linearGradient id="lib-shelf-wood" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2B1408" />
            <stop offset="50%" stopColor="#5C2E12" />
            <stop offset="100%" stopColor="#1F0D05" />
          </linearGradient>
          <linearGradient id="lib-shadow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#000000" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </linearGradient>
        </defs>

        {shelves.map((spines, shelfIdx) => {
          const shelfH = 100 / SHELF_COUNT
          const shelfTop = shelfIdx * shelfH
          return (
            <g key={`shelf-${shelfIdx}`}>
              <rect
                x={0}
                y={shelfTop}
                width={100}
                height={shelfH * 0.22}
                fill="url(#lib-shadow)"
              />
              {spines.map((s, i) => (
                <g key={`s-${shelfIdx}-${i}`}>
                  <rect
                    x={s.x}
                    y={s.y}
                    width={s.w}
                    height={s.h}
                    fill={s.color}
                    opacity={s.isMagic ? 1 : 0.92}
                  />
                  <rect
                    x={s.x}
                    y={s.y}
                    width={s.w * 0.22}
                    height={s.h}
                    fill={s.colorLight}
                    opacity="0.45"
                  />
                  <rect
                    x={s.x + s.w * 0.3}
                    y={s.y + s.h * 0.2}
                    width={s.w * 0.4}
                    height={0.15}
                    fill="#FBBF24"
                    opacity="0.55"
                  />
                  {s.isMagic && (
                    <motion.rect
                      x={s.x - 0.15}
                      y={s.y - 0.15}
                      width={s.w + 0.3}
                      height={s.h + 0.3}
                      fill="none"
                      stroke={s.colorLight}
                      strokeWidth={0.12}
                      initial={{ opacity: 0.4 }}
                      animate={
                        reduced
                          ? { opacity: 0.6 }
                          : { opacity: [0.25, 0.9, 0.25] }
                      }
                      transition={{
                        duration: 2.4,
                        delay: s.magicDelay,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                    />
                  )}
                </g>
              ))}
              <rect
                x={0}
                y={shelfTop + shelfH - 1.4}
                width={100}
                height={1.4}
                fill="url(#lib-shelf-wood)"
              />
              <rect
                x={0}
                y={shelfTop + shelfH - 0.25}
                width={100}
                height={0.25}
                fill="#0A0206"
                opacity="0.6"
              />
            </g>
          )
        })}
      </svg>

      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 55%, rgba(251, 191, 36, 0.18) 0%, rgba(251, 146, 60, 0.08) 25%, transparent 55%)',
          mixBlendMode: 'screen',
        }}
      />

      <svg
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="none"
        viewBox="0 0 100 100"
      >
        {dust.map((d) => (
          <motion.circle
            key={d.id}
            cx={d.x}
            cy={d.y}
            r={d.r}
            fill="#FDE68A"
            initial={{ opacity: 0 }}
            animate={
              reduced
                ? { opacity: 0.4, cy: d.y - 50 }
                : {
                    cy: [d.y, d.y - 110],
                    cx: [d.x, d.x + d.drift, d.x - d.drift * 0.5],
                    opacity: [0, 0.7, 0.7, 0],
                  }
            }
            transition={{
              duration: d.duration,
              delay: d.delay,
              repeat: Infinity,
              ease: 'linear',
              opacity: {
                duration: d.duration,
                delay: d.delay,
                repeat: Infinity,
                times: [0, 0.15, 0.85, 1],
              },
            }}
          />
        ))}
      </svg>

      {glyphs.map((g) => (
        <motion.div
          key={g.id}
          className="absolute select-none font-serif"
          style={{
            left: `${g.x}%`,
            top: `${g.y}%`,
            fontSize: g.size,
            color: '#FBBF24',
            textShadow: '0 0 8px rgba(139, 92, 246, 0.6), 0 0 4px rgba(251, 191, 36, 0.8)',
          }}
          initial={{ opacity: 0 }}
          animate={
            reduced
              ? { opacity: 0.35 }
              : {
                  y: [0, -30, -60],
                  x: [0, g.drift, -g.drift * 0.4],
                  opacity: [0, 0.5, 0.5, 0],
                  rotate: [0, g.rotateEnd],
                }
          }
          transition={{
            duration: g.duration,
            delay: g.delay,
            repeat: Infinity,
            ease: 'linear',
            opacity: { duration: g.duration, delay: g.delay, repeat: Infinity, times: [0, 0.2, 0.8, 1] },
          }}
        >
          {g.char}
        </motion.div>
      ))}

      {books.map((book) => {
        let animateTarget: TargetAndTransition
        let transition: Transition

        if (isIdle) {
          animateTarget = {
            x: `calc(${book.x}vw - 50%)`,
            y: [
              `calc(${book.y}vh - 50%)`,
              `calc(${book.y - book.floatY}vh - 50%)`,
              `calc(${book.y}vh - 50%)`,
            ],
            rotate: [book.rotation, book.rotation + 2, book.rotation],
            opacity: 1,
          }
          transition = {
            duration: book.duration,
            delay: book.delay,
            repeat: Infinity,
            ease: 'easeInOut',
            opacity: { duration: 1.2, delay: book.id * 0.08, repeat: 0 },
          }
        } else if (launchPhase === 'converging' || launchPhase === 'shaking') {
          animateTarget = {
            x: 'calc(0vw - 50%)',
            y: 'calc(0vh - 50%)',
            scale: 0.7,
            rotate: 0,
            opacity: 1,
          }
          transition = { duration: 0.36, ease: [0.32, 0, 0.67, 0] }
        } else {
          animateTarget = {
            x: `calc(${book.explosionX} - 50%)`,
            y: `calc(${book.explosionY} - 50%)`,
            scale: [0.9, 1.4, 0.3],
            rotate: book.explosionRotate,
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
            key={book.id}
            className="absolute left-1/2 top-1/2"
            style={{ width: book.w, height: book.h }}
            initial={{
              x: `calc(${book.x}vw - 50%)`,
              y: `calc(${book.y}vh - 50%)`,
              rotate: book.rotation,
              opacity: 0,
            }}
            animate={animateTarget}
            transition={transition}
          >
            <div
              className="relative h-full w-full rounded-sm"
              style={{
                background: `linear-gradient(135deg, ${book.colorLight} 0%, ${book.color} 100%)`,
                boxShadow: `0 8px 20px rgba(0,0,0,0.5), 0 0 18px ${book.colorLight}66, inset 2px 0 0 rgba(255,255,255,0.15), inset -2px 0 0 rgba(0,0,0,0.3)`,
              }}
            >
              <div
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] font-bold"
                style={{ color: '#FBBF24', textShadow: '0 0 4px rgba(0,0,0,0.8)' }}
              >
                ?
              </div>
              <div
                className="absolute inset-x-2 top-2 h-px"
                style={{ background: '#FBBF24', opacity: 0.5 }}
              />
              <div
                className="absolute inset-x-2 bottom-2 h-px"
                style={{ background: '#FBBF24', opacity: 0.5 }}
              />
            </div>
          </motion.div>
        )
      })}

      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(5, 2, 10, 0.65) 80%, rgba(5, 2, 10, 0.85) 100%)',
        }}
      />
    </div>
  )
}
