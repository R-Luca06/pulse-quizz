export interface TriviaQuestion {
  question: string
  correct_answer: string
  incorrect_answers: string[]
  shuffledAnswers: string[]
  category: string
  difficulty: 'easy' | 'medium' | 'hard'
}

export type AnswerState = 'idle' | 'correct' | 'wrong' | 'timeout'
export type QuizPhase = 'loading' | 'playing' | 'feedback' | 'finished'

export interface QuestionResult {
  question: string
  correctAnswer: string
  userAnswer: string | null  // null = timeout
  isCorrect: boolean
}
