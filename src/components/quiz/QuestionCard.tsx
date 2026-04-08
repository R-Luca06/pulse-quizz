import { motion, AnimatePresence } from 'framer-motion'
import AnswerButton from './AnswerButton'
import type { TriviaQuestion, AnswerState } from '../../types/quiz'

const LETTERS = ['A', 'B', 'C', 'D']

interface CardContentProps {
  question: TriviaQuestion
  answerState: AnswerState
  selectedAnswer: string | null
  onAnswer: (a: string) => void
}

function CardContent({ question, answerState, selectedAnswer, onAnswer }: CardContentProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.98 }}
      transition={{ duration: 0.2, ease: [0.25, 0, 0, 1] }}
      className="w-full"
    >
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
    // overflow-hidden so the entering/exiting cards don't bleed outside the container
    <div>
      <AnimatePresence mode="wait" initial={false}>
        <CardContent
          key={props.currentIndex}
          question={props.question}
          answerState={props.answerState}
          selectedAnswer={props.selectedAnswer}
          onAnswer={props.onAnswer}
        />
      </AnimatePresence>
    </div>
  )
}
