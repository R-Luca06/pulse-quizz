-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  Migration 005b — Boutique : RPC purchase_item                           ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
-- Étape 2/2. Prérequis : 005_shop_tables.sql déjà exécuté.
--
-- IMPORTANT — contraintes spécifiques à l'env Supabase de ce projet :
--   • `SELECT c1, c2 INTO v1, v2 FROM table` (multi-column INTO)  → cassé.
--   • `UPDATE … RETURNING col INTO var`                            → cassé.
-- On contourne avec :
--   • Assignation scalaire : `var := (SELECT col FROM t WHERE …);`
--   • UPDATE sans RETURNING + `GET DIAGNOSTICS n = ROW_COUNT` puis
--     relecture du solde via SELECT scalaire.

DROP FUNCTION IF EXISTS purchase_item(uuid);

CREATE FUNCTION purchase_item(p_shop_item_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
  caller_uid uuid;
  cos_type   text;
  cos_ref    text;
  cos_price  int;
  cos_from   timestamptz;
  cos_until  timestamptz;
  wallet_bal int;
  updated_n  int;
  new_bal    int;
BEGIN
  caller_uid := auth.uid();
  IF caller_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  cos_type  := (SELECT item_type       FROM shop_items WHERE id = p_shop_item_id);
  IF cos_type IS NULL THEN
    RAISE EXCEPTION 'item_not_found';
  END IF;

  cos_ref   := (SELECT item_id         FROM shop_items WHERE id = p_shop_item_id);
  cos_price := (SELECT price           FROM shop_items WHERE id = p_shop_item_id);
  cos_from  := (SELECT available_from  FROM shop_items WHERE id = p_shop_item_id);
  cos_until := (SELECT available_until FROM shop_items WHERE id = p_shop_item_id);

  IF cos_from IS NOT NULL AND now() < cos_from THEN
    RAISE EXCEPTION 'not_yet_available';
  END IF;

  IF cos_until IS NOT NULL AND now() > cos_until THEN
    RAISE EXCEPTION 'no_longer_available';
  END IF;

  IF EXISTS (
    SELECT 1 FROM user_inventory
     WHERE user_id   = caller_uid
       AND item_type = cos_type
       AND item_id   = cos_ref
  ) THEN
    RAISE EXCEPTION 'already_owned';
  END IF;

  wallet_bal := (SELECT balance FROM user_wallet WHERE user_id = caller_uid);
  IF wallet_bal IS NULL OR wallet_bal < cos_price THEN
    RAISE EXCEPTION 'insufficient_balance';
  END IF;

  -- UPDATE atomique (guard `balance >= price` contre race avec add_pulses).
  -- Pas de RETURNING INTO (cassé dans cet env) → GET DIAGNOSTICS + relecture.
  UPDATE user_wallet
     SET balance    = balance - cos_price,
         updated_at = now()
   WHERE user_id = caller_uid
     AND balance >= cos_price;

  GET DIAGNOSTICS updated_n = ROW_COUNT;
  IF updated_n = 0 THEN
    RAISE EXCEPTION 'insufficient_balance';
  END IF;

  new_bal := (SELECT balance FROM user_wallet WHERE user_id = caller_uid);

  INSERT INTO shop_purchases (user_id, shop_item_id, price_paid)
    VALUES (caller_uid, p_shop_item_id, cos_price);

  INSERT INTO user_inventory (user_id, item_type, item_id, source)
    VALUES (caller_uid, cos_type, cos_ref, 'shop')
    ON CONFLICT (user_id, item_type, item_id) DO NOTHING;

  RETURN jsonb_build_object(
    'balance',   new_bal,
    'item_type', cos_type,
    'item_id',   cos_ref
  );
END;
$func$;

REVOKE ALL ON FUNCTION purchase_item(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION purchase_item(uuid) TO authenticated;
