import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useQuiz } from './useQuiz'

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('../services/api', () => {
  const q = {
    question: 'Quelle est la capitale de la France ?',
    correct_answer: 'Paris',
    incorrect_answers: ['Lyon', 'Marseille', 'Nice'],
    shuffledAnswers: ['Paris', 'Lyon', 'Marseille', 'Nice'],
    category: 'Géographie',
    difficulty: 'easy',
  }
  return {
    fetchQuestions: vi.fn().mockResolvedValue([q, q, q]),
    fetchCompetitifBatch: vi.fn().mockResolvedValue([q, q, q]),
    ApiError: class ApiError extends Error {
      code: string
      constructor(code: string, message?: string) {
        super(message ?? code)
        this.name = 'ApiError'
        this.code = code
      }
    },
  }
})


vi.mock('../utils/sounds', () => ({
  playCorrect: vi.fn(),
  playWrong: vi.fn(),
  playTimeout: vi.fn(),
  playTick: vi.fn(),
}))

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('useQuiz', () => {
  let onFinished: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.useFakeTimers()
    onFinished = vi.fn()
  })

  afterEach(() => {
    vi.runAllTimers()
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('état initial — phase "loading"', () => {
    const { result } = renderHook(() =>
      useQuiz(onFinished, { gameMode: 'normal', difficulty: 'easy', language: 'fr', category: 'all' }),
    )
    expect(result.current.phase).toBe('loading')
    expect(result.current.score).toBe(0)
    expect(result.current.currentIndex).toBe(0)
  })

  it('réponse correcte → score incrémenté, answerState = "correct"', async () => {
    const { result } = renderHook(() =>
      useQuiz(onFinished, { gameMode: 'normal', difficulty: 'easy', language: 'fr', category: 'all' }),
    )

    // Attendre que les questions se chargent
    await act(async () => {
      await vi.runAllTimersAsync()
    })

    expect(result.current.phase).toBe('playing')
    expect(result.current.currentQuestion).not.toBeNull()

    act(() => {
      result.current.handleAnswer('Paris')
    })

    expect(result.current.answerState).toBe('correct')
    expect(result.current.score).toBe(1)
  })

  it('réponse incorrecte en mode compétitif → phase "finished" après feedback', async () => {
    const { result } = renderHook(() =>
      useQuiz(onFinished, { gameMode: 'compétitif', difficulty: 'mixed', language: 'fr', category: 'all' }),
    )

    await act(async () => {
      await vi.runAllTimersAsync()
    })

    expect(result.current.phase).toBe('playing')

    act(() => {
      result.current.handleAnswer('Lyon') // réponse incorrecte
    })

    expect(result.current.answerState).toBe('wrong')

    // Avancer les timers pour la durée du feedback
    act(() => {
      vi.runAllTimers()
    })

    expect(result.current.phase).toBe('finished')
    expect(onFinished).toHaveBeenCalled()
  })

  it('timeout → answerState = "timeout"', async () => {
    const { result } = renderHook(() =>
      useQuiz(onFinished, { gameMode: 'normal', difficulty: 'easy', language: 'fr', category: 'all' }),
    )

    await act(async () => {
      await vi.runAllTimersAsync()
    })

    expect(result.current.phase).toBe('playing')

    act(() => {
      result.current.handleTimeout()
    })

    expect(result.current.answerState).toBe('timeout')
  })
})
