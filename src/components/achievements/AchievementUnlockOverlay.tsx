import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useAnimate } from 'framer-motion'
import type { AchievementId, AchievementWithStatus } from '../../types/quiz'
import { BADGE_FILL, TIER_STROKE, TIER_GLOW_COLOR, BADGE_TIER } from '../../constants/achievementColors'

type OverlayPhase = 'idle' | 'entering' | 'holding' | 'exiting'

interface Props {
  achievements: AchievementWithStatus[]
  onDone: () => void
  onNavigateToAchievements: (id: AchievementId) => void
  pendingBadgeRect?: DOMRect | null
}

export default function AchievementUnlockOverlay({ achievements, onDone, onNavigateToAchievements, pendingBadgeRect }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [phase, setPhase] = useState<OverlayPhase>('idle')
  const [showText, setShowText] = useState(false)
  const [badgeRef, animateBadge] = useAnimate()

  const onNavigateRef = useRef(onNavigateToAchievements)
  const onDoneRef = useRef(onDone)
  const pendingBadgeRectRef = useRef<DOMRect | null>(null)
  onNavigateRef.current = onNavigateToAchievements
  onDoneRef.current = onDone
  pendingBadgeRectRef.current = pendingBadgeRect ?? null

  // Bloquer le scroll pendant l'overlay
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const current = achievements[currentIndex]
  const tier   = current ? BADGE_TIER[current.id]    : 'common'
  const glow   = current ? TIER_GLOW_COLOR[tier]    : '#ffffff'
  const stroke = current ? TIER_STROKE[tier]         : 'rgba(255,255,255,0.30)'

  useEffect(() => {
    if (!current) return
    const fromLeft = Math.random() > 0.5
    const startX = fromLeft ? '-160vw' : '160vw'
    let cancelled = false

    async function run() {
      if (!badgeRef.current) return

      // ── Réinitialisation instantanée hors-écran ──────────────────────────────
      await animateBadge(badgeRef.current,
        { x: startX, y: 0, scale: 0.08, opacity: 0, rotate: fromLeft ? 35 : -35, filter: 'blur(20px)' },
        { duration: 0 }
      )
      setPhase('entering')
      setShowText(false)

      // ── Phase 1 : Entrée (1.55s) ──────────────────────────────────────────────
      await animateBadge(badgeRef.current,
        { x: '0vw', scale: 1.9, opacity: 1, rotate: 0, filter: 'blur(0px)' },
        { duration: 1.55, ease: [0.06, 0, 0.18, 1] }
      )
      if (cancelled) return

      // Rebond spring DOUX : 1.9 → 1.3
      await animateBadge(badgeRef.current,
        { scale: 1.3 },
        { type: 'spring', stiffness: 160, damping: 22 }
      )
      if (cancelled) return

      // ── Phase 2 : Hold + texte (2.5s) ────────────────────────────────────────
      setPhase('holding')
      setShowText(true)
      await new Promise<void>(r => setTimeout(r, 2500))
      if (cancelled) return

      setShowText(false)
      await new Promise<void>(r => setTimeout(r, 500))
      if (cancelled) return

      // ── Phase 3 : Transition vers la page achievements ────────────────────────
      onNavigateRef.current(current.id)
      setPhase('exiting') // backdrop se dissout (transition CSS 0.9s)

      // Poll jusqu'à ce que la card signale sa position (max 2000ms)
      // Délai plus long pour couvrir le chargement Supabase + timer animation de la card (650ms)
      await new Promise<void>(resolve => {
        let elapsed = 0
        const poll = setInterval(() => {
          elapsed += 50
          if (pendingBadgeRectRef.current || elapsed >= 2000) {
            clearInterval(poll)
            resolve()
          }
        }, 50)
      })
      if (cancelled) return

      const targetRect = pendingBadgeRectRef.current
      if (targetRect && badgeRef.current) {
        // Centre naturel du badge : dérivé du CSS du container
        // (absolute inset-0, flex items-center justify-center, paddingBottom: 220px)
        // → centre X = viewport_w / 2
        // → centre Y = (viewport_h - 220) / 2
        const naturalCx = window.innerWidth / 2
        const naturalCy = (window.innerHeight - 220) / 2

        const dx = (targetRect.left + targetRect.width / 2) - naturalCx
        const dy = (targetRect.top + targetRect.height / 2) - naturalCy
        // 160 = largeur naturelle de l'élément badge (avant tout scale Framer Motion)
        const targetScale = targetRect.width / 160

        await animateBadge(badgeRef.current,
          { x: dx, y: dy, scale: targetScale },
          { duration: 0.75, ease: [0.2, 0, 0.55, 1] }
        )
        if (cancelled) return

        // Shake synchronisé avec la card (même pattern que pendingPhase === 'inserted')
        await animateBadge(badgeRef.current,
          { x: [dx, dx - 7, dx + 7, dx - 5, dx + 5, dx - 3, dx + 3, dx], scale: [targetScale * 1.08, targetScale] },
          { duration: 0.55 }
        )
      } else {
        // Fallback : réduction sur place si le rect n'est pas disponible
        await animateBadge(badgeRef.current,
          { scale: 0.33 },
          { duration: 0.6 }
        )
      }
      if (cancelled) return

      // Pause : laisser voir la page achievements avec la card animée
      await new Promise<void>(r => setTimeout(r, 1500))
      if (cancelled) return

      if (currentIndex < achievements.length - 1) {
        setCurrentIndex(i => i + 1)
        setPhase('idle')
      } else {
        onDoneRef.current()
      }
    }

    run()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex])

  if (!current) return null

  // Backdrop : opaque pendant l'animation, se dissout en phase exiting
  const bgAlpha = phase === 'exiting' ? 0 : 0.92

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{
        opacity: 1,
        backgroundColor: `rgba(0,0,0,${bgAlpha})`,
      }}
      exit={{ opacity: 0, transition: { duration: 0.35 } }}
      transition={{ backgroundColor: { duration: 0.9 } }}
      className="fixed inset-0 z-50 overflow-hidden"
    >
      {/* ── Bouton skip ── */}
      <button
        onClick={() => onDoneRef.current()}
        className="absolute top-4 right-4 z-10 flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white/60 transition-colors hover:bg-white/20 hover:text-white"
      >
        Passer
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
      </button>

      {/* ── Trail : glow horizontal contractant pendant l'entrée ── */}
      <AnimatePresence>
        {phase === 'entering' && (
          <motion.div
            key="trail"
            initial={{ opacity: 0, scaleX: 8, scaleY: 0.3 }}
            animate={{ opacity: [0, 0.9, 0], scaleX: [8, 1.5, 0.2], scaleY: [0.3, 1.1, 0.8] }}
            transition={{ duration: 1.55, ease: 'easeOut' }}
            className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              width: '180px',
              height: '180px',
              background: `radial-gradient(circle, ${glow}90 0%, ${glow}30 45%, transparent 70%)`,
              filter: 'blur(30px)',
            }}
          />
        )}
      </AnimatePresence>

      {/* ── Badge hexagonal ── */}
      {/*
        paddingBottom décale le point de centrage vertical vers le haut :
        flex items-center dans un container vh + pb=220px → centre visuel à (vh-220)/2 + 0 = 50% - 110px
        Badge de 180px → bottom à 50% - 110px + 90px = 50% - 20px (légèrement au-dessus du centre)
        À scale 1.3 → bottom à 50% - 110px + 117px = 50% + 7px → texte à 50% + 80px = ~73px d'espace
      */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ paddingBottom: '220px' }}
      >
        <motion.div ref={badgeRef}>
          <div style={{ position: 'relative', width: 160, height: 180 }}>
            {/* Glow radial — div dédiée pour éviter le rectangle de drop-shadow */}
            <div
              style={{
                position: 'absolute',
                inset: -30,
                borderRadius: '50%',
                background: `radial-gradient(ellipse, ${glow}55 0%, ${glow}22 42%, transparent 70%)`,
                filter: 'blur(28px)',
                pointerEvents: 'none',
              }}
            />
            <svg viewBox="0 0 64 72" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} fill="none">
              <defs>
                <linearGradient id={`ov-grad-${current.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.28)" />
                  <stop offset="100%" stopColor="rgba(0,0,0,0.18)" />
                </linearGradient>
              </defs>
              <path
                d="M32 2 L62 20 L62 52 L32 70 L2 52 L2 20 Z"
                fill={BADGE_FILL}
                stroke={stroke}
                strokeWidth="2"
              />
              <path
                d="M32 2 L62 20 L62 52 L32 70 L2 52 L2 20 Z"
                fill={`url(#ov-grad-${current.id})`}
              />
            </svg>
            <span
              style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3.75rem' }}
              className="select-none"
            >
              {current.icon}
            </span>
          </div>
        </motion.div>
      </div>

      {/* ── Texte : positionné sous le badge, indépendamment ── */}
      {/*
        Badge bottom à scale 1.3 ≈ 50% + 7px
        Texte à 50% + 80px → gap ≈ 73px, bien visible
      */}
      <div
        className="absolute left-0 right-0 flex justify-center"
        style={{ top: 'calc(50% + 80px)' }}
      >
        <AnimatePresence>
          {showText && (
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] } }}
              exit={{ opacity: 0, y: -10, transition: { duration: 0.4, ease: 'easeIn' } }}
              className="flex flex-col items-center gap-2.5 px-8 text-center"
            >
              <div
                className="rounded-full px-5 py-1.5 text-xs font-bold uppercase tracking-[0.18em]"
                style={{ backgroundColor: `${glow}28`, color: glow }}
              >
                ✦ Achievement débloqué ✦
              </div>
              <p className="text-2xl font-black text-white">{current.name}</p>
              <p className="max-w-[280px] text-sm leading-relaxed text-white/55">{current.description}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
