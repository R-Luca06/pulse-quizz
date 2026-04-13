-- ═══════════════════════════════════════════════════════════════════════════════
-- Pulse Quizz — Schéma complet Supabase
-- ═══════════════════════════════════════════════════════════════════════════════
--
-- Source de vérité pour toute la base de données.
-- Remplace scripts/supabase_questions.sql (qui ne couvrait que la table questions).
--
-- Exécution :
--   Supabase Dashboard → SQL Editor → New query → coller ce fichier → Run
--   OU via la CLI : supabase db push (si migration configurée)
--
-- Ordre : respecter l'ordre du fichier (dépendances FK).
--
-- Tables :
--   1. profiles              — profils utilisateurs (lié à auth.users)
--   2. questions             — banque de questions de quiz
--   3. leaderboard           — classements (normal + compétitif)
--   4. user_stats            — stats par catégorie / mode / difficulté
--   5. user_global_stats     — totaux agrégés par utilisateur
--   6. user_achievements     — achievements débloqués
--
-- Fonctions RPC :
--   - get_random_questions   — sélection aléatoire de N questions
--   - delete_user            — suppression complète du compte
--
-- ═══════════════════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────────────────────
-- 1. profiles
-- ─────────────────────────────────────────────────────────────────────────────
-- Créé lors de l'inscription (AuthContext.signUp).
-- Le username est affiché dans le leaderboard (dénormalisé dans leaderboard.username
-- pour éviter les JOINs en lecture).

CREATE TABLE IF NOT EXISTS profiles (
  id         uuid        PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  username   text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),

  -- Unicité insensible à la casse (vérifié aussi côté app dans profile.ts)
  CONSTRAINT profiles_username_unique UNIQUE (username)
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Lecture publique (affichage leaderboard, vérification unicité username)
CREATE POLICY "profiles_select_public"
  ON profiles FOR SELECT
  USING (true);

-- Insertion : uniquement son propre profil
CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Modification : uniquement son propre profil
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. questions
-- ─────────────────────────────────────────────────────────────────────────────
-- Banque de questions importée via scripts/import-openquizzdb.mjs
-- ou scripts/import-custom.mjs. Lecture seule depuis le client.

