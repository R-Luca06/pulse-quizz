-- ═══════════════════════════════════════════════════════════════════════════════
-- Migration 003 — sync pseudo + rewards daily rank
-- ═══════════════════════════════════════════════════════════════════════════════
--
-- Corrige deux bugs :
--
-- 1. « permission denied for table leaderboard » lors du changement de pseudo.
--    Cause  : le client faisait un UPDATE direct sur `leaderboard`, bloqué par
--             RLS (seul submit_score peut écrire).
--    Fix    : trigger AFTER UPDATE ON profiles qui sync leaderboard.username
--             automatiquement quand le pseudo change.
--
-- 2. Badges « daily_podium » et « daily_roi_du_jour » jamais débloqués.
--    Cause  : `check_daily_rank_achievements` n'était pas planifié (exemple
--             pg_cron en commentaire uniquement), et ne créditait ni XP, ni
--             Pulses, ni notification (contrairement aux autres achievements).
--    Fix    : fonction enrichie + planification pg_cron à 00:05 UTC chaque jour.
--
-- Exécution : Supabase Dashboard → SQL Editor → coller → Run.
-- ═══════════════════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Sync pseudo profiles → leaderboard
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION sync_username_to_leaderboard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE leaderboard
  SET    username = NEW.username
  WHERE  user_id  = NEW.id
    AND  username IS DISTINCT FROM NEW.username;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_username_to_leaderboard ON profiles;

CREATE TRIGGER trg_sync_username_to_leaderboard
  AFTER UPDATE OF username ON profiles
  FOR EACH ROW
  WHEN (OLD.username IS DISTINCT FROM NEW.username)
  EXECUTE FUNCTION sync_username_to_leaderboard();


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. check_daily_rank_achievements — rewards + notifications
-- ─────────────────────────────────────────────────────────────────────────────
-- daily_podium       → tier rare      (75 XP, 30 Pulses)
-- daily_roi_du_jour  → tier legendary (500 XP, 200 Pulses)
--
-- À appeler une fois par jour pour la date de la veille (pg_cron ci-dessous).

CREATE OR REPLACE FUNCTION check_daily_rank_achievements(p_date date DEFAULT CURRENT_DATE)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec           RECORD;
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
    -- ── daily_podium (tier rare) ──────────────────────────────────────────
    WITH ins AS (
      INSERT INTO user_achievements (user_id, achievement_id)
      VALUES (rec.user_id, 'daily_podium')
      ON CONFLICT (user_id, achievement_id) DO NOTHING
      RETURNING 1
    )
    SELECT COUNT(*) INTO v_inserted_podium FROM ins;

    IF v_inserted_podium > 0 THEN
      -- XP
      INSERT INTO user_global_stats (user_id, total_xp)
      VALUES (rec.user_id, 75)
      ON CONFLICT (user_id) DO UPDATE SET
        total_xp   = user_global_stats.total_xp + 75,
        updated_at = now();

      -- Pulses (ledger + wallet)
      INSERT INTO wallet_transactions (user_id, amount, source, source_ref)
      VALUES (rec.user_id, 30, 'achievement_rare', 'daily_podium:' || p_date::text);

      INSERT INTO user_wallet (user_id, balance, lifetime_earned, updated_at)
      VALUES (rec.user_id, 30, 30, now())
      ON CONFLICT (user_id) DO UPDATE
        SET balance         = user_wallet.balance         + 30,
            lifetime_earned = user_wallet.lifetime_earned + 30,
            updated_at      = now();

      -- Notification
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

    -- ── daily_roi_du_jour (tier legendary) ────────────────────────────────
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


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Planification pg_cron — 00:05 UTC chaque jour pour la veille
-- ─────────────────────────────────────────────────────────────────────────────
-- Prérequis : l'extension pg_cron doit être activée.
-- Dashboard Supabase → Database → Extensions → activer « pg_cron ».

CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Supprime l'ancien schedule s'il existe (idempotent)
SELECT cron.unschedule('daily-rank-achievements')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'daily-rank-achievements');

SELECT cron.schedule(
  'daily-rank-achievements',
  '5 0 * * *',
  $$ SELECT check_daily_rank_achievements((CURRENT_DATE - 1)::date); $$
);


-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Rattrapage — débloquer les top 3 des jours passés
-- ─────────────────────────────────────────────────────────────────────────────
-- Applique les récompenses sur toutes les dates daily déjà jouées (idempotent
-- grâce aux ON CONFLICT dans la fonction).

DO $$
DECLARE
  d date;
BEGIN
  FOR d IN
    SELECT DISTINCT date
    FROM   daily_challenge_entries
    WHERE  date < CURRENT_DATE
    ORDER  BY date
  LOOP
    PERFORM check_daily_rank_achievements(d);
  END LOOP;
END $$;
