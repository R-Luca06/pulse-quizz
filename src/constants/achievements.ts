import type { Achievement, AchievementId } from '../types/quiz'

export const ACHIEVEMENTS: Achievement[] = [
  // ── Compte ──────────────────────────────────────────────────────────────────
  {
    id: 'premiers_pas',
    name: 'Premiers Pas',
    description: 'Créer son compte Pulse Quizz',
    icon: '🌱',
    progressTotal: null,
  },

  // ── Volume — parties jouées ──────────────────────────────────────────────────
  {
    id: 'coup_d_envoi',
    name: "Coup d'Envoi",
    description: 'Jouer sa première partie',
    icon: '🎮',
    progressTotal: 1,
  },
  {
    id: 'pris_au_jeu',
    name: 'Pris au Jeu',
    description: 'Jouer 10 parties',
    icon: '🎯',
    progressTotal: 10,
  },
  {
    id: 'accro',
    name: 'Accro',
    description: 'Jouer 50 parties',
    icon: '🔁',
    progressTotal: 50,
  },
  {
    id: 'centenaire',
    name: 'Centenaire',
    description: 'Jouer 100 parties (tous modes)',
    icon: '🏆',
    progressTotal: 100,
  },
  {
    id: 'marathonien',
    name: 'Marathonien',
    description: 'Jouer 500 parties',
    icon: '🏃',
    progressTotal: 500,
  },

  // ── Compétitif ──────────────────────────────────────────────────────────────
  {
    id: 'premier_competiteur',
    name: 'Premier Compétiteur',
    description: 'Terminer sa première partie compétitive',
    icon: '⚡',
    progressTotal: null,
  },
  {
    id: 'combattant',
    name: 'Combattant',
    description: 'Jouer 50 parties compétitives',
    icon: '🥊',
    progressTotal: 50,
  },
  {
    id: 'gladiateur',
    name: 'Gladiateur',
    description: 'Jouer 100 parties compétitives',
    icon: '⚔️',
    progressTotal: 100,
  },
  {
    id: 'legende_de_lareme',
    name: "Légende de l'Arène",
    description: 'Jouer 1 000 parties compétitives',
    icon: '🏟️',
    progressTotal: 1000,
  },

  // ── Séries ──────────────────────────────────────────────────────────────────
  {
    id: 'serie_de_feu',
    name: 'Série de Feu',
    description: "Enchaîner 10 bonnes réponses d'affilée en une partie",
    icon: '🔥',
    progressTotal: null,
  },
  {
    id: 'inferno',
    name: 'Inferno',
    description: "Enchaîner 20 bonnes réponses d'affilée",
    icon: '🌋',
    progressTotal: null,
  },
  {
    id: 'inarretable',
    name: 'Inarrêtable',
    description: "Enchaîner 30 bonnes réponses d'affilée",
    icon: '🌪️',
    progressTotal: null,
  },
  {
    id: 'transcendant',
    name: 'Transcendant',
    description: "Enchaîner 50 bonnes réponses d'affilée",
    icon: '✨',
    progressTotal: null,
  },

  // ── Rapidité ────────────────────────────────────────────────────────────────
  {
    id: 'vif',
    name: 'Vif',
    description: 'Répondre correctement en moins de 5 secondes',
    icon: '🐇',
    progressTotal: null,
  },
  {
    id: 'foudroyant',
    name: 'Foudroyant',
    description: 'Répondre correctement en moins de 3 secondes',
    icon: '⚡',
    progressTotal: null,
  },
  {
    id: 'supersonique',
    name: 'Supersonique',
    description: 'Répondre correctement en moins de 2 secondes',
    icon: '🚀',
    progressTotal: null,
  },
  {
    id: 'instinct_pur',
    name: 'Instinct Pur',
    description: "Répondre correctement en moins d'1 seconde",
    icon: '🧠',
    progressTotal: null,
  },

  // ── Perfection ──────────────────────────────────────────────────────────────
  {
    id: 'perfectionniste',
    name: 'Perfectionniste',
    description: 'Score parfait en mode normal (10/10)',
    icon: '💎',
    progressTotal: null,
  },

  // ── Points compétitif ───────────────────────────────────────────────────────
  {
    id: 'rookie',
    name: 'Rookie',
    description: 'Atteindre 1 000 points en compétitif',
    icon: '🌱',
    progressTotal: 1000,
  },
  {
    id: 'challenger',
    name: 'Challenger',
    description: 'Atteindre 2 000 points en compétitif',
    icon: '🎖️',
    progressTotal: 2000,
  },
  {
    id: 'performeur',
    name: 'Performeur',
    description: 'Atteindre 3 000 points en compétitif',
    icon: '📈',
    progressTotal: 3000,
  },
  {
    id: 'chasseur_de_points',
    name: 'Chasseur de Points',
    description: 'Atteindre 5 000 points en compétitif',
    icon: '🎯',
    progressTotal: 5000,
  },
  {
    id: 'expert',
    name: 'Expert',
    description: 'Atteindre 10 000 points en compétitif',
    icon: '🔵',
    progressTotal: 10000,
  },
  {
    id: 'maitre',
    name: 'Maître',
    description: 'Atteindre 20 000 points en compétitif',
    icon: '🟣',
    progressTotal: 20000,
  },
  {
    id: 'grand_maitre',
    name: 'Grand Maître',
    description: 'Atteindre 30 000 points en compétitif',
    icon: '💜',
    progressTotal: 30000,
  },
  {
    id: 'legende',
    name: 'Légende',
    description: 'Atteindre 50 000 points en compétitif',
    icon: '🌟',
    progressTotal: 50000,
  },
  {
    id: 'mythique',
    name: 'Mythique',
    description: 'Atteindre 100 000 points en compétitif',
    icon: '💫',
    progressTotal: 100000,
  },

  // ── Exploration ─────────────────────────────────────────────────────────────
  {
    id: 'touche_a_tout',
    name: 'Touche-à-Tout',
    description: 'Jouer dans les 7 catégories disponibles',
    icon: '🗺️',
    progressTotal: 7,
  },
  {
    id: 'polyvalent',
    name: 'Polyvalent',
    description: 'Jouer en mode Normal et en mode Compétitif',
    icon: '🔄',
    progressTotal: null,
  },

  // ── Classement ──────────────────────────────────────────────────────────────
  {
    id: 'dans_l_elite',
    name: "Dans l'Élite",
    description: 'Entrer dans le top 100 du classement compétitif',
    icon: '🏅',
    progressTotal: null,
  },
  {
    id: 'reconnu',
    name: 'Reconnu',
    description: 'Entrer dans le top 50 du classement compétitif',
    icon: '🎗️',
    progressTotal: null,
  },
  {
    id: 'les_25',
    name: 'Les 25',
    description: 'Entrer dans le top 25 du classement compétitif',
    icon: '💪',
    progressTotal: null,
  },
  {
    id: 'les_meilleurs',
    name: 'Les Meilleurs',
    description: 'Entrer dans le top 10 du classement compétitif',
    icon: '🔟',
    progressTotal: null,
  },
  {
    id: 'sur_le_podium',
    name: 'Sur le Podium',
    description: 'Entrer dans le top 3 du classement compétitif',
    icon: '🥈',
    progressTotal: null,
  },
  {
    id: 'sans_rival',
    name: 'Sans Rival',
    description: 'Être numéro 1 du classement compétitif',
    icon: '👑',
    progressTotal: null,
  },

  // ── Personnalisation ────────────────────────────────────────────────────────
  {
    id: 'premier_pin',
    name: 'Premier Pin',
    description: 'Épingler un badge dans le leaderboard',
    icon: '📌',
    progressTotal: null,
  },
  {
    id: 'collectionneur',
    name: 'Collectionneur',
    description: 'Épingler 3 badges dans le leaderboard',
    icon: '🗂️',
    progressTotal: null,
  },
  {
    id: 'reinvention',
    name: 'Réinvention',
    description: 'Changer son pseudo',
    icon: '✏️',
    progressTotal: null,
  },
  {
    id: 'nouveau_visage',
    name: 'Nouveau Visage',
    description: 'Changer son avatar',
    icon: '🎭',
    progressTotal: null,
  },
  {
    id: 'mon_histoire',
    name: 'Mon Histoire',
    description: 'Renseigner sa description de profil',
    icon: '📖',
    progressTotal: null,
  },
]

export const ACHIEVEMENT_MAP: Record<AchievementId, Achievement> =
  Object.fromEntries(ACHIEVEMENTS.map(a => [a.id, a])) as Record<AchievementId, Achievement>
