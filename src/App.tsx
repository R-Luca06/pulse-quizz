import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import LandingPage from './components/landing/LandingPage'

export type AppScreen = 'landing' | 'launching' | 'quiz' | 'result'

export default function App() {
  const [screen, setScreen] = useState<AppScreen>('landing')

  function handleStart() {
    setScreen('launching')
    // Phase 3 will handle the full animation sequence and then → 'quiz'
    // For now, transition after 1.5s as placeholder
    setTimeout(() => setScreen('quiz'), 1500)
  }

  return (
    <div className="min-h-screen bg-game-bg font-game">
      <AnimatePresence mode="wait">
        {(screen === 'landing' || screen === 'launching') && (
          <LandingPage key="landing" onStart={handleStart} screen={screen} />
        )}
        {screen === 'quiz' && (
          <div key="quiz" className="flex min-h-screen items-center justify-center text-white">
            <p className="text-neon-violet text-xl">Quiz coming in Phase 4 ⚡</p>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
