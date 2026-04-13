import { useCallback, useState } from 'react'
import type { ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import GuestHeader from './GuestHeader'
import FinalCtaSection from './sections/FinalCtaSection'
import ConstellationBackground from './ConstellationBackground'
import ReturningAnonymousBanner from './ReturningAnonymousBanner'
import { unlockAudio } from '../../utils/sounds'
import { isReturningAnonymous } from '../../utils/statsStorage'

const TRANSITION_DISMISSED_KEY = 'pulse_transition_dismissed'

function readInitialBannerVisibility(): boolean {
  if (!isReturningAnonymous()) return false
  try {
    return sessionStorage.getItem(TRANSITION_DISMISSED_KEY) !== 'true'
  } catch {
    return true
  }
}

interface Props {
  onOpenSettings: () => void
  onOpenSignIn: () => void
  onOpenSignUp: () => void
}

export default function GuestLanding({
  onOpenSettings,
  onOpenSignIn,
  onOpenSignUp,
}: Props) {
  const [showBanner, setShowBanner] = useState(readInitialBannerVisibility)

  function handlePlay() {
    unlockAudio()
    onOpenSettings()
  }

  const handleAutoDismiss = useCallback(() => {
    setShowBanner(false)
  }, [])

  const handleManualDismiss = useCallback(() => {
    try {
      sessionStorage.setItem(TRANSITION_DISMISSED_KEY, 'true')
    } catch {
      // silent — dismiss still applies to current render
    }
    setShowBanner(false)
  }, [])

  return (
    <div className="relative z-0 flex min-h-full w-full flex-col">
      <GuestHeader
        onPlay={handlePlay}
        onOpenSignIn={onOpenSignIn}
        onOpenSignUp={onOpenSignUp}
      />
      <AnimatePresence>
        {showBanner && (
          <ReturningAnonymousBanner
            key="returning-anonymous-banner"
            onOpenSignUp={onOpenSignUp}
            onOpenSignIn={onOpenSignIn}
            onAutoDismiss={handleAutoDismiss}
            onManualDismiss={handleManualDismiss}
          />
        )}
      </AnimatePresence>
      <Hero onPlay={handlePlay} onOpenSignIn={onOpenSignIn} onOpenSignUp={onOpenSignUp} />
      <main className="w-full">
        <FeaturesSection />
        <FaqSection />
        <FinalCtaSection onOpenSignIn={onOpenSignIn} onOpenSignUp={onOpenSignUp} />
      </main>
      <Footer />
    </div>
  )
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function Hero({ onPlay, onOpenSignIn, onOpenSignUp }: { onPlay: () => void; onOpenSignIn: () => void; onOpenSignUp: () => void }) {
  return (
    <header
      id="top"
      className="relative flex min-h-[calc(100vh-4rem)] w-full flex-col items-center justify-center overflow-hidden px-6 py-24 text-center"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 30%, rgba(139, 92, 246, 0.18) 0%, rgba(59, 130, 246, 0.08) 40%, transparent 70%)',
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 left-1/2 h-96 w-[42rem] -translate-x-1/2 rounded-full bg-neon-violet/10 blur-3xl"
      />
      <ConstellationBackground />

      {/* Wordmark — h1 */}
      <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative text-5xl font-black leading-none tracking-tight text-white sm:text-6xl md:text-7xl"
      >
        Pulse
        <span className="bg-gradient-to-r from-neon-violet via-neon-blue to-neon-cyan bg-clip-text text-transparent">
          Quizz
        </span>
      </motion.h1>

      {/* Description accrocheuse */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="relative mt-5 max-w-xl text-sm leading-relaxed text-white/55 sm:text-base"
      >
        Enchaîne les quizz, pulvérise tes records, grimpe dans le classement mondial
        et collectionne les achievements qui feront pâlir tes amis.
      </motion.p>

      {/* CTA Play animé + label mode */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.35, type: 'spring', stiffness: 220 }}
        className="relative mt-10 flex flex-col items-center gap-3"
      >
        <motion.button
          onClick={onPlay}
          aria-label="Jouer maintenant en mode invité"
          initial="rest"
          animate="rest"
          whileHover="hover"
          whileTap={{ scale: 0.96 }}
          className="group relative inline-flex items-center overflow-hidden rounded-full bg-gradient-to-r from-neon-violet to-neon-blue px-9 py-3.5 text-sm font-bold uppercase tracking-[0.3em] text-white shadow-[0_12px_35px_-12px_rgba(139,92,246,0.75)] transition-shadow duration-300 hover:shadow-[0_18px_50px_-14px_rgba(59,130,246,0.9)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-violet/60"
        >
          {/* Shine sweep sur hover */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 -left-full w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-[900ms] ease-out group-hover:translate-x-[400%]"
          />
          <span className="relative z-10 flex items-center gap-3">
            <motion.span
              variants={{ rest: { x: 0 }, hover: { x: -2 } }}
              transition={{ type: 'spring', stiffness: 400, damping: 24 }}
            >
              Jouer
            </motion.span>
            <motion.span
              variants={{ rest: { x: 0, opacity: 0.85 }, hover: { x: 4, opacity: 1 } }}
              transition={{ type: 'spring', stiffness: 400, damping: 24 }}
              className="inline-flex items-center"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </motion.span>
          </span>
        </motion.button>
        <p className="text-[10px] uppercase tracking-[0.28em] text-white/35">
          Mode Normal · aucune inscription
        </p>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.55 }}
        className="relative mt-8 text-sm text-white/55"
      >
        Déjà un compte ?{' '}
        <button
          onClick={onOpenSignIn}
          aria-label="Se connecter à Pulse Quizz"
          className="font-semibold text-white underline decoration-neon-violet/40 decoration-2 underline-offset-4 transition-colors hover:text-neon-violet focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-violet/60 rounded"
        >
          Se connecter
        </button>
        <span className="mx-2 text-white/25">·</span>
        <button
          onClick={onOpenSignUp}
          aria-label="S'inscrire à Pulse Quizz"
          className="font-semibold text-white underline decoration-neon-blue/40 decoration-2 underline-offset-4 transition-colors hover:text-neon-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-blue/60 rounded"
        >
          S'inscrire
        </button>{' '}
        <span className="text-white/35">pour le mode compétitif</span>
      </motion.p>
    </header>
  )
}

