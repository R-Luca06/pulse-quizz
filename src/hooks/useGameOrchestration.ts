import type { User } from '@supabase/supabase-js'
import type { AppScreen } from '../App'
import type { GameSettings } from './useSettings'
import type { QuestionResult, GameResult, RankingData, AchievementWithStatus } from '../types/quiz'

type OnNewAchievements = (achievements: AchievementWithStatus[]) => void
import { getCloudBestScore } from '../services/cloudStats'
import { incrementCategoryStats, incrementGlobalStats } from '../services/cloudStats'
import { submitScore, getUserBestScore, getUserRank } from '../services/leaderboard'
import { checkAndUnlockAchievements } from '../services/achievements'
import { markPlayedAnonymous, computeBestStreak } from '../utils/statsStorage'
import { createNotification, getNotificationPrefs } from '../services/notifications'
import type React from 'react'

interface Profile {
  username: string
}

function computeMinAnswerTime(results: QuestionResult[]): number {
  const correct = results.filter(r => r.isCorrect)
  if (correct.length === 0) return Infinity
  return Math.min(...correct.map(r => r.timeSpent))
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
    const maxStreak    = computeBestStreak(results)
    const minAnswerTime = computeMinAnswerTime(results)

    // Transition immédiate — aucun await avant setScreen pour éviter que le
    // quiz container reste affiché si les requêtes Supabase sont lentes/bloquées.
    // Les données cloud (bestScore, rank) sont chargées en arrière-plan.
    const immediateResult: GameResult = {
      score,
      results,
      bestScore: score,
      isNewBest: false,
      userRank:  null,
      rankDelta: null,
    }
    setGameResult(immediateResult)

    // ── Chemin non-compétitif ou non-connecté ─────────────────────────────────
    if (!user || mode !== 'compétitif' || !profile) {
      setScreen('result')

      if (user && mode === 'normal') {
        const uid = user.id
        // Charge le meilleur score précédent en arrière-plan et met à jour l'UI
        getCloudBestScore(uid, mode, difficulty, category)
          .then(prevBest => {
            setGameResult(prev => ({
              ...prev,
              bestScore: Math.max(prevBest, score),
              isNewBest: score > prevBest,
            }))
          })
          .catch(() => {})

        incrementCategoryStats(uid, mode, difficulty, category, score, results).catch(console.error)
        // Chaîner le check achievements APRÈS l'incrément des stats globales pour éviter
        // la race condition sur games_played (ex: Centenaire lu à 99 au lieu de 100)
        incrementGlobalStats(uid, results, score, mode)
          .then(() => Promise.all([
            checkAndUnlockAchievements(uid, { maxStreak, minAnswerTime, score, mode }),
            getNotificationPrefs(uid),
          ]))
          .then(([newlyUnlocked, prefs]) => {
            if (newlyUnlocked.length > 0) {
              setNewAchievements(newlyUnlocked)
              if (prefs.achievement_unlocked) {
                newlyUnlocked.forEach(a => {
                  createNotification(uid, 'achievement_unlocked', {
                    badge_id: a.id,
                    badge_name: a.name,
                    badge_icon: a.icon,
                  }).catch(console.error)
                })
              }
            }
          })
          .catch(console.error)
      } else if (!user) {
        markPlayedAnonymous()
      }
      return
    }

    // ── Compétitif + connecté ─────────────────────────────────────────────────
    // setScreen('result') en fallback immédiat ; si tout réussit on passe à 'ranking'.
    setScreen('result')

    try {
      const [prevBest, prevRank] = await Promise.all([
        getUserBestScore(user.id, language),
        getUserRank(user.id, language),
      ])

      setGameResult(prev => ({
        ...prev,
        bestScore: Math.max(prevBest, score),
        isNewBest: score > prevBest,
      }))

      await submitScore({
        userId:   user.id,
        username: profile.username,
        score,
        mode,
        difficulty: 'mixed',
        language,
        gameData: results.map(r => ({
          question:     r.question,
          correctAnswer: r.correctAnswer,
          userAnswer:   r.userAnswer,
          isCorrect:    r.isCorrect,
          timeSpent:    r.timeSpent,
          pointsEarned: r.pointsEarned ?? 0,
          multiplier:   r.multiplier ?? 1,
        })),
      })

      const newRank = await getUserRank(user.id, language)
      const delta   = newRank !== null && prevRank !== null ? prevRank - newRank : null

      setGameResult(prev => ({ ...prev, userRank: newRank, rankDelta: delta }))
      setRankingData({
        userRank:  newRank,
        rankDelta: delta,
        userId:    user.id,
        username:  profile.username,
        userScore: score,
      })
      setScreen('ranking')

      // Achievements + notifications en fire-and-forget
      const uid = user.id
      incrementGlobalStats(uid, results, score, mode)
        .then(() => Promise.all([
          checkAndUnlockAchievements(uid, { maxStreak, minAnswerTime, score, mode, userRank: newRank }),
          getNotificationPrefs(uid),
        ]))
        .then(([newlyUnlocked, prefs]) => {
          if (newlyUnlocked.length > 0) {
            setNewAchievements(newlyUnlocked)
            if (prefs.achievement_unlocked) {
              newlyUnlocked.forEach(a => {
                createNotification(uid, 'achievement_unlocked', {
                  badge_id: a.id,
                  badge_name: a.name,
                  badge_icon: a.icon,
                }).catch(console.error)
              })
            }
          }
          if (delta !== null && delta !== 0 && newRank !== null && prefs.rank_change) {
            createNotification(uid, delta > 0 ? 'rank_up' : 'rank_down', {
              new_rank: newRank,
              delta:    Math.abs(delta),
            }).catch(console.error)
          }
        })
        .catch(console.error)
    } catch (err) {
      console.error(err)
      // screen already 'result' — rien à faire
    }
  }

  return { handleFinished }
}
