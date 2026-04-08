import { motion } from 'framer-motion'
import { unlockAudio } from '../../utils/sounds'

interface Props {
  onClick: () => void
}

export default function StartButton({ onClick }: Props) {
  function handleClick() {
    unlockAudio()
    onClick()
  }
  return (
    <div className="relative flex items-center justify-center">
      {/* Outer pulse ring */}
      <motion.div
        className="absolute h-24 w-24 rounded-full border border-neon-violet/30 sm:h-32 sm:w-32 md:h-36 md:w-36"
        animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Inner pulse ring */}
      <motion.div
        className="absolute h-20 w-20 rounded-full border border-neon-blue/40 sm:h-24 sm:w-24 md:h-28 md:w-28"
        animate={{ scale: [1, 1.25, 1], opacity: [0.5, 0, 0.5] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
      />

      {/* Button */}
      <motion.button
        onClick={handleClick}
        className="relative z-10 h-16 w-16 rounded-full bg-gradient-to-br from-neon-violet to-neon-blue font-bold text-base tracking-widest text-white uppercase shadow-neon-violet sm:h-20 sm:w-20 sm:text-lg"
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
