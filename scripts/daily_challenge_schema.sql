-- ═══════════════════════════════════════════════════════════════════════════════
-- Pulse Quizz — Défi Journalier : schéma Supabase
-- ═══════════════════════════════════════════════════════════════════════════════
--
-- Nouvelles tables :
--   1. daily_themes              — thèmes pré-curés manuellement (date → thème)
--   2. daily_challenge_entries   — participations (user × date, 1 seule par jour)
--   3. daily_streaks             — état de la série de chaque utilisateur
--
-- Nouvelles fonctions RPC :
--   - submit_daily_entry         — soumettre un score journalier
--   - get_daily_leaderboard      — classement paginé pour une date
--
-- Ordre : respecter l'ordre (dépendances FK).
-- ═══════════════════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────────────────────
-- 1. daily_themes
-- ─────────────────────────────────────────────────────────────────────────────
-- Alimenté manuellement dans le dashboard Supabase.

CREATE TABLE IF NOT EXISTS daily_themes (
  date          date        PRIMARY KEY,
  title         text        NOT NULL,
  emoji         text        NOT NULL DEFAULT '📅',
  description   text,
  category_tags text[]      NOT NULL DEFAULT '{}'
);

-- RLS : lecture publique
ALTER TABLE daily_themes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "daily_themes read" ON daily_themes FOR SELECT USING (true);


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. daily_challenge_entries
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS daily_challenge_entries (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  date         date        NOT NULL,
  score        int         NOT NULL CHECK (score >= 0 AND score <= 5),
  xp_earned    int         NOT NULL CHECK (xp_earned >= 0),
  multiplier   numeric(4,2) NOT NULL DEFAULT 1.0,
  streak_day   int         NOT NULL DEFAULT 1,
  completed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, date)
);

-- Index pour le leaderboard d'une date (DESC score, ASC completed_at = tiebreak)
CREATE INDEX IF NOT EXISTS daily_entries_date_score ON daily_challenge_entries (date, score DESC, completed_at ASC);

