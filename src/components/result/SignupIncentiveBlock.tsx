import { motion } from 'framer-motion'

interface SignupIncentiveBlockProps {
  onOpenSignUp: () => void
}

const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }

export default function SignupIncentiveBlock({ onOpenSignUp }: SignupIncentiveBlockProps) {
  return (
    <motion.section
      role="region"
      aria-labelledby="signup-incentive-title"
      variants={fadeUp}
      className="w-full rounded-xl border border-neon-violet/20 bg-neon-violet/5 p-4 text-center"
    >
      <p id="signup-incentive-title" className="text-sm font-semibold text-white/80">
        Crée un compte pour sauvegarder ton score
      </p>
      <p className="mt-1 text-xs text-white/50">
        Accède au mode compétitif, au classement mondial et à tes stats cloud.
      </p>
      <button
        onClick={onOpenSignUp}
        className="mt-3 rounded-lg bg-gradient-to-r from-neon-violet to-neon-blue px-5 py-2 text-xs font-bold text-white shadow-neon-violet transition-transform hover:scale-[1.03]"
      >
        Créer un compte
      </button>
    </motion.section>
  )
}
