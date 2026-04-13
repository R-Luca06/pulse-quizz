import type { AchievementId } from '../types/quiz'

/** Couleur hexadécimale principale de chaque achievement (badge hexagonal + glow) */
export const BADGE_COLOR_HEX: Record<AchievementId, string> = {
  // Compte
  premiers_pas:          '#10b981',
  // Volume
  coup_d_envoi:          '#10b981',
  pris_au_jeu:           '#14b8a6',
  accro:                 '#06b6d4',
  centenaire:            '#f59e0b',
  marathonien:           '#f97316',
  // Compétitif
  premier_competiteur:   '#0ea5e9',
  combattant:            '#f97316',
  gladiateur:            '#ef4444',
  legende_de_lareme:     '#f43f5e',
  // Séries
  serie_de_feu:          '#f97316',
  inferno:               '#ef4444',
  inarretable:           '#f43f5e',
  transcendant:          '#8b5cf6',
  // Rapidité
  vif:                   '#0ea5e9',
  foudroyant:            '#3b82f6',
  supersonique:          '#6366f1',
  instinct_pur:          '#8b5cf6',
  // Perfection
  perfectionniste:       '#8b5cf6',
  // Points
  rookie:                '#64748b',
  challenger:            '#10b981',
  performeur:            '#14b8a6',
  chasseur_de_points:    '#06b6d4',
  expert:                '#3b82f6',
  maitre:                '#8b5cf6',
  grand_maitre:          '#a855f7',
  legende:               '#f59e0b',
  mythique:              '#eab308',
  // Exploration
  touche_a_tout:         '#14b8a6',
  polyvalent:            '#a855f7',
  // Classement
  dans_l_elite:          '#64748b',
  reconnu:               '#0ea5e9',
  les_25:                '#3b82f6',
  les_meilleurs:         '#8b5cf6',
  sur_le_podium:         '#f59e0b',
  sans_rival:            '#eab308',
  // Personnalisation
  premier_pin:           '#8b5cf6',
  collectionneur:        '#a855f7',
  reinvention:           '#ec4899',
  nouveau_visage:        '#f43f5e',
  mon_histoire:          '#d946ef',
}
