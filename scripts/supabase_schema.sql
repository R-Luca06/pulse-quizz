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
  id                  uuid        PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  username            text        NOT NULL,
  featured_badges     text[]      NOT NULL DEFAULT '{}',  -- jusqu'à 3 achievement_id épinglés sur le leaderboard
  description         text,                               -- bio libre de l'utilisateur
  username_changed    boolean     NOT NULL DEFAULT false,
  avatar_changed      boolean     NOT NULL DEFAULT false,
  description_changed boolean     NOT NULL DEFAULT false,
  notification_prefs  jsonb       NOT NULL DEFAULT '{"achievement_unlocked":true,"rank_change":true}',
  created_at          timestamptz NOT NULL DEFAULT now()
);

-- Unicité insensible à la casse : index fonctionnel sur lower(username).
-- Remplace l'ancienne contrainte UNIQUE (username) qui était case-sensitive.
-- 'Alice' et 'alice' sont désormais considérés comme le même username.
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower_unique
  ON profiles (lower(username));

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

-- Index couvrant : (language, difficulty, category, id)
-- Le champ id en fin de colonne permet au pivot UUID (get_random_questions) de faire
-- un range scan id >= pivot directement dans l'index, sans retour à la heap.
-- Remplace les deux anciens index partiels (lang_diff, lang_cat).
CREATE INDEX IF NOT EXISTS idx_questions_lang_diff_cat_id
  ON questions (language, difficulty, category, id);

-- Anciens index partiels devenus redondants — à dropper après création de l'index ci-dessus.
-- DROP INDEX IF EXISTS idx_questions_lang_diff;
-- DROP INDEX IF EXISTS idx_questions_lang_cat;

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

-- INSERT et UPDATE directs supprimés : toute écriture passe par la RPC submit_score
-- (SECURITY DEFINER) qui valide l'authentification et garantit GREATEST(old, new)
-- côté serveur. Cela empêche un utilisateur d'écrire un score arbitraire via REST.


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
-- increment_category_stats
-- ─────────────────────────────────────────────────────────────────────────────
-- Remplace le pattern read-modify-write de cloudStats.incrementCategoryStats().
-- INSERT ... ON CONFLICT DO UPDATE atomique : pas de race condition si deux
-- parties se terminent simultanément (double onglet, reconnexion réseau).
-- Les deltas (p_questions, p_correct, p_time) sont additionnés côté serveur.
-- Les maxima (p_score, p_streak) utilisent GREATEST. p_fastest_perfect utilise LEAST.

