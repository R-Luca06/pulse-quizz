import { motion } from 'framer-motion'

interface Props {
  onOpenSignIn: () => void
  onOpenSignUp: () => void
}

export default function FinalCtaSection({ onOpenSignIn, onOpenSignUp }: Props) {
  return (
    <section className="relative mx-auto w-full max-w-3xl px-6 py-24 text-center">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-10 top-1/2 h-48 -translate-y-1/2 rounded-full bg-neon-violet/10 blur-3xl"
      />
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.5 }}
        className="relative text-3xl font-bold text-white sm:text-4xl md:text-5xl"
      >
        Prêt à vibrer ?
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="relative mx-auto mt-4 max-w-xl text-base text-white/70"
      >
        Crée ton compte en 30 secondes et rejoins le classement mondial.
        Aucune carte bancaire, 100 % en français.
      </motion.p>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="relative mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
      >
        <button
          onClick={onOpenSignUp}
          aria-label="S'inscrire à Pulse Quizz"
          className="min-w-[180px] rounded-xl bg-gradient-to-r from-neon-violet to-neon-blue px-7 py-3.5 text-base font-semibold text-white shadow-[0_10px_40px_-10px_rgba(139,92,246,0.8)] transition-transform hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-violet/60"
        >
          S'inscrire
        </button>
        <button
          onClick={onOpenSignIn}
          aria-label="Se connecter à Pulse Quizz"
          className="min-w-[180px] rounded-xl border border-white/20 bg-white/[0.06] px-7 py-3.5 text-base font-semibold text-white/80 transition-colors hover:border-white/35 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-violet/60"
        >
          Se connecter
        </button>
      </motion.div>
    </section>
  )
}
