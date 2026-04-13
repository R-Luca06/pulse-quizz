import { motion, useReducedMotion } from 'framer-motion'
import { useAuth } from '../../contexts/AuthContext'

interface Props {
  className?: string
  fontSize?: string
}

export default function AvatarDisplay({ className, fontSize }: Props) {
  const { profile } = useAuth()
  const reduced = useReducedMotion()
  const initial = profile?.username?.[0]?.toUpperCase() ?? '?'

  return (
    <div className={`relative flex items-center justify-center rounded-full ${className ?? ''}`}>
      {/* Halo pulsant */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(139,92,246,0.22) 0%, rgba(139,92,246,0.06) 55%, transparent 75%)',
          transform: 'scale(1.4)',
        }}
        animate={reduced ? undefined : { opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Cercle principal */}
      <div
        className="relative z-10 flex h-full w-full items-center justify-center rounded-full"
        style={{
          background:
            'linear-gradient(135deg, rgba(139,92,246,0.3) 0%, rgba(59,130,246,0.18) 100%)',
          border: '2px solid rgba(139,92,246,0.5)',
          boxShadow:
            '0 0 40px rgba(139,92,246,0.3), 0 0 80px rgba(139,92,246,0.1), inset 0 1px 0 rgba(255,255,255,0.1)',
        }}
      >
        {/* Reflet interne */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-full"
          style={{
            background:
              'linear-gradient(160deg, rgba(255,255,255,0.12) 0%, transparent 50%)',
          }}
        />
        <span
          className="relative z-10 select-none font-black text-white/90"
          style={{ fontSize: fontSize ?? '52%', lineHeight: 1 }}
        >
          {initial}
        </span>
      </div>
    </div>
  )
}
