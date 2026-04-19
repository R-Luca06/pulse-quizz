export interface TriviaQuestion {
  question: string
  correct_answer: string
  incorrect_answers: string[]
  shuffledAnswers: string[]
  category: string
  difficulty: 'easy' | 'medium' | 'hard'
  anecdote?: string | null
}

export type AnswerState = 'idle' | 'correct' | 'wrong' | 'timeout'
export type QuizPhase = 'loading' | 'playing' | 'feedback' | 'finished' | 'error'
export type GameMode   = 'normal' | 'compétitif' | 'daily'
export type AchievementTier = 'common' | 'rare' | 'epic' | 'legendary'
export type LegendaryEffect = 'fire' | 'electric' | 'gold' | 'prismatic'
export type Difficulty = 'mixed' | 'easy' | 'medium' | 'hard'
export type Language   = 'fr'
export type Category   = 'all' | string

export interface QuestionResult {
  question: string
  correctAnswer: string
  userAnswer: string | null  // null = timeout
  isCorrect: boolean
  timeSpent: number          // secondes, arrondi à 1 décimale
  pointsEarned?: number      // modes compétitif et daily
  multiplier?: number        // modes compétitif et daily (ex: 3, 2, 1.5, 1.2, 1)
  anecdote?: string | null   // utilisé par la Daily Recap (phase 4)
}

export interface XpBreakdown {
  base:    number   // XP fixe pour avoir joué
  correct: number   // XP des bonnes réponses
  bonus:   number   // XP bonus (score parfait)
  total:   number
}

export interface PulsesBreakdown {
  base:    number
  correct: number
  streak:  number
  total:   number
}

export interface GameResult {
  score: number
  results: QuestionResult[]
  bestScore: number
  isNewBest: boolean
  userRank: number | null
  rankDelta: number | null
  xpBreakdown: XpBreakdown | null
  pulsesBreakdown: PulsesBreakdown | null
  achievementXp: number
  achievementPulses: number
}

export interface RankingData {
  userRank: number | null
  rankDelta: number | null
  userId: string
  username: string
  userScore: number
}

// ─── Inventaire & cosmétiques ─────────────────────────────────────────────────

export type BadgeSource = 'achievement' | 'shop' | 'season' | 'rank'

export type ItemType =
  | 'badge'
  | 'emblem'
  | 'background'
  | 'title'
  | 'card_design'
  | 'screen_animation'

export type CosmeticType = Exclude<ItemType, 'badge'>

export interface InventoryItem {
  item_type:   ItemType
  item_id:     string
  source:      BadgeSource
  obtained_at: string       // ISO timestamp
}

export type OwnedBadge = InventoryItem & { item_type: 'badge' }

export interface EquippedCosmetics {
  emblem_id:      string | null
  background_id:  string | null
  title_id:       string | null
  card_design_id: string | null
  screen_anim_id: string | null
}

// ─── Boutique ─────────────────────────────────────────────────────────────────

export interface ShopItem {
  id:              string           // uuid shop_items.id
  item_type:       ItemType
  item_id:         string
  name:            string
  description:     string | null
  tier:            AchievementTier
  price:           number
  is_new:          boolean
  is_limited:      boolean
  featured:        boolean
  available_from:  string | null
  available_until: string | null
  sort_order:      number
}

export interface PurchaseResult {
  balance:   number
  item_type: ItemType
  item_id:   string
}

export interface ShopBundle {
  id:              string
  slug:            string
  name:            string
  description:     string | null
  tier:            AchievementTier
  price:           number
  is_new:          boolean
  is_limited:      boolean
  featured:        boolean
  available_from:  string | null
  available_until: string | null
  sort_order:      number
  items:           ShopItem[]       // pièces résolues (jointure côté service)
}

export interface BundlePurchaseResult {
  balance:     number
  bundle_id:   string
  items_added: number
}

export type PurchaseErrorCode =
  | 'not_authenticated'
  | 'item_not_found'
  | 'bundle_not_found'
  | 'not_yet_available'
  | 'no_longer_available'
  | 'already_owned'
  | 'insufficient_balance'
  | 'unknown'

// ─── Achievements ─────────────────────────────────────────────────────────────

export type AchievementId =
  // Compte
  | 'premiers_pas'
  // Volume — parties jouées
  | 'coup_d_envoi'
  | 'pris_au_jeu'
  | 'accro'
  | 'centenaire'
  | 'marathonien'
  // Compétitif — parties comp
  | 'premier_competiteur'
  | 'combattant'
  | 'gladiateur'
  | 'legende_de_lareme'
  // Séries
  | 'serie_de_feu'
  | 'inferno'
  | 'inarretable'
  | 'transcendant'
  // Rapidité
  | 'vif'
  | 'foudroyant'
  | 'supersonique'
  | 'instinct_pur'
  // Perfection
  | 'perfectionniste'
  // Points compétitif
  | 'rookie'
  | 'challenger'
  | 'performeur'
  | 'chasseur_de_points'
  | 'expert'
  | 'maitre'
  | 'grand_maitre'
  | 'legende'
  | 'mythique'
  // Exploration
  | 'touche_a_tout'
  | 'polyvalent'
  // Classement
  | 'dans_l_elite'
  | 'reconnu'
  | 'les_25'
  | 'les_meilleurs'
  | 'sur_le_podium'
  | 'sans_rival'
  // Personnalisation
  | 'premier_pin'
  | 'collectionneur'
  | 'reinvention'
  | 'nouveau_visage'
  | 'mon_histoire'
  // Défi Journalier — séries
  | 'daily_premier_defi'
  | 'daily_serie_3'
  | 'daily_semaine_de_feu'
  | 'daily_quinzaine'
  | 'daily_mois_de_fer'
  | 'daily_centenaire'
  // Défi Journalier — scores
  | 'daily_score_parfait'
  | 'daily_sniper'
  | 'daily_infaillible'
  | 'daily_podium'
  | 'daily_roi_du_jour'

export interface Achievement {
  id: AchievementId
  name: string
  description: string
  icon: string  // emoji unicode
  progressTotal: number | null  // null = pas de progression trackable
  tier: AchievementTier
}

export interface UserAchievement {
  achievement_id: AchievementId
  unlocked_at: string  // ISO timestamp
}

export interface AchievementWithStatus extends Achievement {
  unlocked: boolean
  unlocked_at: string | null
  progress: { current: number; total: number } | null
}

// ─── Daily Challenge ───────────────────────────────────────────────────────────

export interface DailyTheme {
  date: string          // 'YYYY-MM-DD'
  title: string
  emoji: string
  description: string | null
  category_tags: string[]
}

export interface DailyEntry {
  id: string
  user_id: string
  date: string
  score: number         // speed-based points (anciennement 0–10 bonnes réponses)
  correct_answers: number
  xp_earned: number
  multiplier: number
  streak_day: number
  completed_at: string
  recap_seen: boolean
  question_results: QuestionResult[]
}

export interface DailyStreak {
  user_id: string
  current_streak: number
  longest_streak: number
  last_played_date: string | null
}

export interface DailyLeaderboardEntry {
  id: string
  user_id: string
  username: string
  score: number
  xp_earned: number
  multiplier: number
  streak_day: number
  completed_at: string
  rank: number
  featured_badges: string[]
}

export interface DailyRecapData {
  entry:                DailyEntry
  theme:                DailyTheme | null
  questions:            QuestionResult[]
  rank:                 number | null
  totalPlayers:         number
  topThree:             DailyLeaderboardEntry[]
  streak:               DailyStreak
  unlockedAchievements: AchievementWithStatus[]
  pulsesEarned:         number
  totalXpNow:           number
}
