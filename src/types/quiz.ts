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
export type Language   = 'fr'
export type Category   = 'all' | string

export interface QuestionResult {
  question: string
  correctAnswer: string
  userAnswer: string | null  // null = timeout
  isCorrect: boolean
  timeSpent: number          // secondes, arrondi à 1 décimale
  pointsEarned?: number      // mode compétitif uniquement
  multiplier?: number        // mode compétitif uniquement (ex: 3, 2, 1.5, 1.2, 1)
}

export interface GameResult {
  score: number
  results: QuestionResult[]
  bestScore: number
  isNewBest: boolean
  userRank: number | null
  rankDelta: number | null
}

export interface RankingData {
  userRank: number | null
  rankDelta: number | null
  userId: string
  username: string
  userScore: number
}

// ─── Achievements ─────────────────────────────────────────────────────────────

export type AchievementId =
  | 'premiers_pas'
  | 'premier_competiteur'
  | 'serie_de_feu'
  | 'perfectionniste'
  | 'centenaire'

export interface Achievement {
  id: AchievementId
  name: string
  description: string
  icon: string  // emoji unicode
  progressTotal: number | null  // null = pas de progression trackable
}

export interface UserAchievement {
  achievement_id: AchievementId
  unlocked_at: string  // ISO timestamp
}

export interface AchievementWithStatus extends Achievement {
  unlocked: boolean
  unlocked_at: string | null
  progress: { current: number; total: number } | null
}
