-- ═══════════════════════════════════════════════════════════════════════════════
-- Pulse Quizz — Économie Pulses (◈) : schéma Supabase
-- ═══════════════════════════════════════════════════════════════════════════════
--
-- Nouvelles tables :
--   1. user_wallet           — solde + lifetime_earned par utilisateur
--   2. wallet_transactions   — ledger immuable des gains (1 ligne / gain)
--
-- Nouvelle fonction RPC :
--   - add_pulses(p_amount, p_source, p_source_ref)   (SECURITY DEFINER, atomique)
--
-- Clause fonctionnelle (Phase 3 de la roadmap) :
--   Les Pulses sont gagnées via les parties, le défi journalier et les
--   achievements. Elles ne sont JAMAIS achetables avec de l'argent réel.
-- ═══════════════════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────────────────────
-- 1. user_wallet
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_wallet (
  user_id         uuid        PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  balance         int         NOT NULL DEFAULT 0 CHECK (balance >= 0),
  lifetime_earned int         NOT NULL DEFAULT 0 CHECK (lifetime_earned >= 0),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE user_wallet ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wallet read own"   ON user_wallet FOR SELECT USING (auth.uid() = user_id);
-- Écritures uniquement via la RPC SECURITY DEFINER (pas d'accès direct).


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. wallet_transactions  (ledger immuable)
-- ─────────────────────────────────────────────────────────────────────────────
-- Chaque ligne = un crédit. Aucune mise à jour, aucune suppression.
-- `source`      : 'game_normal' | 'game_competitif' | 'game_daily'
--                 | 'achievement_common' | 'achievement_rare' | 'achievement_epic'
--                 | 'achievement_legendary' | 'daily_streak_bonus' | ...
-- `source_ref`  : référence optionnelle (id partie, achievement_id, date, …)

CREATE TABLE IF NOT EXISTS wallet_transactions (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  amount     int         NOT NULL CHECK (amount > 0),
  source     text        NOT NULL,
  source_ref text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS wallet_tx_user_created
  ON wallet_transactions (user_id, created_at DESC);

ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tx read own" ON wallet_transactions FOR SELECT USING (auth.uid() = user_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. add_pulses (RPC SECURITY DEFINER)
-- ─────────────────────────────────────────────────────────────────────────────
-- • Insère une ligne dans wallet_transactions
-- • Upsert atomiquement user_wallet (balance += amount, lifetime_earned += amount)
-- • Retourne le nouveau solde

CREATE OR REPLACE FUNCTION add_pulses(
  p_amount     int,
  p_source     text,
  p_source_ref text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_balance int;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'invalid_amount';
  END IF;

  INSERT INTO wallet_transactions (user_id, amount, source, source_ref)
  VALUES (v_user_id, p_amount, p_source, p_source_ref);

  INSERT INTO user_wallet (user_id, balance, lifetime_earned, updated_at)
  VALUES (v_user_id, p_amount, p_amount, now())
  ON CONFLICT (user_id) DO UPDATE
    SET balance         = user_wallet.balance         + EXCLUDED.balance,
        lifetime_earned = user_wallet.lifetime_earned + EXCLUDED.lifetime_earned,
        updated_at      = now()
  RETURNING balance INTO v_balance;

  RETURN jsonb_build_object('balance', v_balance);
END;
$$;