// ─── Features ─────────────────────────────────────────────────────────────────

function FeaturesSection() {
  return (
    <section className="mx-auto w-full max-w-4xl px-6 py-24">
      <div className="mb-20 text-center">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-neon-violet">
          Fonctionnalités
        </p>
        <h2 className="text-3xl font-bold text-white sm:text-4xl md:text-5xl">
          Tout ce qu'il faut pour s'amuser
        </h2>
      </div>

      <div className="flex flex-col">
        <FeatureRow
          title="Un quiz à ton rythme"
          description="10 questions en français, 3 niveaux de difficulté et 7 catégories. Idéal pour apprendre et progresser à ton rythme — seul, sans pression."
          illustration={<QuizIllustration />}
        />
        <FeatureRow
          title="La compétition à son paroxysme"
          description="Questions infinies, score basé sur la rapidité, une mauvaise réponse et c'est fini. Grimpe au classement mondial et défie les meilleurs joueurs."
          illustration={<CompetitionIllustration />}
          reverse
        />
        <FeatureRow
          title="Progresse, débloque, domine"
          description="Débloque des achievements, suis tes stats détaillées par catégorie et bats tes records personnels. Chaque partie te rapproche du prochain palier."
          illustration={<ProgressIllustration />}
        />
      </div>
    </section>
  )
}

function FeatureRow({
  title,
  description,
  illustration,
  reverse,
}: {
  title: string
  description: string
  illustration: ReactNode
  reverse?: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6 }}
      className="relative flex flex-col items-center gap-10 border-b border-white/5 py-16 last:border-b-0 md:flex-row md:gap-16 md:py-20"
    >
      <div className={`flex-1 text-center md:text-left ${reverse ? 'md:order-2 md:text-right' : ''}`}>
        <h3 className="mb-4 text-2xl font-bold text-white sm:text-3xl">{title}</h3>
        <p className="text-base leading-relaxed text-white/70">{description}</p>
      </div>
      <div className={`flex shrink-0 items-center justify-center ${reverse ? 'md:order-1' : ''}`}>
        {illustration}
      </div>
    </motion.div>
  )
}

// ─── Illustrations Features ───────────────────────────────────────────────────

function QuizIllustration() {
  return (
    <div
      aria-hidden="true"
      className="relative flex h-40 w-40 items-center justify-center rounded-3xl bg-gradient-to-br from-neon-violet/25 to-neon-blue/10"
    >
      <div className="absolute inset-0 rounded-3xl bg-[#0B0820]/60" />
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" className="relative text-neon-violet">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        <path d="M9 7h7" />
        <path d="M9 11h7" />
        <circle cx="17" cy="16" r="3" fill="currentColor" opacity="0.3" />
      </svg>
      <span className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-neon-blue text-[10px] font-black text-white shadow-lg">
        10
      </span>
    </div>
  )
}

