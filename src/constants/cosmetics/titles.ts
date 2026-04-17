import type { AchievementTier } from '../../types/quiz'

export interface TitleProps {
  rank: number | null
}

interface TitleEntry {
  id: string
  name: string
  tier?: AchievementTier
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
    id:      DEFAULT_TITLE_ID,
    name:    'Titre de rang',
    resolve: dynamicRankTitle,
  },
}

export function resolveTitle(id: string | null | undefined, props: TitleProps): string {
  const entry = (id && TITLE_REGISTRY[id]) || TITLE_REGISTRY[DEFAULT_TITLE_ID]
  return entry.resolve(props)
}
