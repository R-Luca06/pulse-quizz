import type { GameMode, Difficulty, Language, Category } from '../types/quiz'

/** Catégories disponibles (correspondent au champ `category` dans Supabase) */
export const FR_CATEGORIES: { value: Category; label: string }[] = [
  { value: 'all',              label: 'Toutes catégories' },
  { value: 'Culture générale', label: 'Culture générale' },
  { value: 'Géographie',       label: 'Géographie' },
  { value: 'Histoire',         label: 'Histoire' },
  { value: 'Informatique',     label: 'Informatique' },
  { value: 'Jeux vidéo',       label: 'Jeux vidéo' },
  { value: 'Mathématiques',    label: 'Mathématiques' },
  { value: 'Sciences & Nature',label: 'Sciences & Nature' },
]

export const MODES: { value: GameMode; label: string; desc: string }[] = [
  { value: 'normal',      label: 'Normal',      desc: '10 questions' },
  { value: 'compétitif',  label: 'Compétitif',  desc: 'Soyez premier !' },
]

export const DIFFICULTIES: { value: Difficulty; label: string }[] = [
  { value: 'easy',   label: 'Facile' },
  { value: 'medium', label: 'Moyen' },
  { value: 'hard',   label: 'Difficile' },
]

export const LANGUAGES: { value: Language; label: string }[] = [
  { value: 'fr', label: 'Français' },
]

// Lookups pour l'affichage (ResultScreen, StatsPage)
export const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  FR_CATEGORIES.map(c => [String(c.value), c.label])
)

export const DIFFICULTY_LABELS: Record<string, string> = Object.fromEntries(
  DIFFICULTIES.map(d => [d.value, d.label])
)

export const MODE_LABELS: Record<string, string> = Object.fromEntries(
  MODES.map(m => [m.value, m.label])
)

export const LANGUAGE_LABELS: Record<string, string> = Object.fromEntries(
  LANGUAGES.map(l => [l.value, l.label])
)

/** Paliers de vitesse pour l'affichage dans la popup règles */
export const COMP_SPEED_TIERS_LABELS: { label: string; multiplier: string; color: string }[] = [
  { label: '≤ 2 secondes', multiplier: '× 3', color: 'text-yellow-400' },
  { label: '≤ 4 secondes', multiplier: '× 2', color: 'text-purple-400' },
  { label: '≤ 6 secondes', multiplier: '× 1.5', color: 'text-blue-400' },
  { label: '≤ 8 secondes', multiplier: '× 1.2', color: 'text-white/40' },
  { label: '≤ 10 secondes', multiplier: '× 1', color: 'text-white/25' },
]

// Styles boutons partagés (LandingPage — taille normale)
export const btnBase = 'flex-1 rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors duration-150 text-center'
export const btnSelected = 'border-neon-violet bg-neon-violet/15 text-white'
export const btnIdle = 'border-white/10 bg-white/5 text-white/45 hover:border-white/20 hover:text-white/70'

// Styles boutons partagés (StatsPage — taille réduite)
export const btnBaseSm = 'rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors duration-150'
export const btnIdleSm = 'border-white/10 bg-white/5 text-white/40 hover:border-white/20 hover:text-white/60'
