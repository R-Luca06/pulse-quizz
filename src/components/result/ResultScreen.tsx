import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import type { QuestionResult } from '../../types/quiz'

interface Props {
  score: number
  results: QuestionResult[]
  onReplay: () => void
}

const TIERS = [
  { min: 10, label: 'Parfait !',         color: '#EAB308' },
  { min: 7,  label: 'Impressionnant !',  color: '#8B5CF6' },
  { min: 4,  label: 'Pas mal !',         color: '#3B82F6' },
  { min: 0,  label: 'Retente ta chance', color: '#6B7280' },
]

function getTier(score: number) {
  return TIERS.find((t) => score >= t.min)!
}

const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }

export default function ResultScreen({ score, results, onReplay }: Props) {
  const [displayed, setDisplayed] = useState(0)
  const tier = getTier(score)

  useEffect(() => {
    if (score === 0) return
    let current = 0
    const step = Math.ceil(score / 12)
    const id = setInterval(() => {
      current = Math.min(current + step, score)
      setDisplayed(current)
      if (current >= score) clearInterval(id)
    }, 70)
    return () => clearInterval(id)
  }, [score])

  return (
    <div className="relative flex min-h-screen flex-col items-center overflow-y-auto bg-game-bg px-4 py-6 sm:py-10">
      {/* Background blob */}
      <div className="pointer-events-none fixed inset-0">
        <div
          className="absolute left-1/2 top-1/3 h-[250px] w-[250px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl sm:h-[400px] sm:w-[400px] md:h-[500px] md:w-[500px]"
          style={{ background: `${tier.color}15` }}
        />
      </div>

      <motion.div
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1, delayChildren: 0.15 } } }}
        initial="hidden"
        animate="show"
        className="relative z-10 flex w-full max-w-lg flex-col items-center gap-6"
      >
        {/* Score */}
        <motion.div variants={fadeUp} className="flex items-end gap-2 text-center">
          <span className="text-5xl font-black leading-none tabular-nums sm:text-7xl md:text-8xl" style={{ color: tier.color }}>
            {displayed}
          </span>
          <span className="mb-2 text-2xl font-black text-white/20 sm:text-3xl md:text-4xl">/10</span>
        </motion.div>

        {/* Score dots */}
        <motion.div variants={fadeUp} className="flex gap-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <motion.div
              key={i}
              className="h-2 w-5 rounded-full"
              initial={{ scaleX: 0, backgroundColor: '#1E1E2E' }}
              animate={{ scaleX: 1, backgroundColor: i < score ? tier.color : '#1E1E2E' }}
              transition={{ delay: 0.35 + i * 0.06, duration: 0.22 }}
              style={{ originX: 0 }}
            />
          ))}
        </motion.div>

        {/* Performance label */}
        <motion.div variants={fadeUp} className="flex flex-col items-center gap-1 text-center">
          <p className="text-xl font-bold text-white sm:text-2xl">{tier.label}</p>
          <p className="text-sm text-white/30">
            {score === 10
              ? 'Tu as répondu juste à toutes les questions !'
              : score === 0
              ? 'Toutes les questions ont eu raison de toi.'
              : `${score} bonne${score > 1 ? 's' : ''} réponse${score > 1 ? 's' : ''} sur 10`}
          </p>
        </motion.div>

        {/* Replay button */}
        <motion.div variants={fadeUp} className="pb-4">
          <motion.button
            onClick={onReplay}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.96 }}
            className="rounded-full bg-gradient-to-r from-neon-violet to-neon-blue px-10 py-4 text-base font-bold tracking-wide text-white shadow-neon-violet"
          >
            Rejouer
          </motion.button>
        </motion.div>

        {/* Recap */}
        {results.length > 0 && (
          <motion.div variants={fadeUp} className="w-full pb-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-white/30">
              Récapitulatif
            </p>
            <div className="flex flex-col gap-2">
              {results.map((r, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + i * 0.07, duration: 0.3 }}
                  className={[
                    'rounded-xl border p-3',
                    r.isCorrect
                      ? 'border-game-success/20 bg-game-success/5'
                      : 'border-game-danger/20 bg-game-danger/5',
                  ].join(' ')}
                >
                  <div className="flex items-start gap-2.5">
                    {/* Indicator */}
                    <span className={`mt-0.5 text-sm font-bold ${r.isCorrect ? 'text-game-success' : 'text-game-danger'}`}>
                      {r.isCorrect ? '✓' : '✗'}
                    </span>

                    <div className="min-w-0 flex-1">
                      {/* Question */}
                      <p className="line-clamp-2 text-xs leading-snug text-white/50">{r.question}</p>

                      {/* User answer */}
                      <p className={`mt-1 text-sm font-medium ${r.isCorrect ? 'text-game-success' : 'text-game-danger'}`}>
                        {r.userAnswer ?? <span className="italic opacity-60">Pas de réponse (timeout)</span>}
                      </p>

                      {/* Correct answer if wrong */}
                      {!r.isCorrect && (
                        <p className="mt-0.5 text-xs text-game-success/70">
                          → {r.correctAnswer}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
