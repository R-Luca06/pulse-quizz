import { useState, useEffect, useCallback, useRef } from 'react'
import { fetchQuestions, fetchCompetitifBatch, fetchDailyQuestions, ApiError } from '../services/api'
import { getTodayDate } from '../services/dailyChallenge'
import { playCorrect, playWrong, playTimeout } from '../utils/sounds'
import {
  FEEDBACK_DURATION,
  NORMAL_MODE_QUESTIONS,
  DAILY_MODE_QUESTIONS,
  COMP_BASE_POINTS,
  COMP_PREFETCH_THRESHOLD,
  COMP_SPEED_TIERS,
  getSpeedTier,
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
  settings: QuizSettings = { gameMode: 'normal', difficulty: 'mixed', language: 'fr', category: 'all' },
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
  const [totalAnswered, setTotalAnswered] = useState(0)
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const multiplierTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  const resultsRef = useRef<QuestionResult[]>([])
  const questionStartTime = useRef<number>(0)
  const isPrefetching = useRef(false)
  const loadAbortRef = useRef<AbortController | null>(null)
  const settingsRef = useRef(settings)
  const loadQuestionsRef = useRef<() => void>(() => {})

  const loadQuestions = useCallback(async () => {
    // Cancel any previous in-flight request (prevents double-fetch from StrictMode remount)
    loadAbortRef.current?.abort()
    const controller = new AbortController()
    loadAbortRef.current = controller

    setPhase('loading')
    resultsRef.current = []
    setTotalAnswered(0)
    try {
      const s = settingsRef.current
      const qs = s.gameMode === 'compétitif'
        ? await fetchCompetitifBatch(s.language, controller.signal)
        : s.gameMode === 'daily'
        ? await fetchDailyQuestions(getTodayDate(), controller.signal)
        : await fetchQuestions({
            difficulty: s.difficulty,
            language: s.language,
            category: s.category,
            limit: NORMAL_MODE_QUESTIONS,
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
        setTimeout(() => { setIsRetrying(false); loadQuestionsRef.current() }, 5000)
      } else {
        setPhase('error')
      }
    }
  }, [])

  useEffect(() => { settingsRef.current = settings }, [settings])
  useEffect(() => { loadQuestionsRef.current = loadQuestions }, [loadQuestions])

  useEffect(() => {
    queueMicrotask(() => loadQuestions())
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
      if (settingsRef.current.gameMode === 'compétitif' || settingsRef.current.gameMode === 'daily') {
        queueMicrotask(() => setCurrentMultiplier(COMP_SPEED_TIERS[0].multiplier))
        if (multiplierTimer.current) clearInterval(multiplierTimer.current)
        multiplierTimer.current = setInterval(() => {
          const elapsed = (Date.now() - questionStartTime.current) / 1000
          setCurrentMultiplier(getSpeedTier(elapsed).multiplier)
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
      const isNormalDone  = settings.gameMode === 'normal' && nextIndex >= NORMAL_MODE_QUESTIONS
      const isDailyDone   = settings.gameMode === 'daily'  && nextIndex >= DAILY_MODE_QUESTIONS
      if (isNormalDone || isDailyDone) {
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

  const scheduleNext = useCallback(
    (newScore: number, gameOver = false) => {
      if (gameOver) {
        feedbackTimer.current = setTimeout(() => {
          setPhase('finished')
          onFinished(newScore, resultsRef.current)
        }, FEEDBACK_DURATION)
      } else {
        const snap = questions
        feedbackTimer.current = setTimeout(
          () => advance(currentIndex + 1, newScore, snap),
          FEEDBACK_DURATION,
        )
      }
    },
    [questions, currentIndex, advance, onFinished],
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

      if (isCorrect && (settings.gameMode === 'compétitif' || settings.gameMode === 'daily')) {
        multiplier = getSpeedTier(timeSpent).multiplier
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
        anecdote: questions[currentIndex].anecdote ?? null,
      })
      setTotalAnswered(prev => prev + 1)

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

      scheduleNext(newScore, !isCorrect && settings.gameMode === 'compétitif')
    },
    [answerState, questions, currentIndex, score, scheduleNext, settings.gameMode],
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
      anecdote: questions[currentIndex].anecdote ?? null,
    })
    setTotalAnswered(prev => prev + 1)

    setSelectedAnswer(null)
    setAnswerState('timeout')
    setPhase('feedback')
    setStreak(0)
    playTimeout()

    scheduleNext(score, settings.gameMode === 'compétitif')
  }, [answerState, questions, currentIndex, score, scheduleNext, settings.gameMode])

  return {
    phase,
    isRetrying,
    currentQuestion: questions[currentIndex] ?? null,
    currentIndex,
    score,
    streak,
    selectedAnswer,
    answerState,
    totalAnswered,
    currentMultiplier,
    handleAnswer,
    handleTimeout,
    retry: loadQuestions,
  }
}
