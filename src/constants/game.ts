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

// ─── Combo ───────────────────────────────────────────────────────────────────
/** Paliers de streak déclenchant l'overlay combo */
export const COMBO_MILESTONES = [3, 5, 7, 10]
