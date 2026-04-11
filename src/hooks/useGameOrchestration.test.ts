import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useGameOrchestration } from './useGameOrchestration'
import type { GameResult, RankingData } from '../types/quiz'

// Mock des services — on ne touche jamais le client Supabase directement
vi.mock('../services/cloudStats', () => ({
  getCloudBestScore: vi.fn().mockResolvedValue(0),
  incrementCategoryStats: vi.fn().mockResolvedValue(undefined),
  incrementGlobalStats: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../services/leaderboard', () => ({
  getUserBestScore: vi.fn().mockResolvedValue(0),
  getUserRank: vi.fn().mockResolvedValue(5),
  submitScore: vi.fn().mockResolvedValue(undefined),
}))

import { getCloudBestScore, incrementCategoryStats, incrementGlobalStats } from '../services/cloudStats'
import { getUserBestScore, getUserRank, submitScore } from '../services/leaderboard'

const mockResults = [
  {
    question: 'Q1?',
    correctAnswer: 'A',
    userAnswer: 'A',
    isCorrect: true,
    timeSpent: 3.2,
    pointsEarned: 200,
    multiplier: 2,
  },
]

function makeParams(overrides: Partial<Parameters<typeof useGameOrchestration>[0]> = {}) {
  const setScreen = vi.fn()
  const setGameResult = vi.fn() as unknown as React.Dispatch<React.SetStateAction<GameResult>>
  const setRankingData = vi.fn() as unknown as React.Dispatch<React.SetStateAction<RankingData | null>>

  return {
    settings: {
      mode: 'normal' as const,
      difficulty: 'easy' as const,
      language: 'fr' as const,
      category: 'all' as const,
    },
    user: null,
    profile: null,
    setScreen,
    setGameResult,
    setRankingData,
    ...overrides,
  }
}

// React namespace utilisé uniquement pour le typage — pas d'import React requis en runtime
// eslint-disable-next-line @typescript-eslint/no-namespace
declare namespace React {
  type Dispatch<A> = (value: A) => void
  type SetStateAction<S> = S | ((prevState: S) => S)
}

describe('useGameOrchestration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('utilisateur non connecté → setScreen("result") appelé directement', async () => {
    const params = makeParams({ user: null })
    const { handleFinished } = useGameOrchestration(params)

    await handleFinished(5, mockResults)

    expect(params.setScreen).toHaveBeenCalledWith('result')
    expect(getCloudBestScore).not.toHaveBeenCalled()
  })

  it('mode normal connecté → stats incrémentées + setScreen("result")', async () => {
    const mockUser = { id: 'user-123' } as Parameters<typeof useGameOrchestration>[0]['user']
    const params = makeParams({
      user: mockUser,
      profile: { username: 'testuser' },
      settings: { mode: 'normal', difficulty: 'easy', language: 'fr', category: 'Culture générale' },
    })

    const { handleFinished } = useGameOrchestration(params)
    await handleFinished(8, mockResults)

    expect(getCloudBestScore).toHaveBeenCalledWith('user-123', 'normal', 'easy', 'Culture générale')
    expect(incrementCategoryStats).toHaveBeenCalled()
    expect(incrementGlobalStats).toHaveBeenCalled()
    expect(params.setScreen).toHaveBeenCalledWith('result')
  })

  it('mode compétitif connecté → submitScore appelé + setScreen("ranking")', async () => {
    const mockUser = { id: 'user-456' } as Parameters<typeof useGameOrchestration>[0]['user']
    const params = makeParams({
      user: mockUser,
      profile: { username: 'champion' },
      settings: { mode: 'compétitif', difficulty: 'mixed', language: 'fr', category: 'all' },
    })

    const { handleFinished } = useGameOrchestration(params)
    await handleFinished(350, mockResults)

    expect(getUserBestScore).toHaveBeenCalledWith('user-456', 'fr')
    expect(submitScore).toHaveBeenCalled()
    expect(getUserRank).toHaveBeenCalledWith('user-456', 'fr')
    expect(params.setScreen).toHaveBeenCalledWith('ranking')
    expect(params.setRankingData).toHaveBeenCalled()
  })

  it('erreur réseau en compétitif → fallback setScreen("result")', async () => {
    vi.mocked(submitScore).mockRejectedValueOnce(new Error('network error'))

    const mockUser = { id: 'user-789' } as Parameters<typeof useGameOrchestration>[0]['user']
    const params = makeParams({
      user: mockUser,
      profile: { username: 'player' },
      settings: { mode: 'compétitif', difficulty: 'mixed', language: 'fr', category: 'all' },
    })

    const { handleFinished } = useGameOrchestration(params)
    await handleFinished(200, mockResults)

    expect(params.setScreen).toHaveBeenCalledWith('result')
    expect(params.setRankingData).not.toHaveBeenCalled()
  })
})
