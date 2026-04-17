import type { User } from '@supabase/supabase-js'
import type { AppScreen } from '../App'
import type { GameSettings } from './useSettings'
import type { QuestionResult, GameResult, RankingData, AchievementWithStatus, XpBreakdown, AchievementTier, PulsesBreakdown } from '../types/quiz'

type OnNewAchievements = (achievements: AchievementWithStatus[]) => void
import { getCloudBestScore, incrementCategoryStats, incrementGlobalStats, addXp } from '../services/cloudStats'
import { submitScore, getUserBestScore, getUserRank } from '../services/leaderboard'
import { checkAndUnlockAchievements, checkAndUnlockDailyAchievements } from '../services/achievements'
import { submitDailyEntry, getDailyStreak, getDailyMultiplier, getDailyUserRank, computeDailyXp, getTodayDate } from '../services/dailyChallenge'
import { markPlayedAnonymous, computeBestStreak } from '../utils/statsStorage'
import { createNotification, getNotificationPrefs } from '../services/notifications'
import { trackGameFinished } from '../services/analytics'
import { computeXpGained, XP_PER_ACHIEVEMENT } from '../constants/xp'
import { computePulsesGained, PULSES_PER_ACHIEVEMENT, achievementSource, gameSource } from '../constants/pulses'
import { addPulses } from '../services/pulses'
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
  setLoadingRanking?: (v: boolean) => void
  showRewardGain?: (params: { gameXp: XpBreakdown | null; achievementXp: number; gamePulses?: PulsesBreakdown | null; achievementPulses?: number }) => void
  storePendingRewards?: (params: { gameXp: XpBreakdown | null; achievementXp: number; gamePulses: PulsesBreakdown | null; achievementPulses: number }) => void
  onDailyComplete?: () => void
  bumpPulses?: (amount: number) => void
  bumpXp?: (amount: number) => void
}

