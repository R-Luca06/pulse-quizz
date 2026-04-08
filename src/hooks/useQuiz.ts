import { useState, useEffect, useCallback, useRef } from 'react'
import { fetchQuestions } from '../utils/trivia'
import { playCorrect, playWrong, playTimeout } from '../utils/sounds'
import type { TriviaQuestion, AnswerState, QuizPhase, QuestionResult } from '../types/quiz'

const FEEDBACK_DURATION = 1500

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

  const loadQuestions = useCallback(async () => {
    setPhase('loading')
    resultsRef.current = []
    try {
      const qs = await fetchQuestions()
      setQuestions(qs)
      setCurrentIndex(0)
      setScore(0)
      setStreak(0)
      setSelectedAnswer(null)
      setAnswerState('idle')
      setPhase('playing')
    } catch (err) {
      if (err instanceof Error && err.message === 'rate_limit') {
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

  const advance = useCallback(
    (nextIndex: number, currentScore: number) => {
      if (nextIndex >= 10) {
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

      resultsRef.current.push({
        question: questions[currentIndex].question,
        correctAnswer: correct,
        userAnswer: answer,
        isCorrect,
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

      feedbackTimer.current = setTimeout(() => advance(currentIndex + 1, newScore), FEEDBACK_DURATION)
    },
    [answerState, questions, currentIndex, score, advance],
  )

  const handleTimeout = useCallback(() => {
    if (answerState !== 'idle' || !questions[currentIndex]) return

    resultsRef.current.push({
      question: questions[currentIndex].question,
      correctAnswer: questions[currentIndex].correct_answer,
      userAnswer: null,
      isCorrect: false,
    })

    setSelectedAnswer(null)
    setAnswerState('timeout')
    setPhase('feedback')
    setStreak(0)
    playTimeout()

    feedbackTimer.current = setTimeout(() => advance(currentIndex + 1, score), FEEDBACK_DURATION)
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
