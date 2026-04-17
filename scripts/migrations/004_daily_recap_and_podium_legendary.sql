-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  Migration 004 — Daily Recap + Podium Journalier en tier legendary       ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
-- À exécuter dans le SQL Editor de Supabase.
--
-- Contenu :
--   1. Ajout des colonnes `recap_seen` + `question_results` sur
--      daily_challenge_entries (pour l'overlay cinématique Daily Recap).
--   2. Remplacement de submit_daily_entry avec p_question_results (6 args).
--   3. Création du RPC mark_daily_recap_seen.
--   4. Mise à jour de check_daily_rank_achievements : daily_podium passe
--      de tier rare (75 XP / 30 Pulses) à tier legendary (500 XP / 200 Pulses).
--   5. Backfill rétroactif : crédite +425 XP et +170 Pulses à chaque user
--      ayant déjà débloqué daily_podium avant la migration.

BEGIN;

-- ─── 1. Colonnes daily_challenge_entries ─────────────────────────────────────
ALTER TABLE daily_challenge_entries
  ADD COLUMN IF NOT EXISTS recap_seen       boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS question_results jsonb   NOT NULL DEFAULT '[]'::jsonb;

-- ─── 2. submit_daily_entry — nouvelle signature avec p_question_results ─────
DROP FUNCTION IF EXISTS submit_daily_entry(date, int, int, numeric, int);

CREATE OR REPLACE FUNCTION submit_daily_entry(
  p_date             date,
  p_score            int,
  p_xp_earned        int,
  p_multiplier       numeric,
  p_correct_answers  int   DEFAULT 0,
  p_question_results jsonb DEFAULT '[]'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id    uuid := auth.uid();
  v_streak     record;
  v_new_streak int;
  v_longest    int;
  v_streak_day int;
  v_entry_id   uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  SELECT current_streak, longest_streak, last_played_date
    INTO v_streak
    FROM daily_streaks
    WHERE user_id = v_user_id;

  IF NOT FOUND THEN
    v_streak.current_streak   := 0;
    v_streak.longest_streak   := 0;
    v_streak.last_played_date := NULL;
  END IF;

  IF v_streak.last_played_date IS NULL THEN
    v_new_streak := 1;
  ELSIF v_streak.last_played_date = p_date - 1 THEN
    v_new_streak := v_streak.current_streak + 1;
  ELSIF v_streak.last_played_date = p_date THEN
    RAISE EXCEPTION 'already_played';
  ELSE
    v_new_streak := 1;
  END IF;

  v_longest    := GREATEST(v_new_streak, v_streak.longest_streak);
  v_streak_day := v_new_streak;

  INSERT INTO daily_challenge_entries
    (user_id, date, score, correct_answers, xp_earned, multiplier, streak_day, question_results)
    VALUES (v_user_id, p_date, p_score, p_correct_answers, p_xp_earned, p_multiplier, v_streak_day, p_question_results)
    RETURNING id INTO v_entry_id;

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

REVOKE ALL ON FUNCTION submit_daily_entry(date, int, int, numeric, int, jsonb) FROM public, anon;
GRANT EXECUTE ON FUNCTION submit_daily_entry(date, int, int, numeric, int, jsonb) TO authenticated;

-- ─── 3. mark_daily_recap_seen ────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION mark_daily_recap_seen(p_date date)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE daily_challenge_entries
     SET recap_seen = true
   WHERE user_id = auth.uid()
     AND date    = p_date;
$$;

REVOKE ALL ON FUNCTION mark_daily_recap_seen(date) FROM public, anon;
GRANT EXECUTE ON FUNCTION mark_daily_recap_seen(date) TO authenticated;

-- ─── 4. check_daily_rank_achievements — daily_podium passe en legendary ─────
CREATE OR REPLACE FUNCTION check_daily_rank_achievements(p_date date DEFAULT CURRENT_DATE)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec               RECORD;
  v_inserted_podium int;
  v_inserted_king   int;
BEGIN
  FOR rec IN
    SELECT
      e.user_id,
      ROW_NUMBER() OVER (ORDER BY e.score DESC, e.completed_at ASC) AS rank
    FROM daily_challenge_entries e
    WHERE e.date = p_date
    ORDER BY e.score DESC, e.completed_at ASC
    LIMIT 3
  LOOP
    -- daily_podium (tier legendary) — 500 XP, 200 Pulses
    WITH ins AS (
      INSERT INTO user_achievements (user_id, achievement_id)
      VALUES (rec.user_id, 'daily_podium')
      ON CONFLICT (user_id, achievement_id) DO NOTHING
      RETURNING 1
    )
    SELECT COUNT(*) INTO v_inserted_podium FROM ins;

    IF v_inserted_podium > 0 THEN
      INSERT INTO user_global_stats (user_id, total_xp)
      VALUES (rec.user_id, 500)
      ON CONFLICT (user_id) DO UPDATE SET
        total_xp   = user_global_stats.total_xp + 500,
        updated_at = now();

      INSERT INTO wallet_transactions (user_id, amount, source, source_ref)
      VALUES (rec.user_id, 200, 'achievement_legendary', 'daily_podium:' || p_date::text);

      INSERT INTO user_wallet (user_id, balance, lifetime_earned, updated_at)
      VALUES (rec.user_id, 200, 200, now())
      ON CONFLICT (user_id) DO UPDATE
        SET balance         = user_wallet.balance         + 200,
            lifetime_earned = user_wallet.lifetime_earned + 200,
            updated_at      = now();

      INSERT INTO notifications (user_id, type, data)
      VALUES (
        rec.user_id,
        'achievement_unlocked',
        jsonb_build_object(
          'badge_id',   'daily_podium',
          'badge_name', 'Podium Journalier',
          'badge_icon', '🏆',
          'date',       p_date::text
        )
      );
    END IF;

    -- daily_roi_du_jour (tier legendary) — 500 XP, 200 Pulses
    IF rec.rank = 1 THEN
      WITH ins AS (
        INSERT INTO user_achievements (user_id, achievement_id)
        VALUES (rec.user_id, 'daily_roi_du_jour')
        ON CONFLICT (user_id, achievement_id) DO NOTHING
        RETURNING 1
      )
      SELECT COUNT(*) INTO v_inserted_king FROM ins;

      IF v_inserted_king > 0 THEN
        INSERT INTO user_global_stats (user_id, total_xp)
        VALUES (rec.user_id, 500)
        ON CONFLICT (user_id) DO UPDATE SET
          total_xp   = user_global_stats.total_xp + 500,
          updated_at = now();

        INSERT INTO wallet_transactions (user_id, amount, source, source_ref)
        VALUES (rec.user_id, 200, 'achievement_legendary', 'daily_roi_du_jour:' || p_date::text);

        INSERT INTO user_wallet (user_id, balance, lifetime_earned, updated_at)
        VALUES (rec.user_id, 200, 200, now())
        ON CONFLICT (user_id) DO UPDATE
          SET balance         = user_wallet.balance         + 200,
              lifetime_earned = user_wallet.lifetime_earned + 200,
              updated_at      = now();

        INSERT INTO notifications (user_id, type, data)
        VALUES (
          rec.user_id,
          'achievement_unlocked',
          jsonb_build_object(
            'badge_id',   'daily_roi_du_jour',
            'badge_name', 'Roi du Jour',
            'badge_icon', '👑',
            'date',       p_date::text
          )
        );
      END IF;
    END IF;
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION check_daily_rank_achievements(date) FROM public, anon;
GRANT EXECUTE ON FUNCTION check_daily_rank_achievements(date) TO authenticated, service_role;

-- ─── 5. Backfill rétroactif pour les users qui ont déjà daily_podium ────────
-- Delta à créditer : legendary (500 XP / 200 Pulses) − rare (75 XP / 30 Pulses)
--                  = +425 XP, +170 Pulses.
--
-- Garde-fou idempotent : on insère d'abord dans wallet_transactions avec
-- source_ref = 'daily_podium:backfill_v4' (guardé par NOT EXISTS). Les autres
-- UPDATE/INSERT consomment le RETURNING, donc les re-runs sont des no-ops.

WITH ledger AS (
  INSERT INTO wallet_transactions (user_id, amount, source, source_ref)
  SELECT ua.user_id, 170, 'achievement_legendary', 'daily_podium:backfill_v4'
    FROM user_achievements ua
   WHERE ua.achievement_id = 'daily_podium'
     AND NOT EXISTS (
       SELECT 1 FROM wallet_transactions wt
        WHERE wt.user_id    = ua.user_id
          AND wt.source_ref = 'daily_podium:backfill_v4'
     )
  RETURNING user_id
),
wallet_upsert AS (
  INSERT INTO user_wallet (user_id, balance, lifetime_earned, updated_at)
  SELECT user_id, 170, 170, now()
    FROM ledger
  ON CONFLICT (user_id) DO UPDATE
    SET balance         = user_wallet.balance         + 170,
        lifetime_earned = user_wallet.lifetime_earned + 170,
        updated_at      = now()
  RETURNING user_id
)
INSERT INTO user_global_stats (user_id, total_xp, updated_at)
SELECT user_id, 425, now()
  FROM wallet_upsert
ON CONFLICT (user_id) DO UPDATE
  SET total_xp   = user_global_stats.total_xp + 425,
      updated_at = now();

COMMIT;
