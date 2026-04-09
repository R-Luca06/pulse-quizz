const key = (mode: string, difficulty: string, category: string | number) =>
  `pulse_best_${mode}_${difficulty}_${category}`

export function getBestScore(mode: string, difficulty: string, category: string | number): number {
  try {
    const raw = localStorage.getItem(key(mode, difficulty, category))
    if (raw === null) return 0
    const n = Number(raw)
    return Number.isFinite(n) && n >= 0 ? n : 0
  } catch {
    return 0
  }
}

export function saveBestScore(mode: string, difficulty: string, category: string | number, score: number): void {
  try {
    localStorage.setItem(key(mode, difficulty, category), String(score))
  } catch {
    // localStorage quota exceeded ou mode privé — on ignore silencieusement
  }
}
