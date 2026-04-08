type AppScreen = 'landing' | 'launching' | 'quiz' | 'result'

function App() {
  return (
    <div className="min-h-screen bg-game-bg text-white font-game">
      <p className="text-center text-neon-violet pt-10 text-glow-violet text-xl">
        Pulse Quizz — Setup OK ✓
      </p>
    </div>
  )
}

export default App
export type { AppScreen }
