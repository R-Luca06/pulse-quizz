// ─── Courbe de niveaux ────────────────────────────────────────────────────────
// Le niveau 1 est le niveau de départ (0 XP).
// XP cumulé pour atteindre le niveau N : 100 × (N-1) × N
//   Niveau 1  →    0 XP  (départ)
//   Niveau 2  →  200 XP
//   Niveau 5  →  2 000 XP
//   Niveau 10 →  9 000 XP
//   Niveau 25 →  60 000 XP
//   Niveau 50 → 245 000 XP

export const MAX_LEVEL = 50

/** XP cumulé total nécessaire pour atteindre le début du niveau `level`. */
export function getXpForLevel(level: number): number {
  if (level <= 1) return 0
  return 100 * (level - 1) * level
}

/** Niveau atteint pour un total XP donné (minimum 1). */
export function getLevelFromXp(xp: number): number {
  if (xp <= 0) return 1
  // Résolution de 100*(n-1)*n = xp → n² - n - xp/100 = 0
  // n = (1 + sqrt(1 + 4*xp/100)) / 2 = (1 + sqrt(1 + xp/25)) / 2
  return Math.min(MAX_LEVEL, Math.max(1, Math.floor((1 + Math.sqrt(1 + xp / 25)) / 2)))
}

export interface LevelProgress {
  level: number
  progressXp: number   // XP accumulé dans le niveau courant
  neededXp: number     // XP total requis pour compléter ce niveau
  percentage: number   // 0–100
}

/** Progression détaillée dans le niveau courant. */
export function getLevelProgress(totalXp: number): LevelProgress {
  const level      = getLevelFromXp(totalXp)
  const startXp    = getXpForLevel(level)
  const endXp      = getXpForLevel(level + 1)
  const progressXp = totalXp - startXp
  const neededXp   = endXp - startXp
  return {
    level,
    progressXp,
    neededXp,
    percentage: Math.min(100, Math.round((progressXp / neededXp) * 100)),
  }
}
