import { useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import AnswerButton from './AnswerButton'
import type { TriviaQuestion, AnswerState } from '../../types/quiz'

const LETTERS = ['A', 'B', 'C', 'D']

type Offset = { x: string; y: string }

function randomOffset(): Offset {
  const side = Math.floor(Math.random() * 4)
  switch (side) {
    case 0: return { x: '-130vw', y: '0vh' }
    case 1: return { x: '130vw',  y: '0vh' }
    case 2: return { x: '0vw',    y: '-130vh' }
    default:return { x: '0vw',    y: '130vh' }
  }
}

function differentOffset(from: Offset): Offset {
  let o: Offset
  do { o = randomOffset() } while (o.x === from.x && o.y === from.y)
  return o
}

interface CardContentProps {
  question: TriviaQuestion
  answerState: AnswerState
  selectedAnswer: string | null
  onAnswer: (a: string) => void
}

// Separate inner component so each instance gets its own stable refs
function CardContent({ question, answerState, selectedAnswer, onAnswer }: CardContentProps) {
  const enterFrom = useRef(randomOffset()).current
  const exitTo = useRef(differentOffset(enterFrom)).current
  const entryRotation = useRef((Math.random() - 0.5) * 10).current

  return (
    <motion.div
      initial={{ x: enterFrom.x, y: enterFrom.y, opacity: 0, scale: 0.88, rotate: entryRotation }}
      animate={{ x: 0, y: 0, opacity: 1, scale: 1, rotate: 0 }}
      exit={{ x: exitTo.x, y: exitTo.y, opacity: 0, scale: 0.88 }}
      transition={{ type: 'spring', stiffness: 220, damping: 24 }}
      className="w-full"
    >
      {/* Card */}
      <div className="rounded-3xl border border-game-border bg-game-card p-6 shadow-2xl sm:p-8">
        {/* Category + difficulty */}
        <div className="mb-5 flex items-center gap-2">
          <span className="rounded-full border border-neon-violet/30 bg-neon-violet/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-neon-violet">
            {question.category}
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium capitalize text-white/40">
            {question.difficulty}
          </span>
        </div>

        {/* Question text */}
        <p className="mb-8 text-xl font-bold leading-snug text-white sm:text-2xl">
          {question.question}
        </p>

        {/* Answers grid */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {question.shuffledAnswers.map((answer, i) => (
            <AnswerButton
              key={answer}
              label={answer}
              letter={LETTERS[i]}
              answerState={answerState}
              isSelected={selectedAnswer === answer}
              isCorrect={answer === question.correct_answer}
              disabled={answerState !== 'idle'}
              onClick={() => onAnswer(answer)}
            />
          ))}
        </div>
      </div>
    </motion.div>
  )
}

interface Props {
  question: TriviaQuestion
  currentIndex: number
  answerState: AnswerState
  selectedAnswer: string | null
  onAnswer: (a: string) => void
}

export default function QuestionCard(props: Props) {
  return (
    <AnimatePresence mode="sync">
      <CardContent
        key={props.currentIndex}
        question={props.question}
        answerState={props.answerState}
        selectedAnswer={props.selectedAnswer}
        onAnswer={props.onAnswer}
      />
    </AnimatePresence>
  )
}
