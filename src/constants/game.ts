// ─── Timer ───────────────────────────────────────────────────────────────────
/** Durée d'une question en secondes */
export const QUESTION_DURATION = 10

/** Intervalle de mise à jour du timer en millisecondes */
export const TIMER_TICK = 100

/** En dessous de ce nombre de secondes, le timer passe en mode urgent */
export const URGENT_THRESHOLD = 3

// ─── Feedback ────────────────────────────────────────────────────────────────
/** Durée d'affichage du feedback (bonne/mauvaise réponse) avant la question suivante */
export const FEEDBACK_DURATION = 1500

// ─── Mode normal ─────────────────────────────────────────────────────────────
/** Nombre de questions en mode normal */
export const NORMAL_MODE_QUESTIONS = 10

// ─── Mode défi journalier ─────────────────────────────────────────────────────
/** Nombre de questions dans le défi journalier */
export const DAILY_MODE_QUESTIONS = 10

// ─── Combo ───────────────────────────────────────────────────────────────────
/** Paliers de streak déclenchant l'overlay combo */
export const COMBO_MILESTONES = [3, 5, 7, 10]

// ─── Mode compétitif ─────────────────────────────────────────────────────────
/** Points de base par bonne réponse */
export const COMP_BASE_POINTS = 100

/** Nombre de questions restantes déclenchant le préchargement du batch suivant */
export const COMP_PREFETCH_THRESHOLD = 4

/** Paliers de multiplicateur selon le temps de réponse (secondes) */
export const COMP_SPEED_TIERS: { maxTime: number; multiplier: number }[] = [
  { maxTime: 2,        multiplier: 3   },
  { maxTime: 4,        multiplier: 2   },
  { maxTime: 6,        multiplier: 1.5 },
  { maxTime: 8,        multiplier: 1.2 },
  { maxTime: Infinity, multiplier: 1   },
]

// ─── API ─────────────────────────────────────────────────────────────────────
/** Nombre de questions demandées par batch à OpenTDB */
export const QUESTIONS_PER_BATCH = 10

/** Timeout réseau pour les requêtes OpenTDB (ms) */
export const API_TIMEOUT_MS = 8000

/** Code HTTP retourné par OpenTDB en cas de rate-limit */
export const OPENTDB_HTTP_RATE_LIMIT = 429

/** response_code OpenTDB indiquant un rate-limit (Token Empty) */
export const OPENTDB_CODE_RATE_LIMIT = 5

/** Retourne le palier de vitesse correspondant au temps écoulé (en secondes) */
export function getSpeedTier(elapsedSeconds: number) {
  return COMP_SPEED_TIERS.find(t => elapsedSeconds <= t.maxTime) ?? COMP_SPEED_TIERS[COMP_SPEED_TIERS.length - 1]
}