CREATE TABLE IF NOT EXISTS questions (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  language          text        NOT NULL,                                     -- 'fr' (futur : 'en')
  category          text        NOT NULL,                                     -- ex: 'Géographie', 'Histoire'
  difficulty        text        NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  question          text        NOT NULL,
  correct_answer    text        NOT NULL,
  incorrect_answers text[]      NOT NULL,                                     -- 3 mauvaises réponses
  anecdote          text,                                                     -- explication (future learning mode)
  source            text        NOT NULL DEFAULT 'openquizzdb',
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- Requêtes filtrées par langue + difficulté (get_random_questions)
CREATE INDEX IF NOT EXISTS idx_questions_lang_diff
  ON questions (language, difficulty);

-- Requêtes filtrées par langue + catégorie
CREATE INDEX IF NOT EXISTS idx_questions_lang_cat
  ON questions (language, category);

ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- Lecture publique, écriture interdite depuis le client
CREATE POLICY "questions_read_public"
  ON questions FOR SELECT
  USING (true);


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. leaderboard
-- ─────────────────────────────────────────────────────────────────────────────
-- Stocke le meilleur score de chaque utilisateur par configuration de jeu.
--
-- Mode normal     : une entrée par (user_id, 'normal', difficulty, language)
-- Mode compétitif : une entrée par (user_id, 'compétitif', 'mixed', language)
--
-- Le username est dénormalisé pour les lectures du classement.
-- Il est synchronisé dans profile.ts lors d'un changement de pseudo.

CREATE TABLE IF NOT EXISTS leaderboard (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  username   text        NOT NULL,
  score      integer     NOT NULL DEFAULT 0,
  mode       text        NOT NULL,                                            -- 'normal' | 'compétitif'
  difficulty text        NOT NULL,                                            -- 'easy' | 'medium' | 'hard' | 'mixed'
  language   text        NOT NULL DEFAULT 'fr',
  game_data  jsonb,                                                           -- détail des réponses (compétitif)
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- Une seule entrée par utilisateur / mode / difficulté / langue
  CONSTRAINT leaderboard_user_mode_unique UNIQUE (user_id, mode, difficulty, language)
);

-- Classement compétitif : filtre mode + language, tri par score DESC
CREATE INDEX IF NOT EXISTS idx_leaderboard_comp
  ON leaderboard (mode, language, score DESC)
  WHERE mode = 'compétitif';

-- Classement normal : filtre mode + difficulty, tri par score DESC
CREATE INDEX IF NOT EXISTS idx_leaderboard_normal
  ON leaderboard (mode, difficulty, score DESC)
  WHERE mode != 'compétitif';

-- Lookup rapide par utilisateur (submitScore, getUserBestScore)
CREATE INDEX IF NOT EXISTS idx_leaderboard_user
  ON leaderboard (user_id, mode);

ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

-- Lecture publique (le classement est visible par tous)
CREATE POLICY "leaderboard_select_public"
  ON leaderboard FOR SELECT
  USING (true);

-- Insertion : uniquement ses propres scores
-- ⚠️ Garantie serveur NFR9 (Pulse Quizz PRD) : blocage du mode compétitif pour
-- les anonymes. auth.uid() renvoie NULL pour un client non-authentifié, donc
-- le WITH CHECK échoue → INSERT rejeté (erreur PostgreSQL 42501).
-- Ne pas assouplir sans revalidation sécurité.
CREATE POLICY "leaderboard_insert_own"
  ON leaderboard FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Modification : uniquement ses propres scores
CREATE POLICY "leaderboard_update_own"
  ON leaderboard FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- 4. user_stats (stats par catégorie / mode / difficulté)
-- ─────────────────────────────────────────────────────────────────────────────
-- Incrémenté après chaque partie via cloudStats.incrementCategoryStats().
-- Clé composite = une ligne par combinaison (user, mode, difficulty, category).

CREATE TABLE IF NOT EXISTS user_stats (
  user_id         uuid        NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  mode            text        NOT NULL,                                       -- 'normal' | 'compétitif'
  difficulty      text        NOT NULL,                                       -- 'easy' | 'medium' | 'hard' | 'mixed'
  category        text        NOT NULL,                                       -- 'all' | nom de catégorie
  games_played    integer     NOT NULL DEFAULT 0,
  total_questions integer     NOT NULL DEFAULT 0,
  total_correct   integer     NOT NULL DEFAULT 0,
  total_time      real        NOT NULL DEFAULT 0,                             -- somme des temps de réponse (secondes)
  best_score      integer     NOT NULL DEFAULT 0,
  best_streak     integer     NOT NULL DEFAULT 0,
  fastest_perfect real,                                                       -- meilleur temps pour un 10/10 (null si jamais)
  updated_at      timestamptz NOT NULL DEFAULT now(),

  PRIMARY KEY (user_id, mode, difficulty, category)
);

ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

-- Un utilisateur ne voit et ne modifie que ses propres stats
CREATE POLICY "user_stats_select_own"
  ON user_stats FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "user_stats_insert_own"
  ON user_stats FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_stats_update_own"
  ON user_stats FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- 5. user_global_stats (totaux agrégés par utilisateur)
-- ─────────────────────────────────────────────────────────────────────────────
-- Incrémenté après chaque partie via cloudStats.incrementGlobalStats().
-- Une seule ligne par utilisateur.

CREATE TABLE IF NOT EXISTS user_global_stats (
  user_id          uuid        PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  games_played     integer     NOT NULL DEFAULT 0,
  total_questions  integer     NOT NULL DEFAULT 0,
  total_correct    integer     NOT NULL DEFAULT 0,
  best_streak      integer     NOT NULL DEFAULT 0,
  fastest_perfect  real,                                                      -- meilleur temps pour un 10/10 (null si jamais)
  comp_total_score integer     NOT NULL DEFAULT 0,                            -- score cumulé compétitif (toutes parties)
  updated_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE user_global_stats ENABLE ROW LEVEL SECURITY;

-- Un utilisateur ne voit et ne modifie que ses propres stats globales
CREATE POLICY "user_global_stats_select_own"
  ON user_global_stats FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "user_global_stats_insert_own"
  ON user_global_stats FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_global_stats_update_own"
  ON user_global_stats FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- 6. user_achievements
-- ─────────────────────────────────────────────────────────────────────────────
-- Inséré via achievements.checkAndUnlockAchievements().
-- Upsert avec ignoreDuplicates pour éviter les doublons en race condition.
--
-- Achievements définis côté client dans constants/achievements.ts :
--   premiers_pas       — créer son compte
--   premier_competiteur — terminer une partie compétitive
--   serie_de_feu       — 10 bonnes réponses d'affilée
--   perfectionniste    — score parfait 10/10 en normal
--   centenaire         — 100 parties jouées (tous modes)

CREATE TABLE IF NOT EXISTS user_achievements (
  user_id        uuid        NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  achievement_id text        NOT NULL,
  unlocked_at    timestamptz NOT NULL DEFAULT now(),

  PRIMARY KEY (user_id, achievement_id)
);

ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Un utilisateur ne voit que ses propres achievements
CREATE POLICY "user_achievements_select_own"
  ON user_achievements FOR SELECT
  USING (auth.uid() = user_id);

-- Un utilisateur ne peut débloquer que ses propres achievements
CREATE POLICY "user_achievements_insert_own"
  ON user_achievements FOR INSERT
  WITH CHECK (auth.uid() = user_id);


-- ═══════════════════════════════════════════════════════════════════════════════
-- Fonctions RPC
-- ═══════════════════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────────────────────
-- get_random_questions
-- ─────────────────────────────────────────────────────────────────────────────
-- Appelée par api.ts pour chaque partie.
-- Filtre par langue, difficulté (ou 'mixed' = toutes), catégorie (ou 'all').
-- Retourne N questions dans un ordre aléatoire.

CREATE OR REPLACE FUNCTION get_random_questions(
  p_language   text,
  p_difficulty text    DEFAULT 'mixed',
  p_category   text    DEFAULT 'all',
  p_limit      integer DEFAULT 10
)
RETURNS TABLE (
  id                uuid,
  language          text,
  category          text,
  difficulty        text,
  question          text,
  correct_answer    text,
  incorrect_answers text[],
  anecdote          text
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    id, language, category, difficulty,
    question, correct_answer, incorrect_answers, anecdote
  FROM questions
  WHERE language = p_language
    AND (p_difficulty = 'mixed' OR difficulty = p_difficulty)
    AND (p_category   = 'all'   OR category   = p_category)
  ORDER BY RANDOM()
  LIMIT p_limit;
$$;


-- ─────────────────────────────────────────────────────────────────────────────
-- delete_user
-- ─────────────────────────────────────────────────────────────────────────────
-- Appelée par profile.ts pour la suppression de compte.
--
-- SECURITY DEFINER : s'exécute avec les droits du propriétaire (postgres),
-- nécessaire pour supprimer dans auth.users.
-- search_path verrouillé pour éviter les injections de schéma.
--
-- Les FK ON DELETE CASCADE s'occupent des tables enfants,
-- mais on supprime explicitement d'abord pour être déterministe
-- et ne pas dépendre de l'ordre de cascade.

CREATE OR REPLACE FUNCTION delete_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Suppression explicite (enfants d'abord, respect des FK)
  DELETE FROM user_achievements  WHERE user_id = uid;
  DELETE FROM user_stats         WHERE user_id = uid;
  DELETE FROM user_global_stats  WHERE user_id = uid;
  DELETE FROM leaderboard        WHERE user_id = uid;
  DELETE FROM profiles           WHERE id      = uid;

  -- Suppression du compte auth
  DELETE FROM auth.users         WHERE id      = uid;
END;
$$;

-- Restreindre l'accès : seuls les utilisateurs connectés peuvent appeler delete_user
REVOKE ALL ON FUNCTION delete_user() FROM public, anon;
GRANT EXECUTE ON FUNCTION delete_user() TO authenticated;
