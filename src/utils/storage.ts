const key = (mode: string, difficulty: string) => `pulse_best_${mode}_${difficulty}`

export function getBestScore(mode: string, difficulty: string): number {
  return Number(localStorage.getItem(key(mode, difficulty)) ?? 0)
}

export function saveBestScore(mode: string, difficulty: string, score: number): void {
  localStorage.setItem(key(mode, difficulty), String(score))
}
