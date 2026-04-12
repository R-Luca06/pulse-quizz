import type { Achievement, AchievementId } from '../types/quiz'

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'premiers_pas',
    name: 'Premiers Pas',
    description: 'Créer son compte Pulse Quizz',
    icon: '🌱',
    progressTotal: null,
  },
  {
    id: 'premier_competiteur',
    name: 'Premier Compétiteur',
    description: 'Terminer sa première partie compétitive',
    icon: '⚡',
    progressTotal: null,
  },
  {
    id: 'serie_de_feu',
    name: 'Série de Feu',
    description: "Enchaîner 10 bonnes réponses d'affilée en une partie",
    icon: '🔥',
    progressTotal: null,
  },
  {
    id: 'perfectionniste',
    name: 'Perfectionniste',
    description: 'Score parfait en mode normal (10/10)',
    icon: '💎',
    progressTotal: null,
  },
  {
    id: 'centenaire',
    name: 'Centenaire',
    description: 'Jouer 100 parties (tous modes)',
    icon: '🏆',
    progressTotal: 100,
  },
]

export const ACHIEVEMENT_MAP: Record<AchievementId, Achievement> =
  Object.fromEntries(ACHIEVEMENTS.map(a => [a.id, a])) as Record<AchievementId, Achievement>
