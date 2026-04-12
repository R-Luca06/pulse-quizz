import type { User } from '@supabase/supabase-js'
import type { AppScreen } from '../App'
import type { GameSettings } from './useSettings'
import type { QuestionResult, GameResult, RankingData, AchievementWithStatus } from '../types/quiz'

type OnNewAchievements = (achievements: AchievementWithStatus[]) => void
import { getCloudBestScore } from '../services/cloudStats'
import { incrementCategoryStats, incrementGlobalStats } from '../services/cloudStats'
import { submitScore, getUserBestScore, getUserRank } from '../services/leaderboard'
import { checkAndUnlockAchievements } from '../services/achievements'
import type React from 'react'

interface Profile {
  username: string
}

function computeMaxStreak(results: QuestionResult[]): number {
  let max = 0
  let current = 0
  for (const r of results) {
    if (r.isCorrect) {
      current++
      if (current > max) max = current
    } else {
      current = 0
    }
  }
  return max
}

interface UseGameOrchestrationParams {
  settings: GameSettings
  user: User | null
  profile: Profile | null
  setScreen: (s: AppScreen) => void
  setGameResult: React.Dispatch<React.SetStateAction<GameResult>>
  setRankingData: React.Dispatch<React.SetStateAction<RankingData | null>>
  setNewAchievements: OnNewAchievements
}

export function useGameOrchestration(params: UseGameOrchestrationParams) {
  const { settings, user, profile, setScreen, setGameResult, setRankingData, setNewAchievements } = params

  async function handleFinished(score: number, results: QuestionResult[]): Promise<void> {
    const { mode, difficulty, category, language } = settings
    const maxStreak = computeMaxStreak(results)

    // Fetch previous best from cloud (0 if not logged in or no entry)
    let prevBest = 0
    let prevRank: number | null = null
    if (user) {
      if (mode === 'normal') {
        prevBest = await getCloudBestScore(user.id, mode, difficulty, category)
      } else if (mode === 'compétitif') {
        ;[prevBest, prevRank] = await Promise.all([
          getUserBestScore(user.id, language),
          getUserRank(user.id, language),
        ])
      }
    }

    const isNewBest = score > prevBest
    const baseResult: GameResult = {
      score,
      results,
      bestScore: isNewBest ? score : prevBest,
      isNewBest,
      userRank: null,
      rankDelta: null,
    }
    setGameResult(baseResult)

    // Non-competitive or unauthenticated — fast path
    if (!user || mode !== 'compétitif' || !profile) {
      if (user && mode === 'normal') {
        incrementCategoryStats(user.id, mode, difficulty, category, score, results).catch(console.error)
        // Chaîner le check achievements APRÈS l'incrément des stats globales pour éviter
        // la race condition sur games_played (ex: Centenaire lu à 99 au lieu de 100)
        incrementGlobalStats(user.id, results, score, mode)
          .then(() => checkAndUnlockAchievements(user.id, { maxStreak, score, mode }))
          .then(newlyUnlocked => { if (newlyUnlocked.length > 0) setNewAchievements(newlyUnlocked) })
          .catch(console.error)
      }
      setScreen('result')
      return
    }

    // Competitive + authenticated — await all data then show ranking reveal
    try {
      checkAndUnlockAchievements(user.id, { maxStreak, score, mode })
        .then(newlyUnlocked => { if (newlyUnlocked.length > 0) setNewAchievements(newlyUnlocked) })
        .catch(console.error)

      await submitScore({
        userId: user.id,
        username: profile.username,
        score,
        mode,
        difficulty: 'mixed',
        language,
        gameData: results.map(r => ({
          question: r.question,
          correctAnswer: r.correctAnswer,
          userAnswer: r.userAnswer,
          isCorrect: r.isCorrect,
          timeSpent: r.timeSpent,
          pointsEarned: r.pointsEarned ?? 0,
          multiplier: r.multiplier ?? 1,
        })),
      })
      const newRank = await getUserRank(user.id, language)
      const delta = newRank !== null && prevRank !== null ? prevRank - newRank : null
      setGameResult(prev => ({ ...prev, userRank: newRank, rankDelta: delta }))
      setRankingData({
        userRank: newRank,
        rankDelta: delta,
        userId: user.id,
        username: profile.username,
        userScore: score,
      })
      setScreen('ranking')
    } catch (err) {
      console.error(err)
      setScreen('result')
    }
  }

  return { handleFinished }
}
