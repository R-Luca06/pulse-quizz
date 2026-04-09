import type { GameMode, Difficulty, Language, Category } from '../types/quiz'

export const CATEGORIES: { value: Category; label: string }[] = [
  { value: 'all', label: 'Toutes catégories' },
  { value: 9,     label: 'Culture générale' },
  { value: 11,    label: 'Cinéma' },
  { value: 12,    label: 'Musique' },
  { value: 14,    label: 'Télévision' },
  { value: 15,    label: 'Jeux vidéo' },
  { value: 17,    label: 'Sciences & Nature' },
  { value: 18,    label: 'Informatique' },
  { value: 19,    label: 'Mathématiques' },
  { value: 21,    label: 'Sports' },
  { value: 22,    label: 'Géographie' },
  { value: 23,    label: 'Histoire' },
  { value: 27,    label: 'Animaux' },
]

export const MODES: { value: GameMode; label: string; desc: string }[] = [
  { value: 'normal', label: 'Normal', desc: '10 questions' },
  { value: 'survie', label: 'Survie', desc: 'Soyez irréprochable' },
]

export const DIFFICULTIES: { value: Difficulty; label: string }[] = [
  { value: 'easy',   label: 'Facile' },
  { value: 'medium', label: 'Moyen' },
  { value: 'hard',   label: 'Difficile' },
]

export const LANGUAGES: { value: Language; label: string }[] = [
  { value: 'fr', label: 'Français' },
  { value: 'en', label: 'English' },
]

// Lookups pour l'affichage (ResultScreen, StatsPage)
export const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  CATEGORIES.map(c => [String(c.value), c.label])
)

export const DIFFICULTY_LABELS: Record<string, string> = Object.fromEntries(
  DIFFICULTIES.map(d => [d.value, d.label])
)

export const MODE_LABELS: Record<string, string> = Object.fromEntries(
  MODES.map(m => [m.value, m.label])
)

// Styles boutons partagés (LandingPage)
export const btnBase = 'flex-1 rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors duration-150 text-center'
export const btnSelected = 'border-neon-violet bg-neon-violet/15 text-white'
export const btnIdle = 'border-white/10 bg-white/5 text-white/45 hover:border-white/20 hover:text-white/70'
