import { useEffect } from 'react'
import { motion } from 'framer-motion'

const AUTO_DISMISS_MS = 10000

interface ReturningAnonymousBannerProps {
  onOpenSignUp: () => void
  onOpenSignIn: () => void
  onAutoDismiss: () => void
  onManualDismiss: () => void
}

export default function ReturningAnonymousBanner({
  onOpenSignUp,
  onOpenSignIn,
  onAutoDismiss,
  onManualDismiss,
}: ReturningAnonymousBannerProps) {
  useEffect(() => {
    const timer = window.setTimeout(onAutoDismiss, AUTO_DISMISS_MS)
    return () => window.clearTimeout(timer)
  }, [onAutoDismiss])

  return (
    <motion.section
      role="region"
      aria-labelledby="transition-title"
      aria-live="polite"
      initial={{ opacity: 0, y: -12, x: 0 }}
      animate={{ opacity: 1, y: 0, x: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="pointer-events-auto fixed right-4 top-20 z-50 w-[calc(100vw-2rem)] max-w-sm rounded-2xl border border-neon-violet/30 bg-[#0B0820]/90 px-5 py-4 shadow-[0_20px_60px_-20px_rgba(139,92,246,0.7)] backdrop-blur-md sm:right-6 sm:top-24"
    >
      <button
        type="button"
        onClick={onManualDismiss}
        aria-label="Fermer le message d'accueil"
        className="absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full text-white/50 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-violet/60"
      >
        <span aria-hidden="true" className="text-lg leading-none">×</span>
      </button>

      <h2 id="transition-title" className="pr-8 text-base font-bold text-white">
        Tu jouais déjà&nbsp;?
      </h2>
      <p className="mt-1 text-xs leading-relaxed text-white/70">
        Crée un compte pour le mode compétitif, les stats cloud et ton avatar.
      </p>

      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenSignUp}
          className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-neon-violet to-neon-blue px-4 py-2 text-[11px] font-bold uppercase tracking-[0.2em] text-white shadow-[0_8px_24px_-10px_rgba(139,92,246,0.75)] transition-shadow duration-300 hover:shadow-[0_14px_34px_-12px_rgba(59,130,246,0.9)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-violet/60"
        >
          Créer un compte
        </button>
        <button
          type="button"
          onClick={onOpenSignIn}
          className="rounded text-xs font-semibold text-white/70 underline decoration-neon-violet/40 decoration-2 underline-offset-4 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-violet/60"
        >
          Se connecter
        </button>
      </div>

      <motion.div
        aria-hidden="true"
        className="absolute bottom-0 left-0 h-0.5 rounded-b-2xl bg-gradient-to-r from-neon-violet to-neon-blue"
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{ duration: AUTO_DISMISS_MS / 1000, ease: 'linear' }}
      />
    </motion.section>
  )
}
