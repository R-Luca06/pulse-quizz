import { useRef } from 'react'
import { motion } from 'framer-motion'
import type { TargetAndTransition, Transition } from 'framer-motion'
import type { LaunchPhase } from './LandingPage'

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

const POSITIONS = [
  { x: -35, y: -38 }, { x: -2,  y: -42 }, { x:  28, y: -38 },
  { x: -40, y:   5 }, { x:  33, y:  -5 },
  { x: -38, y:  28 }, { x: -14, y:  36 },
  { x:  18, y:  30 }, { x:  35, y:  22 }, { x:  28, y:  38 },
]

interface CardConfig {
  id: number
  question: string
  answer: string
  x: number
  y: number
  rotation: number
  floatY: number
  floatRotation: number
  duration: number
  delay: number
  scale: number
  explosionX: string
  explosionY: string
  explosionRotate: number
}

function generateCards(): CardConfig[] {
  return SAMPLE_QUESTIONS.map((q, i) => {
    const angle = (i / SAMPLE_QUESTIONS.length) * 2 * Math.PI + (Math.random() - 0.5) * 0.5
    const dist = 75 + Math.random() * 40
    return {
      id: i,
      question: q.question,
      answer: q.answer,
      x: POSITIONS[i].x,
      y: POSITIONS[i].y,
      rotation: (Math.random() - 0.5) * 24,
      floatY: 4 + Math.random() * 7,
      floatRotation: (Math.random() - 0.5) * 4,
      duration: 7 + Math.random() * 5,
      delay: Math.random() * -10,
      scale: 0.75 + Math.random() * 0.3,
      // pre-computed starburst explosion offsets
      explosionX: `${Math.cos(angle) * dist}vw`,
      explosionY: `${Math.sin(angle) * dist * 0.65}vh`,
      explosionRotate: (Math.random() - 0.5) * 120,
    }
  })
}

interface Props {
  launchPhase: LaunchPhase
}

export default function FloatingCardsBackground({ launchPhase }: Props) {
  const cards = useRef(generateCards()).current
  const isIdle = launchPhase === 'idle'

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {cards.map((card) => {
        let animateTarget: TargetAndTransition
        let transition: Transition

        if (isIdle) {
          animateTarget = {
            x: [
              `calc(${card.x}vw - 50%)`,
              `calc(${card.x}vw - 50%)`,
              `calc(${card.x}vw - 50%)`,
            ],
            y: [
              `calc(${card.y}vh - 50%)`,
              `calc(${card.y - card.floatY}vh - 50%)`,
              `calc(${card.y}vh - 50%)`,
            ],
            rotate: [card.rotation, card.rotation + card.floatRotation, card.rotation],
            scale: card.scale,
            opacity: [0, 0.55, 0.55, 0.55],
          }
          transition = {
            duration: card.duration,
            delay: card.delay,
            repeat: Infinity,
            ease: 'easeInOut',
            opacity: { duration: 1.2, delay: card.id * 0.1 },
          }
        } else if (launchPhase === 'converging' || launchPhase === 'shaking') {
          animateTarget = {
            x: 'calc(0vw - 50%)',
            y: 'calc(0vh - 50%)',
            rotate: 0,
            scale: 0.9,
            opacity: 1,
          }
          transition = { duration: 0.36, ease: [0.32, 0, 0.67, 0] }
        } else {
          // exploding — starburst outward
          animateTarget = {
            x: `calc(${card.explosionX} - 50%)`,
            y: `calc(${card.explosionY} - 50%)`,
            scale: [0.9, 1.5, 0.3],
            rotate: card.explosionRotate,
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
            key={card.id}
            className="absolute left-1/2 top-1/2"
            initial={{
              x: `calc(${card.x}vw - 50%)`,
              y: `calc(${card.y}vh - 50%)`,
              rotate: card.rotation,
              scale: card.scale,
              opacity: 0,
            }}
            animate={animateTarget}
            transition={transition}
          >
            <div className="w-40 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-3 shadow-lg sm:w-48 sm:p-4 md:w-52">
              <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-neon-violet/70">
                Question
              </div>
              <p className="text-sm font-medium leading-snug text-white/80">{card.question}</p>
              <div className="mt-3 rounded-lg bg-white/5 px-3 py-1.5">
                <p className="text-xs text-neon-blue/80">{card.answer}</p>
              </div>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
