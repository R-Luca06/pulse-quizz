import { motion, useReducedMotion } from 'framer-motion'

interface PileConfig {
  className: string
  count: number
  hideOnMobile: boolean
  palette: number
}

// Piles repositionnées : proches du podium, sur la ligne du sol (~bottom 18-22%),
// en arrière-plan (z-0 dans PodiumScene).
const PILES: PileConfig[] = [
  {
    className: 'absolute bottom-[18%] left-[18%] sm:left-[22%] sm:bottom-[20%]',
    count: 4,
    hideOnMobile: false,
    palette: 0,
  },
  {
    className: 'absolute bottom-[14%] left-[32%] sm:left-[34%] sm:bottom-[16%]',
    count: 2,
    hideOnMobile: true,
    palette: 1,
  },
  {
    className: 'absolute bottom-[18%] right-[18%] sm:right-[22%] sm:bottom-[20%]',
    count: 3,
    hideOnMobile: false,
    palette: 2,
  },
  {
    className: 'absolute bottom-[14%] right-[32%] sm:right-[34%] sm:bottom-[16%]',
    count: 5,
    hideOnMobile: true,
    palette: 3,
  },
]

const COLOR_PALETTES = [
  ['#4C1D95', '#6D28D9', '#1E3A8A'],
  ['#1E3A8A', '#3B82F6', '#5B21B6'],
  ['#581C87', '#7C3AED', '#164E63'],
  ['#312E81', '#4338CA', '#701A75'],
]

export default function BookPiles() {
  const reduced = useReducedMotion()

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0"
    >
      {PILES.map((pile, i) => (
        <motion.div
          key={i}
          className={`${pile.className} ${pile.hideOnMobile ? 'hidden sm:block' : ''}`}
          animate={reduced ? undefined : { y: [0, -4, 0] }}
          transition={{
            duration: 3.5 + i * 0.4,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.7,
          }}
        >
          <BookStack count={pile.count} palette={pile.palette} />
        </motion.div>
      ))}
    </div>
  )
}

function BookStack({ count, palette }: { count: number; palette: number }) {
  const colors = COLOR_PALETTES[palette % COLOR_PALETTES.length]
  const books = Array.from({ length: count }, (_, i) => ({
    from: colors[i % colors.length],
    to: colors[(i + 1) % colors.length],
    width: 58 + ((palette * 3 + i * 2) % 3) * 8,
  }))

  return (
    <div className="flex flex-col items-center">
      {books.map((book, i) => (
        <div
          key={i}
          className="h-3 rounded-sm sm:h-4"
          style={{
            width: `${book.width}px`,
            background: `linear-gradient(to right, ${book.from}, ${book.to})`,
            borderLeft: '2px solid #EAB308',
            boxShadow:
              '0 2px 4px rgba(0, 0, 0, 0.6), inset 0 -1px 2px rgba(0, 0, 0, 0.35)',
            marginTop: i === 0 ? 0 : 1,
          }}
        />
      ))}
    </div>
  )
}
