import { motion } from 'framer-motion'

interface Props {
  onClick: () => void
}

export default function StartButton({ onClick }: Props) {
  return (
    <div className="relative flex items-center justify-center">
      {/* Outer pulse ring */}
      <motion.div
        className="absolute h-36 w-36 rounded-full border border-neon-violet/30"
        animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Inner pulse ring */}
      <motion.div
        className="absolute h-28 w-28 rounded-full border border-neon-blue/40"
        animate={{ scale: [1, 1.25, 1], opacity: [0.5, 0, 0.5] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
      />

      {/* Button */}
      <motion.button
        onClick={onClick}
        className="relative z-10 h-20 w-20 rounded-full bg-gradient-to-br from-neon-violet to-neon-blue font-bold text-lg tracking-widest text-white uppercase shadow-neon-violet"
        whileHover={{
          scale: 1.1,
          boxShadow: '0 0 40px rgba(139, 92, 246, 0.8), 0 0 80px rgba(59, 130, 246, 0.4)',
        }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        Play
      </motion.button>
    </div>
  )
}