-- RLS
ALTER TABLE daily_challenge_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "entries read"   ON daily_challenge_entries FOR SELECT USING (true);
CREATE POLICY "entries insert" ON daily_challenge_entries FOR INSERT WITH CHECK (auth.uid() = user_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. daily_streaks
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS daily_streaks (
  user_id          uuid  PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  current_streak   int   NOT NULL DEFAULT 0,
  longest_streak   int   NOT NULL DEFAULT 0,
  last_played_date date
);

-- RLS
ALTER TABLE daily_streaks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "streaks read"   ON daily_streaks FOR SELECT USING (true);
CREATE POLICY "streaks write"  ON daily_streaks FOR ALL USING (auth.uid() = user_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- 4. submit_daily_entry (RPC SECURITY DEFINER)
-- ─────────────────────────────────────────────────────────────────────────────
-- • Insère l'entrée (UNIQUE → erreur si déjà joué aujourd'hui)
-- • Met à jour la série (current_streak, longest_streak, last_played_date)
-- • Retourne l'entrée créée + nouvelle série

CREATE OR REPLACE FUNCTION submit_daily_entry(
  p_date       date,
  p_score      int,
  p_xp_earned  int,
  p_multiplier numeric
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id      uuid   := auth.uid();
  v_streak       record;
  v_new_streak   int;
  v_longest      int;
  v_streak_day   int;
  v_entry_id     uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  -- Récupère ou initialise la série
  SELECT current_streak, longest_streak, last_played_date
    INTO v_streak
    FROM daily_streaks
    WHERE user_id = v_user_id;

  IF NOT FOUND THEN
    v_streak.current_streak   := 0;
    v_streak.longest_streak   := 0;
    v_streak.last_played_date := NULL;
  END IF;

  -- Calcul de la nouvelle série
  IF v_streak.last_played_date IS NULL THEN
    -- Première participation
    v_new_streak := 1;
  ELSIF v_streak.last_played_date = p_date - 1 THEN
    -- Jour consécutif
    v_new_streak := v_streak.current_streak + 1;
  ELSIF v_streak.last_played_date = p_date THEN
    -- Déjà joué aujourd'hui (ne devrait pas arriver mais protège)
    RAISE EXCEPTION 'already_played';
  ELSE
    -- Série brisée
    v_new_streak := 1;
  END IF;

  v_longest    := GREATEST(v_new_streak, v_streak.longest_streak);
  v_streak_day := v_new_streak;

  -- Insérer l'entrée
  INSERT INTO daily_challenge_entries (user_id, date, score, xp_earned, multiplier, streak_day)
    VALUES (v_user_id, p_date, p_score, p_xp_earned, p_multiplier, v_streak_day)
    RETURNING id INTO v_entry_id;

  -- Upsert la série
  INSERT INTO daily_streaks (user_id, current_streak, longest_streak, last_played_date)
    VALUES (v_user_id, v_new_streak, v_longest, p_date)
    ON CONFLICT (user_id) DO UPDATE
      SET current_streak   = EXCLUDED.current_streak,
          longest_streak   = EXCLUDED.longest_streak,
          last_played_date = EXCLUDED.last_played_date;

  RETURN jsonb_build_object(
    'entry_id',       v_entry_id,
    'streak_day',     v_streak_day,
    'current_streak', v_new_streak,
    'longest_streak', v_longest
  );
END;
$$;


-- ─────────────────────────────────────────────────────────────────────────────
-- 5. get_daily_leaderboard (RPC)
-- ─────────────────────────────────────────────────────────────────────────────
-- Retourne les N entrées d'une date, enrichies du username + featured_badges.
-- Rang déterminé par : score DESC, completed_at ASC (plus rapide gagne).

CREATE OR REPLACE FUNCTION get_daily_leaderboard(
  p_date      date,
  p_offset    int  DEFAULT 0,
  p_limit     int  DEFAULT 10
)
RETURNS TABLE (
  id           uuid,
  user_id      uuid,
  username     text,
  score        int,
  xp_earned    int,
  multiplier   numeric,
  streak_day   int,
  completed_at timestamptz,
  rank         bigint,
  featured_badges text[]
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    e.id,
    e.user_id,
    p.username,
    e.score,
    e.xp_earned,
    e.multiplier,
    e.streak_day,
    e.completed_at,
    ROW_NUMBER() OVER (ORDER BY e.score DESC, e.completed_at ASC) AS rank,
    COALESCE(p.featured_badges, '{}') AS featured_badges
  FROM daily_challenge_entries e
  JOIN profiles p ON p.id = e.user_id
  WHERE e.date = p_date
  ORDER BY e.score DESC, e.completed_at ASC
  LIMIT p_limit OFFSET p_offset;
$$;


-- ─────────────────────────────────────────────────────────────────────────────
-- check_daily_rank_achievements(p_date)
-- ─────────────────────────────────────────────────────────────────────────────
-- À appeler en fin de journée (pg_cron ou edge function) pour débloquer les
-- achievements de classement journalier : daily_podium (top 3) et
-- daily_roi_du_jour (rank 1).
-- Ces achievements sont délibérément exclus du flux end-of-game car le rang
-- fluctue tout au long de la journée.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION check_daily_rank_achievements(p_date date DEFAULT CURRENT_DATE)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  rec RECORD;
BEGIN
  -- Parcourir le top 3 du jour
  FOR rec IN
    SELECT
      e.user_id,
      ROW_NUMBER() OVER (ORDER BY e.score DESC, e.completed_at ASC) AS rank
    FROM daily_challenge_entries e
    WHERE e.date = p_date
    ORDER BY e.score DESC, e.completed_at ASC
    LIMIT 3
  LOOP
    -- daily_podium : top 3
    INSERT INTO user_achievements (user_id, achievement_id)
    VALUES (rec.user_id, 'daily_podium')
    ON CONFLICT (user_id, achievement_id) DO NOTHING;

    -- daily_roi_du_jour : rank #1 seulement
    IF rec.rank = 1 THEN
      INSERT INTO user_achievements (user_id, achievement_id)
      VALUES (rec.user_id, 'daily_roi_du_jour')
      ON CONFLICT (user_id, achievement_id) DO NOTHING;
    END IF;
  END LOOP;
END;
$$;

-- ─── Exemple pg_cron (optionnel) ─────────────────────────────────────────────
-- SELECT cron.schedule(
--   'daily-rank-achievements',
--   '1 0 * * *',   -- 00:01 UTC chaque jour (1 minute après minuit)
--   $$ SELECT check_daily_rank_achievements((CURRENT_DATE - 1)::date); $$
-- );
