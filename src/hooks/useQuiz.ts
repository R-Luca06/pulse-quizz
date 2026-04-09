import { useState, useEffect, useCallback, useRef } from 'react'
import { fetchQuestions, ApiError } from '../services/api'
import { playCorrect, playWrong, playTimeout } from '../utils/sounds'
import { FEEDBACK_DURATION, NORMAL_MODE_QUESTIONS } from '../constants/game'
import type { TriviaQuestion, AnswerState, QuizPhase, QuestionResult, GameMode, Difficulty, Language, Category } from '../types/quiz'

interface QuizSettings {
  gameMode: GameMode
  difficulty: Difficulty
  language: Language
  category: Category
}

interface UseQuizReturn {
  phase: QuizPhase
  isRetrying: boolean
  currentQuestion: TriviaQuestion | null
  currentIndex: number
  score: number
  streak: number
  selectedAnswer: string | null
  answerState: AnswerState
  handleAnswer: (answer: string) => void
  handleTimeout: () => void
  retry: () => void
}

export function useQuiz(
  onFinished: (score: number, results: QuestionResult[]) => void,
  settings: QuizSettings = { gameMode: 'normal', difficulty: 'mixed', language: 'en', category: 'all' },
): UseQuizReturn {
  const [phase, setPhase] = useState<QuizPhase>('loading')
  const [isRetrying, setIsRetrying] = useState(false)
  const [questions, setQuestions] = useState<TriviaQuestion[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [answerState, setAnswerState] = useState<AnswerState>('idle')
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const resultsRef = useRef<QuestionResult[]>([])
  const questionStartTime = useRef<number>(Date.now())

  const loadQuestions = useCallback(async () => {
    setPhase('loading')
    resultsRef.current = []
    try {
      const qs = await fetchQuestions({
        difficulty: settings.difficulty,
        language: settings.language,
        category: settings.category,
      })
      setQuestions(qs)
      setCurrentIndex(0)
      setScore(0)
      setStreak(0)
      setSelectedAnswer(null)
      setAnswerState('idle')
      questionStartTime.current = Date.now()
      setPhase('playing')
    } catch (err) {
      if (err instanceof ApiError && err.code === 'rate_limit') {
        setIsRetrying(true)
        setTimeout(() => { setIsRetrying(false); loadQuestions() }, 5000)
      } else {
        setPhase('error')
      }
    }
  }, [])

  useEffect(() => {
    loadQuestions()
    return () => { if (feedbackTimer.current) clearTimeout(feedbackTimer.current) }
  }, [loadQuestions])

  // Reset start time whenever a new question begins
  useEffect(() => {
    if (phase === 'playing') {
      questionStartTime.current = Date.now()
    }
  }, [currentIndex, phase])

  const advance = useCallback(
    (nextIndex: number, currentScore: number) => {
      if (nextIndex >= NORMAL_MODE_QUESTIONS) {
        setPhase('finished')
        onFinished(currentScore, resultsRef.current)
      } else {
        setCurrentIndex(nextIndex)
        setSelectedAnswer(null)
        setAnswerState('idle')
        setPhase('playing')
      }
    },
    [onFinished],
  )

  const handleAnswer = useCallback(
    (answer: string) => {
      if (answerState !== 'idle' || !questions[currentIndex]) return
      const correct = questions[currentIndex].correct_answer
      const isCorrect = answer === correct
      const timeSpent = Math.round((Date.now() - questionStartTime.current) / 100) / 10

      resultsRef.current.push({
        question: questions[currentIndex].question,
        correctAnswer: correct,
        userAnswer: answer,
        isCorrect,
        timeSpent,
      })

      setSelectedAnswer(answer)
      setAnswerState(isCorrect ? 'correct' : 'wrong')
      setPhase('feedback')
      if (isCorrect) playCorrect(); else playWrong()

      const newScore = isCorrect ? score + 1 : score
      if (isCorrect) {
        setScore(newScore)
        setStreak((s) => s + 1)
      } else {
        setStreak(0)
      }

      if (!isCorrect && settings.gameMode === 'survie') {
        feedbackTimer.current = setTimeout(() => {
          setPhase('finished')
          onFinished(newScore, resultsRef.current)
        }, FEEDBACK_DURATION)
      } else {
        feedbackTimer.current = setTimeout(() => advance(currentIndex + 1, newScore), FEEDBACK_DURATION)
      }
    },
    [answerState, questions, currentIndex, score, advance],
  )

  const handleTimeout = useCallback(() => {
    if (answerState !== 'idle' || !questions[currentIndex]) return
    const timeSpent = Math.round((Date.now() - questionStartTime.current) / 100) / 10

    resultsRef.current.push({
      question: questions[currentIndex].question,
      correctAnswer: questions[currentIndex].correct_answer,
      userAnswer: null,
      isCorrect: false,
      timeSpent,
    })

    setSelectedAnswer(null)
    setAnswerState('timeout')
    setPhase('feedback')
    setStreak(0)
    playTimeout()

    if (settings.gameMode === 'survie') {
      feedbackTimer.current = setTimeout(() => {
        setPhase('finished')
        onFinished(score, resultsRef.current)
      }, FEEDBACK_DURATION)
    } else {
      feedbackTimer.current = setTimeout(() => advance(currentIndex + 1, score), FEEDBACK_DURATION)
    }
  }, [answerState, questions, currentIndex, score, advance])

  return {
    phase,
    isRetrying,
    currentQuestion: questions[currentIndex] ?? null,
    currentIndex,
    score,
    streak,
    selectedAnswer,
    answerState,
    handleAnswer,
    handleTimeout,
    retry: loadQuestions,
  }
}
