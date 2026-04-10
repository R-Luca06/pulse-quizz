import { useState, useEffect, useCallback, useRef } from 'react'
import { fetchQuestions, fetchCompetitifBatch, ApiError } from '../services/api'
import { playCorrect, playWrong, playTimeout } from '../utils/sounds'
import {
  FEEDBACK_DURATION,
  NORMAL_MODE_QUESTIONS,
  COMP_BASE_POINTS,
  COMP_PREFETCH_THRESHOLD,
  COMP_SPEED_TIERS,
} from '../constants/game'
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
  totalAnswered: number
  currentMultiplier: number
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
  const [currentMultiplier, setCurrentMultiplier] = useState(COMP_SPEED_TIERS[0].multiplier)
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const multiplierTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  const resultsRef = useRef<QuestionResult[]>([])
  const questionStartTime = useRef<number>(Date.now())
  const isPrefetching = useRef(false)
  const loadAbortRef = useRef<AbortController | null>(null)
  // Snapshot des settings à l'init — pour le prefetch compétitif
  const settingsRef = useRef(settings)

  const loadQuestions = useCallback(async () => {
    // Cancel any previous in-flight request (prevents double-fetch from StrictMode remount)
    loadAbortRef.current?.abort()
    const controller = new AbortController()
    loadAbortRef.current = controller

    setPhase('loading')
    resultsRef.current = []
    try {
      const qs = settings.gameMode === 'compétitif'
        ? await fetchCompetitifBatch(settings.language, controller.signal)
        : await fetchQuestions({
            difficulty: settings.difficulty,
            language: settings.language,
            category: settings.category,
          }, controller.signal)
      if (controller.signal.aborted) return
      setQuestions(qs)
      setCurrentIndex(0)
      setScore(0)
      setStreak(0)
      setSelectedAnswer(null)
      setAnswerState('idle')
      questionStartTime.current = Date.now()
      setPhase('playing')
    } catch (err) {
      if (controller.signal.aborted) return
      if (err instanceof ApiError && err.code === 'rate_limit') {
        setIsRetrying(true)
        setTimeout(() => { setIsRetrying(false); loadQuestions() }, 5000)
      } else {
        setPhase('error')
      }
    }
  }, [])

  useEffect(() => {
    settingsRef.current = settings
  })

  useEffect(() => {
    loadQuestions()
    return () => {
      loadAbortRef.current?.abort()
      if (feedbackTimer.current) clearTimeout(feedbackTimer.current)
      if (multiplierTimer.current) clearInterval(multiplierTimer.current)
    }
  }, [loadQuestions])

  // Reset start time + multiplicateur dès qu'une nouvelle question commence
  useEffect(() => {
    if (phase === 'playing') {
      questionStartTime.current = Date.now()
      if (settingsRef.current.gameMode === 'compétitif') {
        setCurrentMultiplier(COMP_SPEED_TIERS[0].multiplier)
        if (multiplierTimer.current) clearInterval(multiplierTimer.current)
        multiplierTimer.current = setInterval(() => {
          const elapsed = (Date.now() - questionStartTime.current) / 1000
          const tier = COMP_SPEED_TIERS.find(t => elapsed <= t.maxTime)
          setCurrentMultiplier(tier?.multiplier ?? 1)
        }, 100)
      }
    } else {
      if (multiplierTimer.current) {
        clearInterval(multiplierTimer.current)
        multiplierTimer.current = null
      }
    }
  }, [currentIndex, phase])

  const prefetchIfNeeded = useCallback((questionsArr: TriviaQuestion[], nextIndex: number) => {
    if (settingsRef.current.gameMode !== 'compétitif') return
    const remaining = questionsArr.length - nextIndex
    if (remaining <= COMP_PREFETCH_THRESHOLD && !isPrefetching.current) {
      isPrefetching.current = true
      fetchCompetitifBatch(settingsRef.current.language)
        .then(newBatch => {
          setQuestions(prev => [...prev, ...newBatch])
        })
        .catch(console.error)
        .finally(() => { isPrefetching.current = false })
    }
  }, [])

  const advance = useCallback(
    (nextIndex: number, currentScore: number, questionsArr: TriviaQuestion[]) => {
      if (settings.gameMode === 'normal' && nextIndex >= NORMAL_MODE_QUESTIONS) {
        setPhase('finished')
        onFinished(currentScore, resultsRef.current)
      } else if (settings.gameMode === 'compétitif' && nextIndex >= questionsArr.length) {
        // Précharge en cours — afficher loading brièvement
        setPhase('loading')
        const waitForQuestions = setInterval(() => {
          setQuestions(prev => {
            if (prev.length > nextIndex) {
              clearInterval(waitForQuestions)
              setCurrentIndex(nextIndex)
              setSelectedAnswer(null)
              setAnswerState('idle')
              setPhase('playing')
            }
            return prev
          })
        }, 100)
      } else {
        prefetchIfNeeded(questionsArr, nextIndex)
        setCurrentIndex(nextIndex)
        setSelectedAnswer(null)
        setAnswerState('idle')
        setPhase('playing')
      }
    },
    [onFinished, settings.gameMode, prefetchIfNeeded],
  )

  const handleAnswer = useCallback(
    (answer: string) => {
      if (answerState !== 'idle' || !questions[currentIndex]) return
      const correct = questions[currentIndex].correct_answer
      const isCorrect = answer === correct
      const timeSpent = Math.round((Date.now() - questionStartTime.current) / 100) / 10

      let pointsEarned: number | undefined
      let multiplier: number | undefined
      let newScore = score

      if (isCorrect && settings.gameMode === 'compétitif') {
        const tier = COMP_SPEED_TIERS.find(t => timeSpent <= t.maxTime) ?? COMP_SPEED_TIERS[COMP_SPEED_TIERS.length - 1]
        multiplier = tier.multiplier
        pointsEarned = Math.round(COMP_BASE_POINTS * multiplier)
        newScore = score + pointsEarned
      } else if (isCorrect) {
        newScore = score + 1
      }

      resultsRef.current.push({
        question: questions[currentIndex].question,
        correctAnswer: correct,
        userAnswer: answer,
        isCorrect,
        timeSpent,
        ...(pointsEarned !== undefined && { pointsEarned }),
        ...(multiplier !== undefined && { multiplier }),
      })

      setSelectedAnswer(answer)
      setAnswerState(isCorrect ? 'correct' : 'wrong')
      setPhase('feedback')
      if (isCorrect) playCorrect(); else playWrong()

      if (isCorrect) {
        setScore(newScore)
        setStreak((s) => s + 1)
      } else {
        setStreak(0)
      }

      if (!isCorrect && settings.gameMode === 'compétitif') {
        feedbackTimer.current = setTimeout(() => {
          setPhase('finished')
          onFinished(newScore, resultsRef.current)
        }, FEEDBACK_DURATION)
      } else {
        const snap = questions
        feedbackTimer.current = setTimeout(() => advance(currentIndex + 1, newScore, snap), FEEDBACK_DURATION)
      }
    },
    [answerState, questions, currentIndex, score, advance, settings.gameMode, onFinished],
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

    if (settings.gameMode === 'compétitif') {
      feedbackTimer.current = setTimeout(() => {
        setPhase('finished')
        onFinished(score, resultsRef.current)
      }, FEEDBACK_DURATION)
    } else {
      const snap = questions
      feedbackTimer.current = setTimeout(() => advance(currentIndex + 1, score, snap), FEEDBACK_DURATION)
    }
  }, [answerState, questions, currentIndex, score, advance, settings.gameMode, onFinished])

  return {
    phase,
    isRetrying,
    currentQuestion: questions[currentIndex] ?? null,
    currentIndex,
    score,
    streak,
    selectedAnswer,
    answerState,
    totalAnswered: resultsRef.current.length,
    currentMultiplier,
    handleAnswer,
    handleTimeout,
    retry: loadQuestions,
  }
}
