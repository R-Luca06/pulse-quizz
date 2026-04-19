import type { CSSProperties } from 'react'
import type { AchievementTier } from '../../types/quiz'
import { HELIARQUE_TITLE_STYLE } from './solarSet'

export interface TitleProps {
  rank: number | null
}

interface TitleEntry {
  id: string
  name: string
  tier?: AchievementTier
  description?: string
  resolve: (props: TitleProps) => string
  style?: CSSProperties
  setId?: string
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
  heliarque: {
    id:          'heliarque',
    name:        'Héliarque',
    tier:        'legendary',
    setId:       'solaire_v1',
    description: 'Titre doré scintillant. Set Héliarque · Vol. 01.',
    resolve:     () => 'Héliarque',
    style:       HELIARQUE_TITLE_STYLE,
  },
}

export function resolveTitle(id: string | null | undefined, props: TitleProps): string {
  const entry = (id && TITLE_REGISTRY[id]) || TITLE_REGISTRY[DEFAULT_TITLE_ID]
  return entry.resolve(props)
}

export function resolveTitleStyle(id: string | null | undefined): CSSProperties | undefined {
  const entry = (id && TITLE_REGISTRY[id]) || TITLE_REGISTRY[DEFAULT_TITLE_ID]
  return entry.style
}
