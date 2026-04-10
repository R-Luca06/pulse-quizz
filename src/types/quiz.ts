export interface TriviaQuestion {
  question: string
  correct_answer: string
  incorrect_answers: string[]
  shuffledAnswers: string[]
  category: string
  difficulty: 'easy' | 'medium' | 'hard'
}

export type AnswerState = 'idle' | 'correct' | 'wrong' | 'timeout'
export type QuizPhase = 'loading' | 'playing' | 'feedback' | 'finished' | 'error'
export type GameMode   = 'normal' | 'compétitif'
export type Difficulty = 'mixed' | 'easy' | 'medium' | 'hard'
export type Language   = 'en' | 'fr'
export type Category   = number | 'all'

export interface QuestionResult {
  question: string
  correctAnswer: string
  userAnswer: string | null  // null = timeout
  isCorrect: boolean
  timeSpent: number          // secondes, arrondi à 1 décimale
  pointsEarned?: number      // mode compétitif uniquement
  multiplier?: number        // mode compétitif uniquement (ex: 3, 2, 1.5, 1.2, 1)
}
