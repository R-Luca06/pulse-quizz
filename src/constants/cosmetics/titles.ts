import type { AchievementTier } from '../../types/quiz'

export interface TitleProps {
  rank: number | null
}

interface TitleEntry {
  id: string
  name: string
  tier?: AchievementTier
  description?: string
  resolve: (props: TitleProps) => string
}

function dynamicRankTitle({ rank }: TitleProps): string {
  if (!rank) return 'Joueur'
  if (rank === 1) return 'Champion Mondial'
  if (rank <= 3) return 'Top 3 Mondial'
  if (rank <= 10) return 'Élite Mondiale'
  if (rank <= 50) return 'Maître du Quiz'
  if (rank <= 100) return 'Expert'
  return 'Compétiteur'
}

export const DEFAULT_TITLE_ID = 'dynamic_rank'

export const TITLE_REGISTRY: Record<string, TitleEntry> = {
  [DEFAULT_TITLE_ID]: {
    id:          DEFAULT_TITLE_ID,
    name:        'Titre de rang',
    description: 'Se met à jour automatiquement selon ton rang mondial.',
    resolve:     dynamicRankTitle,
  },
  erudit: {
    id:          'erudit',
    name:        'Érudit',
    tier:        'common',
    description: 'Pour ceux qui cumulent les bonnes réponses dans toutes les catégories.',
    resolve:     () => 'Érudit',
  },
  maitre_des_categories: {
    id:          'maitre_des_categories',
    name:        'Maître des Catégories',
    tier:        'rare',
    description: "Réservé à ceux qui dominent toutes les catégories.",
    resolve:     () => 'Maître des Catégories',
  },
  foudre_mentale: {
    id:          'foudre_mentale',
    name:        'Foudre Mentale',
    tier:        'epic',
    description: "Pour les joueurs dont la vitesse de réponse défie l'humain.",
    resolve:     () => 'Foudre Mentale',
  },
  legende_quotidienne: {
    id:          'legende_quotidienne',
    name:        'Légende Quotidienne',
    tier:        'legendary',
    description: 'Streak légendaire au Défi Journalier.',
    resolve:     () => 'Légende Quotidienne',
  },
}

export function resolveTitle(id: string | null | undefined, props: TitleProps): string {
  const entry = (id && TITLE_REGISTRY[id]) || TITLE_REGISTRY[DEFAULT_TITLE_ID]
  return entry.resolve(props)
}
