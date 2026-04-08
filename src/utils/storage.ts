const key = (mode: string, difficulty: string, category: string | number) =>
  `pulse_best_${mode}_${difficulty}_${category}`

export function getBestScore(mode: string, difficulty: string, category: string | number): number {
  return Number(localStorage.getItem(key(mode, difficulty, category)) ?? 0)
}

export function saveBestScore(mode: string, difficulty: string, category: string | number, score: number): void {
  localStorage.setItem(key(mode, difficulty, category), String(score))
}