export function useGameOrchestration(params: UseGameOrchestrationParams) {
  const { settings, user, profile, setScreen, setGameResult, setRankingData, setNewAchievements, setLoadingRanking = () => {}, showRewardGain = () => {}, storePendingRewards = () => {}, onDailyComplete, bumpPulses = () => {}, bumpXp = () => {} } = params

  function creditAchievementPulses(unlocked: AchievementWithStatus[]): number {
    if (unlocked.length === 0) return 0
    const byTier = unlocked.reduce<Record<AchievementTier, AchievementWithStatus[]>>((acc, a) => {
      if (!acc[a.tier]) acc[a.tier] = []
      acc[a.tier].push(a)
      return acc
    }, { common: [], rare: [], epic: [], legendary: [] })
    let total = 0
    for (const tier of Object.keys(byTier) as AchievementTier[]) {
      const list = byTier[tier]
      if (list.length === 0) continue
      const amount = list.length * PULSES_PER_ACHIEVEMENT[tier]
      total += amount
      addPulses(amount, achievementSource(tier), list.map(a => a.id).join(',')).catch(console.error)
    }
    if (total > 0) bumpPulses(total)
    return total
  }

  async function handleFinished(score: number, results: QuestionResult[]): Promise<void> {
    const { mode, difficulty, category, language } = settings
    const maxStreak    = computeBestStreak(results)
    const minAnswerTime = computeMinAnswerTime(results)
    const xpBreakdown     = user ? computeXpGained(results, mode, score) : null
    const pulsesBreakdown = user ? computePulsesGained(mode, score, results, maxStreak) : null

    const lastResult = results[results.length - 1]
    const end_reason = mode === 'compétitif' && lastResult
      ? (lastResult.userAnswer === null ? 'timeout' : 'wrong_answer')
      : 'completed'
    trackGameFinished({ mode, difficulty, category, language, score, questions_answered: results.length, end_reason })

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
      xpBreakdown,
      pulsesBreakdown,
      achievementXp:     0,
      achievementPulses: 0,
    }
    setGameResult(immediateResult)

    // ── Défi journalier ──────────────────────────────────────────────────────
    // Toujours appeler onDailyComplete pour éviter d'atterrir sur la page result.
    // La soumission cloud n'est faite que si l'utilisateur est connecté.
    if (mode === 'daily') {
      if (user && profile) {
        const uid = user.id
        const today = getTodayDate()
        const correctCount = results.filter(r => r.isCorrect).length

        try {
          const streak = await getDailyStreak(uid)
          const multiplier = getDailyMultiplier(streak.current_streak)
          const xpEarned = computeDailyXp(correctCount, multiplier)

          const submitResult = await submitDailyEntry({ date: today, score, multiplier, correctAnswers: correctCount, questionResults: results })
          const userRank = await getDailyUserRank(uid, today)

          const dailyXpBreakdown: XpBreakdown = {
            base:    15,
            correct: correctCount * 20,
            bonus:   Math.round((correctCount * 20 + 15) * (multiplier - 1)),
            total:   xpEarned,
          }
          const dailyPulses = computePulsesGained('daily', score, results, maxStreak, multiplier)
          setGameResult(prev => ({ ...prev, userRank, xpBreakdown: dailyXpBreakdown, pulsesBreakdown: dailyPulses }))
          addXp(xpEarned).catch(console.error)
          if (dailyPulses.total > 0) {
            addPulses(dailyPulses.total, gameSource('daily'), today).catch(console.error)
            bumpPulses(dailyPulses.total)
          }

          // Achievements journaliers
          const prefs = await getNotificationPrefs(uid)
          const newlyUnlocked = await checkAndUnlockDailyAchievements(uid, {
            score: correctCount,
            currentStreak: submitResult.current_streak,
            userRank,
          })
          let achievementXp     = 0
          let achievementPulses = 0
          if (newlyUnlocked.length > 0) {
            setNewAchievements(newlyUnlocked)
            achievementXp = newlyUnlocked.reduce((sum, a) => sum + XP_PER_ACHIEVEMENT[a.tier], 0)
            if (achievementXp > 0) addXp(achievementXp).catch(console.error)
            achievementPulses = creditAchievementPulses(newlyUnlocked)
            if (prefs.achievement_unlocked) {
              newlyUnlocked.forEach(a => {
                createNotification(uid, 'achievement_unlocked', {
                  badge_id: a.id,
                  badge_name: a.name,
                  badge_icon: a.icon,
                }).catch(console.error)
              })
            }
            storePendingRewards({ gameXp: dailyXpBreakdown, achievementXp, gamePulses: dailyPulses, achievementPulses })
          } else {
            showRewardGain({ gameXp: dailyXpBreakdown, achievementXp: 0, gamePulses: dailyPulses, achievementPulses: 0 })
          }
        } catch (err) {
          console.error(err)
        }
      }

      if (onDailyComplete) {
        onDailyComplete()
      } else {
        setScreen('daily')
      }
      return
    }

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
        if (pulsesBreakdown && pulsesBreakdown.total > 0) {
          addPulses(pulsesBreakdown.total, gameSource('normal')).catch(console.error)
          bumpPulses(pulsesBreakdown.total)
        }
        if (xpBreakdown && xpBreakdown.total > 0) bumpXp(xpBreakdown.total)
        // Chaîner le check achievements APRÈS l'incrément des stats globales pour éviter
        // la race condition sur games_played (ex: Centenaire lu à 99 au lieu de 100)
        const gameXp = xpBreakdown?.total ?? 0
        incrementGlobalStats(uid, results, score, mode, gameXp)
          .then(() => Promise.all([
            checkAndUnlockAchievements(uid, { maxStreak, minAnswerTime, score, mode }),
            getNotificationPrefs(uid),
          ]))
          .then(([newlyUnlocked, prefs]) => {
            if (newlyUnlocked.length === 0) return
            setNewAchievements(newlyUnlocked)
            const achievementXp = newlyUnlocked.reduce((sum, a) => sum + XP_PER_ACHIEVEMENT[a.tier], 0)
            if (achievementXp > 0) {
              addXp(achievementXp).catch(console.error)
              bumpXp(achievementXp)
            }
            const achievementPulses = creditAchievementPulses(newlyUnlocked)
            if (prefs.achievement_unlocked) {
              newlyUnlocked.forEach(a => {
                createNotification(uid, 'achievement_unlocked', {
                  badge_id: a.id,
                  badge_name: a.name,
                  badge_icon: a.icon,
                }).catch(console.error)
              })
            }
            // Pas de toast pour normal : la RewardsCard de l'écran résultat
            // affiche toute la contribution (partie + achievements).
            setGameResult(prev => ({ ...prev, achievementXp, achievementPulses }))
          })
          .catch(console.error)
      } else if (!user) {
        markPlayedAnonymous()
      }
      return
    }

    // ── Compétitif + connecté ─────────────────────────────────────────────────
    // Spinner sur le quiz en attendant les données de classement ; transition
    // directe vers 'ranking' quand prêt. setScreen('result') uniquement en cas d'erreur.
    setLoadingRanking(true)

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

      if (pulsesBreakdown && pulsesBreakdown.total > 0) {
        addPulses(pulsesBreakdown.total, gameSource('compétitif')).catch(console.error)
        bumpPulses(pulsesBreakdown.total)
      }
      if (xpBreakdown && xpBreakdown.total > 0) bumpXp(xpBreakdown.total)

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
      setLoadingRanking(false)
      setScreen('ranking')

      // Achievements + notifications en fire-and-forget
      const uid = user.id
      const gameXpComp = xpBreakdown?.total ?? 0
      incrementGlobalStats(uid, results, score, mode, gameXpComp)
        .then(() => Promise.all([
          checkAndUnlockAchievements(uid, { maxStreak, minAnswerTime, score, mode, userRank: newRank }),
          getNotificationPrefs(uid),
        ]))
        .then(([newlyUnlocked, prefs]) => {
          if (newlyUnlocked.length > 0) {
            setNewAchievements(newlyUnlocked)
            const achievementXp = newlyUnlocked.reduce((sum, a) => sum + XP_PER_ACHIEVEMENT[a.tier], 0)
            if (achievementXp > 0) {
              addXp(achievementXp).catch(console.error)
              bumpXp(achievementXp)
            }
            const achievementPulses = creditAchievementPulses(newlyUnlocked)
            if (prefs.achievement_unlocked) {
              newlyUnlocked.forEach(a => {
                createNotification(uid, 'achievement_unlocked', {
                  badge_id: a.id,
                  badge_name: a.name,
                  badge_icon: a.icon,
                }).catch(console.error)
              })
            }
            // Pas de toast pour compétitif : la RewardsCard de l'écran résultat
            // affiche toute la contribution (partie + achievements).
            setGameResult(prev => ({ ...prev, achievementXp, achievementPulses }))
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
      setLoadingRanking(false)
      setScreen('result')
    }
  }

  return { handleFinished }
}
