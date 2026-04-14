-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 001 — Profil public
-- À exécuter dans l'éditeur SQL Supabase
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Nouvelles colonnes sur profiles
--    avatar_emoji : emoji affiché dans l'avatar (défaut ⚡)
--    avatar_color : couleur de fond de l'avatar en hex (défaut violet)
--    description  : bio courte visible sur la page publique

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS avatar_emoji      text    NOT NULL DEFAULT '⚡',
  ADD COLUMN IF NOT EXISTS avatar_color      text    NOT NULL DEFAULT '#7c3aed',
  ADD COLUMN IF NOT EXISTS description       text    NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS featured_badges   text[]  NOT NULL DEFAULT '{}';

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. RPC get_public_profile
--    SECURITY DEFINER : contourne les RLS de user_global_stats et
--    user_achievements (own-only) pour exposer uniquement les données
--    pertinentes d'un profil public.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_public_profile(p_username text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id      uuid;
  v_username     text;
  v_avatar_emoji text;
  v_avatar_color text;
  v_description  text;
  v_featured     text[];
  v_games        integer := 0;
  v_correct      integer := 0;
  v_streak       integer := 0;
  v_best_score   integer := 0;
  v_rank         bigint;
  v_total        bigint  := 0;
  v_achievements text[];
BEGIN
  -- Récupère le profil (insensible à la casse)
  SELECT
    p.id,
    p.username,
    COALESCE(p.avatar_emoji, '⚡'),
    COALESCE(p.avatar_color, '#7c3aed'),
    COALESCE(p.description, ''),
    COALESCE(p.featured_badges, '{}'::text[])
  INTO v_user_id, v_username, v_avatar_emoji, v_avatar_color, v_description, v_featured
  FROM profiles p
  WHERE lower(p.username) = lower(p_username);

  -- Retourne NULL si username inconnu → 404 côté client
  IF v_user_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Stats globales (RLS own-only contournée par SECURITY DEFINER)
  SELECT
    COALESCE(ugs.games_played, 0),
    COALESCE(ugs.total_correct, 0),
    COALESCE(ugs.best_streak, 0)
  INTO v_games, v_correct, v_streak
  FROM user_global_stats ugs
  WHERE ugs.user_id = v_user_id;

  -- Meilleur score compétitif (leaderboard déjà public)
  SELECT COALESCE(l.score, 0)
  INTO v_best_score
  FROM leaderboard l
  WHERE l.user_id = v_user_id
    AND l.mode = 'compétitif'
  ORDER BY l.score DESC
  LIMIT 1;

  -- Rang global compétitif + nombre total de joueurs classés
  IF COALESCE(v_best_score, 0) > 0 THEN
    SELECT COUNT(*) + 1 INTO v_rank
    FROM leaderboard
    WHERE mode = 'compétitif' AND score > v_best_score;

    SELECT COUNT(DISTINCT user_id) INTO v_total
    FROM leaderboard
    WHERE mode = 'compétitif';
  END IF;

  -- Achievements débloqués (RLS own-only contournée par SECURITY DEFINER)
  SELECT array_agg(ua.achievement_id ORDER BY ua.unlocked_at)
  INTO v_achievements
  FROM user_achievements ua
  WHERE ua.user_id = v_user_id;

  RETURN jsonb_build_object(
    'username',        v_username,
    'avatar_emoji',    v_avatar_emoji,
    'avatar_color',    v_avatar_color,
    'description',     v_description,
    'featured_badges', to_jsonb(COALESCE(v_featured, '{}'::text[])),
    'games_played',    v_games,
    'total_correct',   v_correct,
    'best_streak',     v_streak,
    'best_comp_score', COALESCE(v_best_score, 0),
    'rank',            v_rank,
    'total_players',   v_total,
    'achievements',    to_jsonb(COALESCE(v_achievements, '{}'::text[]))
  );
END;
$$;

-- Révoque l'exécution publique puis la ré-accorde explicitement
REVOKE EXECUTE ON FUNCTION get_public_profile(text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION get_public_profile(text) TO anon, authenticated;
