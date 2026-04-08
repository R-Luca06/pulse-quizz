import { motion } from 'framer-motion'
import type { AnswerState } from '../../types/quiz'

interface Props {
  label: string
  letter: string
  answerState: AnswerState
  isSelected: boolean
  isCorrect: boolean
  disabled: boolean
  onClick: () => void
}

const SHAKE = {
  x: [0, -10, 10, -10, 10, -6, 6, 0],
  transition: { duration: 0.4, ease: 'easeInOut' },
}

const POP = {
  scale: [1, 1.05, 0.98, 1],
  transition: { duration: 0.3, ease: 'easeOut' },
}

export default function AnswerButton({
  label,
  letter,
  answerState,
  isSelected,
  isCorrect,
  disabled,
  onClick,
}: Props) {
  const isIdle = answerState === 'idle'

  // Determine visual state
  const showCorrect = isCorrect && !isIdle
  const showWrong = isSelected && answerState === 'wrong'

  const animate =
    showWrong ? SHAKE
    : showCorrect && isSelected ? POP
    : {}

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      animate={animate}
      whileHover={isIdle ? { scale: 1.02 } : {}}
      whileTap={isIdle ? { scale: 0.97 } : {}}
      className={[
        'relative w-full rounded-2xl border p-3 text-left transition-colors duration-200 sm:p-4',
        'flex items-center gap-3 font-medium',
        // idle
        isIdle &&
          'border-game-border bg-game-card text-white hover:border-neon-violet/60 hover:bg-neon-violet/10 hover:shadow-[0_0_18px_rgba(139,92,246,0.25)]',
        // correct highlight (the right answer, always shown after feedback)
        showCorrect &&
          'border-game-success bg-game-success/15 text-game-success shadow-neon-green',
        // wrong selected
        showWrong && 'border-game-danger bg-game-danger/15 text-game-danger',
        // other unselected buttons after feedback
        !isIdle && !showCorrect && !showWrong && 'border-game-border bg-game-card text-white/30',
        // disabled cursor
        disabled && 'cursor-default',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* Letter badge */}
      <span
        className={[
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold',
          isIdle && 'bg-white/10 text-white/60',
          showCorrect && 'bg-game-success/30 text-game-success',
          showWrong && 'bg-game-danger/30 text-game-danger',
          !isIdle && !showCorrect && !showWrong && 'bg-white/5 text-white/20',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {letter}
      </span>
      <span className="leading-snug">{label}</span>
    </motion.button>
  )
}
