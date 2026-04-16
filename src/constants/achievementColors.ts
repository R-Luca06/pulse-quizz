import type { AchievementId, AchievementTier } from '../types/quiz'

// ── Uniform fill for all badge hexagons ──────────────────────────────────────
export const BADGE_FILL = '#111827'

// ── Stroke color per tier (seul différenciateur visuel de l'hexagone) ─────────
export const TIER_STROKE: Record<AchievementTier, string> = {
  common:    'rgba(255,255,255,0.22)',
  rare:      'rgba(96,165,250,0.65)',  // bleu ciel — "rare" universel dans les jeux
  epic:      '#a78bfa',   // violet doux
  legendary: '#f59e0b',   // or/amber
}

// ── Hex pur par tier pour les animations (gradients, glow, flash) ─────────────
// TIER_STROKE utilise des rgba pour common/rare, TIER_GLOW_COLOR est toujours #hex.
export const TIER_GLOW_COLOR: Record<AchievementTier, string> = {
  common:    '#ffffff',
  rare:      '#60a5fa',  // bleu ciel
  epic:      '#a78bfa',
  legendary: '#f59e0b',
}

// ── Prestige tier per achievement ────────────────────────────────────────────
export const BADGE_TIER: Record<AchievementId, AchievementTier> = {
  // Compte
  premiers_pas:          'common',
  // Volume
  coup_d_envoi:          'common',
  pris_au_jeu:           'common',
  accro:                 'rare',
  centenaire:            'epic',
  marathonien:           'epic',
  // Compétitif
  premier_competiteur:   'common',
  combattant:            'rare',
  gladiateur:            'epic',
  legende_de_lareme:     'legendary',
  // Séries
  serie_de_feu:          'rare',
  inferno:               'epic',
  inarretable:           'epic',
  transcendant:          'legendary',
  // Rapidité
  vif:                   'common',
  foudroyant:            'common',
  supersonique:          'rare',
  instinct_pur:          'legendary',
  // Perfection
  perfectionniste:       'rare',
  // Points
  rookie:                'common',
  challenger:            'common',
  performeur:            'common',
  chasseur_de_points:    'rare',
  expert:                'rare',
  maitre:                'epic',
  grand_maitre:          'epic',
  legende:               'legendary',
  mythique:              'legendary',
  // Exploration
  touche_a_tout:         'common',
  polyvalent:            'common',
  // Classement
  dans_l_elite:          'common',
  reconnu:               'rare',
  les_25:                'rare',
  les_meilleurs:         'epic',
  sur_le_podium:         'legendary',
  sans_rival:            'legendary',
  // Personnalisation
  premier_pin:           'common',
  collectionneur:        'rare',
  reinvention:           'common',
  nouveau_visage:        'common',
  mon_histoire:          'common',
  // Défi Journalier — séries
  daily_premier_defi:    'common',
  daily_serie_3:         'rare',
  daily_semaine_de_feu:  'epic',
  daily_quinzaine:       'epic',
  daily_mois_de_fer:     'legendary',
  daily_centenaire:      'legendary',
  // Défi Journalier — scores
  daily_score_parfait:   'common',
  daily_sniper:          'rare',
  daily_infaillible:     'epic',
  daily_podium:          'rare',
  daily_roi_du_jour:     'legendary',
}
