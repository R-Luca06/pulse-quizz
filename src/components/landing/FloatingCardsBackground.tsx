import { useRef } from 'react'
import { motion } from 'framer-motion'

const SAMPLE_QUESTIONS = [
  { question: 'What is the capital of Japan?', answer: 'Tokyo' },
  { question: 'Who painted the Mona Lisa?', answer: 'Leonardo da Vinci' },
  { question: 'How many planets are in our solar system?', answer: '8' },
  { question: 'What is the chemical symbol for gold?', answer: 'Au' },
  { question: 'In which year did World War II end?', answer: '1945' },
  { question: 'What is the largest ocean on Earth?', answer: 'Pacific Ocean' },
  { question: 'Who wrote "Romeo and Juliet"?', answer: 'Shakespeare' },
  { question: 'What is the speed of light?', answer: '299,792 km/s' },
  { question: 'Which planet is known as the Red Planet?', answer: 'Mars' },
  { question: 'What language has the most native speakers?', answer: 'Mandarin' },
]

interface CardConfig {
  id: number
  question: string
  answer: string
  initialX: number
  initialY: number
  rotation: number
  floatY: number
  floatRotation: number
  duration: number
  delay: number
  scale: number
}

function generateCards(): CardConfig[] {
  const positions = [
    // top-left
    { x: -35, y: -38 },
    // top-center
    { x:  -2, y: -42 },
    // top-right
    { x:  28, y: -38 },
    // left-middle
    { x: -40, y:   5 },
    // right-middle
    { x:  33, y:  -5 },
    // bottom-left
    { x: -38, y:  28 },
    { x: -14, y:  36 },
    // bottom-right (3 cards)
    { x:  18, y:  30 },
    { x:  35, y:  22 },
    { x:  28, y:  38 },
  ]

  return SAMPLE_QUESTIONS.map((q, i) => ({
    id: i,
    question: q.question,
    answer: q.answer,
    initialX: positions[i].x,
    initialY: positions[i].y,
    rotation: (Math.random() - 0.5) * 24,
    floatY: 4 + Math.random() * 7,
    floatRotation: (Math.random() - 0.5) * 4,
    duration: 7 + Math.random() * 5,
    delay: Math.random() * -10,
    scale: 0.75 + Math.random() * 0.3,
  }))
}

interface Props {
  isLaunching: boolean
  cardRefs?: React.RefObject<(HTMLDivElement | null)[]>
}

export default function FloatingCardsBackground({ isLaunching, cardRefs }: Props) {
  const internalRefs = useRef<(HTMLDivElement | null)[]>([])
  const refs = cardRefs ?? internalRefs
  const cards = useRef(generateCards()).current

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {cards.map((card, i) => (
        <motion.div
          key={card.id}
          ref={(el) => { refs.current[i] = el }}
          className="absolute left-1/2 top-1/2"
          style={{ scale: card.scale }}
          initial={{
            x: `calc(${card.initialX}vw - 50%)`,
            y: `calc(${card.initialY}vh - 50%)`,
            rotate: card.rotation,
            opacity: 0,
          }}
          animate={
            isLaunching
              ? { x: '-50%', y: '-50%', rotate: 0, opacity: 1 }
              : {
                  x: [
                    `calc(${card.initialX}vw - 50%)`,
                    `calc(${card.initialX + (Math.random() - 0.5) * 4}vw - 50%)`,
                    `calc(${card.initialX}vw - 50%)`,
                  ],
                  y: [
                    `calc(${card.initialY}vh - 50%)`,
                    `calc(${card.initialY - card.floatY}vh - 50%)`,
                    `calc(${card.initialY}vh - 50%)`,
                  ],
                  rotate: [card.rotation, card.rotation + card.floatRotation, card.rotation],
                  opacity: [0, 0.55, 0.55, 0.55],
                }
          }
          transition={
            isLaunching
              ? { duration: 0.5, ease: [0.32, 0, 0.67, 0] }
              : {
                  duration: card.duration,
                  delay: card.delay,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  opacity: { duration: 1.2, delay: i * 0.1 },
                }
          }
        >
          <div className="w-52 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-4 shadow-lg">
            <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-neon-violet/70">
              Question
            </div>
            <p className="text-sm font-medium leading-snug text-white/80">
              {card.question}
            </p>
            <div className="mt-3 rounded-lg bg-white/5 px-3 py-1.5">
              <p className="text-xs text-neon-blue/80">{card.answer}</p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
