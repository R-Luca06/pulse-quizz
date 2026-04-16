import { useState } from 'react'
import type { GameMode, Difficulty, Language, Category } from '../types/quiz'

export interface GameSettings {
  mode: GameMode
  difficulty: Difficulty
  language: Language
  category: Category
}

const STORAGE_KEY = 'pulse_settings'

const DEFAULTS: GameSettings = {
  mode: 'normal',
  difficulty: 'easy',
  language: 'fr',
  category: 'all',
}

const VALID_MODES: GameMode[] = ['normal', 'compétitif']
const VALID_LANGUAGES: Language[] = ['fr']
const NORMAL_DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard']

function load(): GameSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULTS }
    const parsed = JSON.parse(raw) as Partial<GameSettings>
    const mode = VALID_MODES.includes(parsed.mode as GameMode) ? parsed.mode as GameMode : DEFAULTS.mode
    // En mode normal, 'mixed' n'est pas valide — fallback sur 'easy'
    const difficulty = mode === 'normal' && !NORMAL_DIFFICULTIES.includes(parsed.difficulty as Difficulty)
      ? DEFAULTS.difficulty
      : (parsed.difficulty ?? DEFAULTS.difficulty)
    const language = VALID_LANGUAGES.includes(parsed.language as Language) ? parsed.language as Language : DEFAULTS.language
    return {
      mode,
      difficulty,
      language,
      category: parsed.category ?? DEFAULTS.category,
    }
  } catch {
    return { ...DEFAULTS }
  }
}

function save(settings: GameSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // localStorage quota exceeded ou mode privé — on ignore
  }
}

export function useSettings() {
  const [settings, setSettings] = useState<GameSettings>(load)

  function update(patch: Partial<GameSettings>) {
    setSettings((prev) => {
      const next = { ...prev, ...patch }
      save(next)
      return next
    })
  }

  // Met à jour l'état en mémoire SANS persister dans localStorage.
  // Utilisé pour le mode daily afin de ne pas écraser les préférences normales.
  function updateTemp(patch: Partial<GameSettings>) {
    setSettings((prev) => ({ ...prev, ...patch }))
  }

  // Recharge les settings depuis localStorage (pour restaurer après un daily).
  function reset() {
    setSettings(load())
  }

  return { settings, update, updateTemp, reset }
}