function CompetitionIllustration() {
  return (
    <div
      aria-hidden="true"
      className="relative flex h-40 w-40 items-center justify-center rounded-3xl bg-gradient-to-br from-neon-pink/25 to-neon-gold/10"
    >
      <div className="absolute inset-0 rounded-3xl bg-[#0B0820]/60" />
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" className="relative text-neon-gold">
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
        <path d="M4 22h16" />
        <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
        <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
        <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
      </svg>
      <span className="absolute -right-3 -top-2 rounded-full bg-neon-pink px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-lg">
        #1
      </span>
    </div>
  )
}

function ProgressIllustration() {
  return (
    <div
      aria-hidden="true"
      className="relative flex h-40 w-40 items-center justify-center rounded-3xl bg-gradient-to-br from-neon-cyan/25 to-neon-violet/10"
    >
      <div className="absolute inset-0 rounded-3xl bg-[#0B0820]/60" />
      <svg width="72" height="72" viewBox="0 0 24 24" fill="currentColor" className="relative text-neon-cyan">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" opacity="0.9" />
      </svg>
      <span className="absolute -left-2 bottom-2 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-neon-violet to-neon-blue text-xs font-black text-white shadow-lg">
        ✓
      </span>
    </div>
  )
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────

const FAQ_ITEMS: Array<{ q: string; a: string }> = [
  {
    q: "Qu'est-ce que Pulse Quizz ?",
    a: "Pulse Quizz est un jeu de quiz en français, gratuit et accessible depuis ton navigateur. Choisis une catégorie, un niveau, et teste tes connaissances seul ou en mode compétition contre d'autres joueurs.",
  },
  {
    q: "Comment fonctionne le mode compétition ?",
    a: "En mode compétition, les questions s'enchaînent à l'infini tant que tu réponds juste. Le score dépend de ta rapidité : plus tu réponds vite, plus tu marques. Une seule erreur et la partie se termine. Ton meilleur score est enregistré dans le classement mondial.",
  },
  {
    q: "Dois-je créer un compte pour jouer ?",
    a: "Non, tu peux jouer en mode invité immédiatement. Mais créer un compte te permet de sauvegarder tes stats, débloquer des achievements et apparaître dans le classement compétitif.",
  },
  {
    q: "Les questions sont-elles vraiment en français ?",
    a: "Oui, toutes les questions sont rédigées et vérifiées en français. Aucune traduction automatique : c'est pensé et écrit pour un public francophone.",
  },
  {
    q: "Comment sont calculés les scores en compétition ?",
    a: "Chaque bonne réponse rapporte un nombre de points qui dépend du temps mis à répondre, via un système de paliers de rapidité. Plus tu réponds vite, plus le multiplicateur est élevé.",
  },
  {
    q: "Puis-je jouer sur mobile ?",
    a: "L'expérience est optimisée pour desktop, mais tu peux tout à fait jouer sur mobile ou tablette. Certaines animations sont simplifiées sur les écrans plus petits.",
  },
]

function FaqSection() {
  return (
    <section className="mx-auto w-full max-w-3xl px-6 py-24">
      <p className="mb-3 text-center text-xs font-semibold uppercase tracking-[0.25em] text-neon-violet">
        Foire aux questions
      </p>
      <h2 className="mb-14 text-center text-3xl font-bold text-white sm:text-4xl md:text-5xl">
        Questions fréquentes
      </h2>

      <div className="flex flex-col gap-3">
        {FAQ_ITEMS.map((item, i) => (
          <FaqItem key={i} question={item.q} answer={item.a} />
        ))}
      </div>
    </section>
  )
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition-colors hover:border-white/20">
      <button
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left text-base font-semibold text-white transition-colors hover:bg-white/[0.03]"
      >
        <span>{question}</span>
        <motion.span
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/15 text-xl font-light"
          aria-hidden="true"
        >
          +
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <p className="px-6 pb-6 text-sm leading-relaxed text-white/70">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="w-full border-t border-white/5 px-6 py-10 text-center">
      <p className="text-sm font-black tracking-tight text-white">
        Pulse<span className="text-neon-violet">Quizz</span>
      </p>
      <p className="mt-2 text-xs text-white/40">
        Quiz compétitif en français · Rejoins la communauté
      </p>
    </footer>
  )
}