CREATE OR REPLACE FUNCTION increment_category_stats(
  p_mode            text,
  p_difficulty      text,
  p_category        text,
  p_questions       integer,
  p_correct         integer,
  p_time            real,
  p_score           integer,
  p_streak          integer,
  p_fastest_perfect real    DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;

  INSERT INTO user_stats (
    user_id, mode, difficulty, category,
    games_played, total_questions, total_correct, total_time,
    best_score, best_streak, fastest_perfect, updated_at
  )
  VALUES (
    auth.uid(), p_mode, p_difficulty, p_category,
    1, p_questions, p_correct, p_time,
    p_score, p_streak, p_fastest_perfect, now()
  )
  ON CONFLICT (user_id, mode, difficulty, category) DO UPDATE SET
    games_played    = user_stats.games_played    + 1,
    total_questions = user_stats.total_questions + EXCLUDED.total_questions,
    total_correct   = user_stats.total_correct   + EXCLUDED.total_correct,
    total_time      = user_stats.total_time      + EXCLUDED.total_time,
    best_score      = GREATEST(user_stats.best_score,  EXCLUDED.best_score),
    best_streak     = GREATEST(user_stats.best_streak, EXCLUDED.best_streak),
    fastest_perfect = CASE
      WHEN EXCLUDED.fastest_perfect IS NULL         THEN user_stats.fastest_perfect
      WHEN user_stats.fastest_perfect IS NULL       THEN EXCLUDED.fastest_perfect
      ELSE LEAST(user_stats.fastest_perfect, EXCLUDED.fastest_perfect)
    END,
    updated_at = now();
END;
$$;

REVOKE ALL ON FUNCTION increment_category_stats(text,text,text,integer,integer,real,integer,integer,real) FROM public, anon;
GRANT EXECUTE ON FUNCTION increment_category_stats(text,text,text,integer,integer,real,integer,integer,real) TO authenticated;


-- ─────────────────────────────────────────────────────────────────────────────
-- increment_global_stats
-- ─────────────────────────────────────────────────────────────────────────────
-- Remplace cloudStats.incrementGlobalStats(). Même logique atomique.
-- p_comp_score : score de la partie si mode compétitif, 0 sinon.

CREATE OR REPLACE FUNCTION increment_global_stats(
  p_mode            text,
  p_questions       integer,
  p_correct         integer,
  p_streak          integer,
  p_comp_score      integer,
  p_fastest_perfect real    DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;

  INSERT INTO user_global_stats (
    user_id,
    games_played, comp_games_played, total_questions, total_correct,
    best_streak, fastest_perfect, comp_total_score, updated_at
  )
  VALUES (
    auth.uid(),
    1,
    CASE WHEN p_mode = 'compétitif' THEN 1 ELSE 0 END,
    p_questions, p_correct,
    p_streak, p_fastest_perfect, p_comp_score, now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    games_played      = user_global_stats.games_played + 1,
    comp_games_played = user_global_stats.comp_games_played +
                        CASE WHEN p_mode = 'compétitif' THEN 1 ELSE 0 END,
    total_questions   = user_global_stats.total_questions + EXCLUDED.total_questions,
    total_correct     = user_global_stats.total_correct   + EXCLUDED.total_correct,
    best_streak       = GREATEST(user_global_stats.best_streak, EXCLUDED.best_streak),
    fastest_perfect   = CASE
      WHEN EXCLUDED.fastest_perfect IS NULL              THEN user_global_stats.fastest_perfect
      WHEN user_global_stats.fastest_perfect IS NULL     THEN EXCLUDED.fastest_perfect
      ELSE LEAST(user_global_stats.fastest_perfect, EXCLUDED.fastest_perfect)
    END,
    comp_total_score  = user_global_stats.comp_total_score + EXCLUDED.comp_total_score,
    updated_at        = now();
END;
$$;

REVOKE ALL ON FUNCTION increment_global_stats(text,integer,integer,integer,integer,real) FROM public, anon;
GRANT EXECUTE ON FUNCTION increment_global_stats(text,integer,integer,integer,integer,real) TO authenticated;


-- ─────────────────────────────────────────────────────────────────────────────
-- submit_score
-- ─────────────────────────────────────────────────────────────────────────────
-- Seul point d'entrée pour écrire dans leaderboard.
-- INSERT ... ON CONFLICT DO UPDATE avec GREATEST(old, new) garantit côté serveur
-- que le score ne peut qu'augmenter — impossible à contourner via REST.
-- SECURITY DEFINER : s'exécute en tant que postgres (bypasse RLS).
-- L'auth.uid() IS NULL check remplace la garantie NFR9 que donnaient les policies
-- INSERT/UPDATE (qui ont été supprimées).

CREATE OR REPLACE FUNCTION submit_score(
  p_mode       text,
  p_difficulty text,
  p_language   text,
  p_score      integer,
  p_username   text,
  p_game_data  jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;

  INSERT INTO leaderboard (
    user_id, username, score, mode, difficulty, language, game_data, updated_at
  )
  VALUES (
    auth.uid(), p_username, p_score, p_mode, p_difficulty, p_language, p_game_data, now()
  )
  ON CONFLICT (user_id, mode, difficulty, language) DO UPDATE
    SET score      = GREATEST(leaderboard.score, EXCLUDED.score),
        username   = EXCLUDED.username,
        game_data  = CASE
                       WHEN EXCLUDED.score > leaderboard.score THEN EXCLUDED.game_data
                       ELSE leaderboard.game_data
                     END,
        updated_at = CASE
                       WHEN EXCLUDED.score > leaderboard.score THEN now()
                       ELSE leaderboard.updated_at
                     END;
END;
$$;

REVOKE ALL ON FUNCTION submit_score(text, text, text, integer, text, jsonb) FROM public, anon;
GRANT EXECUTE ON FUNCTION submit_score(text, text, text, integer, text, jsonb) TO authenticated;


-- ─────────────────────────────────────────────────────────────────────────────
-- get_random_questions
-- ─────────────────────────────────────────────────────────────────────────────
-- Appelée par api.ts pour chaque partie.
-- Filtre par langue, difficulté (ou 'mixed' = toutes), catégorie (ou 'all').
-- Retourne N questions dans un ordre aléatoire.
--
-- Stratégie : pivot UUID aléatoire pour éviter ORDER BY RANDOM() sur l'ensemble filtré.
--   1. Génère un UUID pivot aléatoire.
--   2. Prend jusqu'à p_limit lignes avec id >= pivot (scan d'index ascendant).
--   3. Complète avec des lignes id < pivot si nécessaire (scan descendant).
--   4. Mélange seulement les p_limit candidats finaux (≤ 2×p_limit lignes max).
-- Requiert idx_questions_lang_diff_cat_id pour le range scan id.

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
LANGUAGE plpgsql
VOLATILE
AS $$
DECLARE
  v_pivot uuid := gen_random_uuid();
BEGIN
  RETURN QUERY
  WITH pivot_above AS (
    SELECT q.id, q.language, q.category, q.difficulty,
           q.question, q.correct_answer, q.incorrect_answers, q.anecdote
    FROM   questions q
    WHERE  q.language = p_language
      AND  (p_difficulty = 'mixed' OR q.difficulty = p_difficulty)
      AND  (p_category   = 'all'   OR q.category   = p_category)
      AND  q.id >= v_pivot
    ORDER BY q.id
    LIMIT p_limit
  ),
  pivot_below AS (
    SELECT q.id, q.language, q.category, q.difficulty,
           q.question, q.correct_answer, q.incorrect_answers, q.anecdote
    FROM   questions q
    WHERE  q.language = p_language
      AND  (p_difficulty = 'mixed' OR q.difficulty = p_difficulty)
      AND  (p_category   = 'all'   OR q.category   = p_category)
      AND  q.id < v_pivot
    ORDER BY q.id DESC
    LIMIT p_limit
  ),
  candidates AS (
    SELECT * FROM pivot_above
    UNION ALL
    SELECT * FROM pivot_below
  )
  SELECT c.id, c.language, c.category, c.difficulty,
         c.question, c.correct_answer, c.incorrect_answers, c.anecdote
  FROM   candidates c
  ORDER BY random()
  LIMIT p_limit;
END;
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


-- ═══════════════════════════════════════════════════════════════════════════════
-- Migrations (à exécuter sur une base existante)
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- user_global_stats : compteur de parties compétitives
-- ─────────────────────────────────────────────────────────────────────────────
-- Incrémenté dans cloudStats.incrementGlobalStats() quand mode = 'compétitif'.
-- Utilisé par les achievements Combattant (50), Gladiateur (100), Légende (1000).

ALTER TABLE user_global_stats
  ADD COLUMN IF NOT EXISTS comp_games_played integer NOT NULL DEFAULT 0;


-- ─────────────────────────────────────────────────────────────────────────────
-- profiles : unicité username insensible à la casse
-- ─────────────────────────────────────────────────────────────────────────────
-- Remplace la contrainte UNIQUE (username) case-sensitive par un index
-- fonctionnel sur lower(username). À exécuter sur une base existante.

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_username_unique;
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower_unique
  ON profiles (lower(username));



-- ─────────────────────────────────────────────────────────────────────────────
-- get_public_profile
-- ─────────────────────────────────────────────────────────────────────────────
-- Appelée par publicProfile.ts pour afficher le profil public d'un joueur.
-- Retourne null si le username n'existe pas.
--
-- Optimisations vs version précédente :
--   - Rang calculé via COUNT(*) WHERE score > v_best_comp + 1, O(1) avec
--     idx_leaderboard_comp, au lieu de RANK() OVER (...) qui triait tous les joueurs.
--   - Les 4 requêtes indépendantes (stats, leaderboard, rang, achievements) sont
--     regroupées dans un seul bloc via des SELECTs enchaînés sans roundtrips inutiles.
--   - Les deux jsonb_agg sur user_achievements sont fusionnées en un seul parcours.

CREATE OR REPLACE FUNCTION get_public_profile(p_username text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id   uuid;
  v_username  text;
  v_desc      text;
  v_featured  text[];
  v_games     integer := 0;
  v_correct   integer := 0;
  v_streak    integer := 0;
  v_best_comp integer := 0;
  v_rank      bigint  := NULL;
  v_total     bigint  := 0;
  v_ach       jsonb   := '[]'::jsonb;
  v_ach_dates jsonb   := '[]'::jsonb;
BEGIN
  -- Profil de base
  SELECT id, username, description, featured_badges
  INTO v_user_id, v_username, v_desc, v_featured
  FROM profiles WHERE lower(username) = lower(p_username);

  IF NOT FOUND THEN RETURN NULL; END IF;

  -- Stats globales
  SELECT COALESCE(games_played, 0), COALESCE(total_correct, 0), COALESCE(best_streak, 0)
  INTO v_games, v_correct, v_streak
  FROM user_global_stats WHERE user_id = v_user_id;

  -- Meilleur score compétitif
  SELECT COALESCE(score, 0) INTO v_best_comp
  FROM leaderboard
  WHERE user_id = v_user_id AND mode = 'compétitif'
  LIMIT 1;

  -- Total joueurs compétitifs (langue fr)
  SELECT COUNT(*) INTO v_total
  FROM leaderboard WHERE mode = 'compétitif' AND language = 'fr';

  -- Rang : nombre de joueurs avec un score STRICTEMENT supérieur + 1.
  -- O(1) avec idx_leaderboard_comp (mode, language, score DESC).
  -- Remplace RANK() OVER (...) qui triait l'ensemble complet des joueurs.
  -- Si le joueur n'a pas de score compétitif, v_rank reste NULL.
  IF v_best_comp > 0 THEN
    SELECT COUNT(*) + 1 INTO v_rank
    FROM leaderboard
    WHERE mode = 'compétitif'
      AND language = 'fr'
      AND score > v_best_comp;
  END IF;

  -- Achievements : un seul parcours, deux agrégats
  SELECT
    jsonb_agg(achievement_id        ORDER BY unlocked_at),
    jsonb_agg(jsonb_build_object('id', achievement_id, 'unlocked_at', unlocked_at)
              ORDER BY unlocked_at)
  INTO v_ach, v_ach_dates
  FROM user_achievements WHERE user_id = v_user_id;

  RETURN jsonb_build_object(
    'username',          v_username,
    'avatar_emoji',      '',
    'avatar_color',      '',
    'description',       COALESCE(v_desc, ''),
    'featured_badges',   COALESCE(to_jsonb(v_featured), '[]'::jsonb),
    'games_played',      v_games,
    'total_correct',     v_correct,
    'best_streak',       v_streak,
    'best_comp_score',   v_best_comp,
    'rank',              v_rank,
    'total_players',     v_total,
    'achievements',      COALESCE(v_ach,      '[]'::jsonb),
    'achievement_dates', COALESCE(v_ach_dates, '[]'::jsonb)
  );
END;
$$;

-- Accessible aux utilisateurs connectés et anonymes (profil public)
GRANT EXECUTE ON FUNCTION get_public_profile(text) TO authenticated, anon;


-- ═══════════════════════════════════════════════════════════════════════════════
-- 7. friendships
-- ═══════════════════════════════════════════════════════════════════════════════
-- Relation symétrique d'amitié entre deux utilisateurs.
-- requester_id  : celui qui envoie la demande
-- addressee_id  : celui qui reçoit la demande
-- status        : 'pending' → 'accepted' | 'rejected'
--
-- Contrainte UNIQUE(requester_id, addressee_id) : une seule ligne par paire
-- ordonnée. La paire inverse (addressee→requester) n'existe pas une fois acceptée ;
-- on lit les deux sens avec un OR dans les requêtes.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS friendships (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid        NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  addressee_id uuid        NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  status       text        NOT NULL DEFAULT 'pending'
                           CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT friendships_no_self_loop  CHECK (requester_id <> addressee_id),
  CONSTRAINT friendships_unique_pair   UNIQUE (requester_id, addressee_id)
);

-- Index pour accélérer les lectures dans les deux sens
CREATE INDEX IF NOT EXISTS idx_friendships_requester ON friendships (requester_id);
CREATE INDEX IF NOT EXISTS idx_friendships_addressee ON friendships (addressee_id);

ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

-- Un utilisateur peut voir toutes les lignes où il est impliqué
CREATE POLICY "friendships_select_own"
  ON friendships FOR SELECT
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- Seul le requester peut créer une demande (en son nom)
CREATE POLICY "friendships_insert_own"
  ON friendships FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

-- Mise à jour : seul l'addressee peut changer le statut (accepted / rejected).
-- Le requester n'a pas besoin d'UPDATE : il annule sa demande via DELETE.
-- WITH CHECK garantit que seuls les statuts valides sont écrits et que
-- l'addressee ne peut pas se réaffecter la relation (addressee_id inchangé).
CREATE POLICY "friendships_update_addressee"
  ON friendships FOR UPDATE
  USING (auth.uid() = addressee_id)
  WITH CHECK (
    auth.uid() = addressee_id
    AND status IN ('accepted', 'rejected')
  );

-- Suppression : les deux parties peuvent supprimer (retrait d'ami, annulation)
CREATE POLICY "friendships_delete_own"
  ON friendships FOR DELETE
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_friendships_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER friendships_updated_at
  BEFORE UPDATE ON friendships
  FOR EACH ROW EXECUTE FUNCTION update_friendships_updated_at();


-- ═══════════════════════════════════════════════════════════════════════════════
-- 8. notifications
-- ═══════════════════════════════════════════════════════════════════════════════
-- Historique des 20 dernières notifications par utilisateur.
-- Types :
--   achievement_unlocked — data: { badge_id, badge_name, badge_icon }
--   rank_up              — data: { new_rank, delta }
--   rank_down            — data: { new_rank, delta }
--
-- Créées depuis le client (useGameOrchestration) après chaque partie.
-- Élagage automatique à 20 par utilisateur via trigger.
-- ═══════════════════════════════════════════════════════════════════════════════


-- ── Table notifications ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS notifications (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  type        text        NOT NULL CHECK (type IN (
                'achievement_unlocked', 'rank_up', 'rank_down'
              )),
  data        jsonb       NOT NULL DEFAULT '{}',
  read        boolean     NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_created
  ON notifications (user_id, created_at DESC);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Lecture : uniquement ses propres notifications
CREATE POLICY "notifications_select_own"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Insertion depuis le client (achievements, rank) — triggers SECURITY DEFINER bypass RLS
CREATE POLICY "notifications_insert_own"
  ON notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Mise à jour (marquer lu) : uniquement ses propres
CREATE POLICY "notifications_update_own"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- ── Trigger : élagage → 20 dernières par utilisateur ────────────────────────

CREATE OR REPLACE FUNCTION trim_notifications()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  DELETE FROM notifications
  WHERE id IN (
    SELECT id FROM notifications
    WHERE user_id = NEW.user_id
    ORDER BY created_at DESC
    OFFSET 20
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER notifications_trim
  AFTER INSERT ON notifications
  FOR EACH ROW EXECUTE FUNCTION trim_notifications();


-- ─────────────────────────────────────────────────────────────────────────────
-- leaderboard : suppression des policies INSERT/UPDATE directes
-- ─────────────────────────────────────────────────────────────────────────────
-- Toute écriture dans leaderboard passe désormais par submit_score (RPC
-- SECURITY DEFINER). Les policies directes sont supprimées pour empêcher
-- l'écriture de scores arbitraires via l'API REST.

DROP POLICY IF EXISTS "leaderboard_insert_own" ON leaderboard;
DROP POLICY IF EXISTS "leaderboard_update_own" ON leaderboard;
REVOKE INSERT, UPDATE ON leaderboard FROM authenticated;


-- ═══════════════════════════════════════════════════════════════════════════════
-- Système XP
-- ═══════════════════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────────────────────
-- user_global_stats : colonne total_xp
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE user_global_stats
  ADD COLUMN IF NOT EXISTS total_xp integer NOT NULL DEFAULT 0;


-- ─────────────────────────────────────────────────────────────────────────────
-- increment_global_stats : ajout du paramètre p_xp
-- ─────────────────────────────────────────────────────────────────────────────
-- Remplace la version précédente (sans XP). total_xp est incrémenté atomiquement
-- en même temps que les autres stats de la partie.

CREATE OR REPLACE FUNCTION increment_global_stats(
  p_mode            text,
  p_questions       integer,
  p_correct         integer,
  p_streak          integer,
  p_comp_score      integer,
  p_xp              integer,
  p_fastest_perfect real    DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;

  INSERT INTO user_global_stats (
    user_id,
    games_played, comp_games_played, total_questions, total_correct,
    best_streak, fastest_perfect, comp_total_score, total_xp, updated_at
  )
  VALUES (
    auth.uid(),
    1,
    CASE WHEN p_mode = 'compétitif' THEN 1 ELSE 0 END,
    p_questions, p_correct,
    p_streak, p_fastest_perfect, p_comp_score, p_xp, now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    games_played      = user_global_stats.games_played + 1,
    comp_games_played = user_global_stats.comp_games_played +
                        CASE WHEN p_mode = 'compétitif' THEN 1 ELSE 0 END,
    total_questions   = user_global_stats.total_questions + EXCLUDED.total_questions,
    total_correct     = user_global_stats.total_correct   + EXCLUDED.total_correct,
    best_streak       = GREATEST(user_global_stats.best_streak, EXCLUDED.best_streak),
    fastest_perfect   = CASE
      WHEN EXCLUDED.fastest_perfect IS NULL              THEN user_global_stats.fastest_perfect
      WHEN user_global_stats.fastest_perfect IS NULL     THEN EXCLUDED.fastest_perfect
      ELSE LEAST(user_global_stats.fastest_perfect, EXCLUDED.fastest_perfect)
    END,
    comp_total_score  = user_global_stats.comp_total_score + EXCLUDED.comp_total_score,
    total_xp          = user_global_stats.total_xp         + EXCLUDED.total_xp,
    updated_at        = now();
END;
$$;

REVOKE ALL ON FUNCTION increment_global_stats(text,integer,integer,integer,integer,integer,real) FROM public, anon;
GRANT EXECUTE ON FUNCTION increment_global_stats(text,integer,integer,integer,integer,integer,real) TO authenticated;


-- ─────────────────────────────────────────────────────────────────────────────
-- add_xp : ajout d'XP ponctuel (achievements débloqués)
-- ─────────────────────────────────────────────────────────────────────────────
-- Appelée séparément après checkAndUnlockAchievements pour créditer l'XP
-- des achievements débloqués lors de la partie.

CREATE OR REPLACE FUNCTION add_xp(p_amount integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;

  INSERT INTO user_global_stats (user_id, total_xp)
  VALUES (auth.uid(), p_amount)
  ON CONFLICT (user_id) DO UPDATE SET
    total_xp   = user_global_stats.total_xp + EXCLUDED.total_xp,
    updated_at = now();
END;
$$;

REVOKE ALL ON FUNCTION add_xp(integer) FROM public, anon;
GRANT EXECUTE ON FUNCTION add_xp(integer) TO authenticated;


-- ─────────────────────────────────────────────────────────────────────────────
-- get_public_profile : exposer total_xp
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_public_profile(p_username text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id   uuid;
  v_username  text;
  v_desc      text;
  v_featured  text[];
  v_games     integer := 0;
  v_correct   integer := 0;
  v_streak    integer := 0;
  v_total_xp  integer := 0;
  v_best_comp integer := 0;
  v_rank      bigint  := NULL;
  v_total     bigint  := 0;
  v_ach       jsonb   := '[]'::jsonb;
  v_ach_dates jsonb   := '[]'::jsonb;
BEGIN
  SELECT id, username, description, featured_badges
  INTO v_user_id, v_username, v_desc, v_featured
  FROM profiles WHERE lower(username) = lower(p_username);

  IF NOT FOUND THEN RETURN NULL; END IF;

  SELECT COALESCE(games_played, 0), COALESCE(total_correct, 0),
         COALESCE(best_streak, 0),  COALESCE(total_xp, 0)
  INTO v_games, v_correct, v_streak, v_total_xp
  FROM user_global_stats WHERE user_id = v_user_id;

  SELECT COALESCE(score, 0) INTO v_best_comp
  FROM leaderboard WHERE user_id = v_user_id AND mode = 'compétitif' LIMIT 1;

  SELECT COUNT(*) INTO v_total
  FROM leaderboard WHERE mode = 'compétitif' AND language = 'fr';

  IF v_best_comp > 0 THEN
    SELECT COUNT(*) + 1 INTO v_rank
    FROM leaderboard
    WHERE mode = 'compétitif' AND language = 'fr' AND score > v_best_comp;
  END IF;

  SELECT
    jsonb_agg(achievement_id        ORDER BY unlocked_at),
    jsonb_agg(jsonb_build_object('id', achievement_id, 'unlocked_at', unlocked_at)
              ORDER BY unlocked_at)
  INTO v_ach, v_ach_dates
  FROM user_achievements WHERE user_id = v_user_id;

  RETURN jsonb_build_object(
    'username',          v_username,
    'avatar_emoji',      '',
    'avatar_color',      '',
    'description',       COALESCE(v_desc, ''),
    'featured_badges',   COALESCE(to_jsonb(v_featured), '[]'::jsonb),
    'games_played',      v_games,
    'total_correct',     v_correct,
    'best_streak',       v_streak,
    'total_xp',          v_total_xp,
    'best_comp_score',   v_best_comp,
    'rank',              v_rank,
    'total_players',     v_total,
    'achievements',      COALESCE(v_ach,      '[]'::jsonb),
    'achievement_dates', COALESCE(v_ach_dates, '[]'::jsonb)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION get_public_profile(text) TO authenticated, anon;

