-- ═══════════════════════════════════════════════════════════════════════════════
-- 008_shop_bundles.sql
--
-- Système de bundles (packs de plusieurs `shop_items` vendus ensemble avec un
-- prix global réduit). Tables :
--   • shop_bundles          — bundle (slug, prix, fenêtre dispo, flags).
--   • shop_bundle_items     — junction bundle → shop_items (ordre d'affichage).
--   • shop_bundle_purchases — ledger séparé de shop_purchases (évite de rendre
--                             shop_purchases.shop_item_id nullable).
--
-- RPC `purchase_bundle(p_bundle_id uuid)` : débite une fois, log une ligne
-- ledger, insère toutes les pièces manquantes dans user_inventory (si le user
-- possède déjà certaines pièces, il paie le prix plein — les pièces déjà
-- possédées sont simplement ignorées via ON CONFLICT DO NOTHING).
--
-- Seed : bundle `solaire_v1` (6 000 ◈, −20% sur 7 500 ◈ cumulés) lié aux 8
-- pièces du Set Solaire Héliarque insérées en 007.
-- ═══════════════════════════════════════════════════════════════════════════════

BEGIN;

-- ─── shop_bundles ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS shop_bundles (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            text        NOT NULL UNIQUE,
  name            text        NOT NULL,
  description     text,
  tier            text        NOT NULL CHECK (tier IN ('common','rare','epic','legendary')),
  price           int         NOT NULL CHECK (price > 0),
  is_new          boolean     NOT NULL DEFAULT false,
  is_limited      boolean     NOT NULL DEFAULT false,
  available_from  timestamptz,
  available_until timestamptz,
  featured        boolean     NOT NULL DEFAULT false,
  sort_order      int         NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shop_bundles_featured        ON shop_bundles (featured);
CREATE INDEX IF NOT EXISTS idx_shop_bundles_available_until ON shop_bundles (available_until);

ALTER TABLE shop_bundles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "shop_bundles_select_all" ON shop_bundles;
CREATE POLICY "shop_bundles_select_all" ON shop_bundles FOR SELECT USING (true);

-- ─── shop_bundle_items (junction) ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS shop_bundle_items (
  bundle_id    uuid NOT NULL REFERENCES shop_bundles (id) ON DELETE CASCADE,
  shop_item_id uuid NOT NULL REFERENCES shop_items   (id) ON DELETE CASCADE,
  sort_order   int  NOT NULL DEFAULT 0,
  PRIMARY KEY (bundle_id, shop_item_id)
);

CREATE INDEX IF NOT EXISTS idx_shop_bundle_items_bundle ON shop_bundle_items (bundle_id, sort_order);

ALTER TABLE shop_bundle_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "shop_bundle_items_select_all" ON shop_bundle_items;
CREATE POLICY "shop_bundle_items_select_all" ON shop_bundle_items FOR SELECT USING (true);

-- ─── shop_bundle_purchases (ledger) ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS shop_bundle_purchases (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  bundle_id  uuid        NOT NULL REFERENCES shop_bundles (id),
  price_paid int         NOT NULL CHECK (price_paid > 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shop_bundle_purchases_user_created
  ON shop_bundle_purchases (user_id, created_at DESC);

ALTER TABLE shop_bundle_purchases ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "shop_bundle_purchases_select_own" ON shop_bundle_purchases;
CREATE POLICY "shop_bundle_purchases_select_own"
  ON shop_bundle_purchases FOR SELECT USING (auth.uid() = user_id);

-- ─── RPC purchase_bundle ─────────────────────────────────────────────────────
--
-- IMPORTANT — contraintes spécifiques à l'env Supabase de ce projet :
--   • `SELECT c1, c2 INTO v1, v2 FROM table` → cassé.
--   • `UPDATE … RETURNING col INTO var`      → cassé.
-- → Assignation scalaire `var := (SELECT col FROM t WHERE …);` + GET DIAGNOSTICS.

DROP FUNCTION IF EXISTS purchase_bundle(uuid);

CREATE FUNCTION purchase_bundle(p_bundle_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
  caller_uid uuid;
  bun_price  int;
  bun_from   timestamptz;
  bun_until  timestamptz;
  wallet_bal int;
  updated_n  int;
  new_bal    int;
  added_n    int := 0;
  rec        record;
BEGIN
  caller_uid := auth.uid();
  IF caller_uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;

  bun_price := (SELECT price           FROM shop_bundles WHERE id = p_bundle_id);
  IF bun_price IS NULL THEN RAISE EXCEPTION 'bundle_not_found'; END IF;

  bun_from  := (SELECT available_from  FROM shop_bundles WHERE id = p_bundle_id);
  bun_until := (SELECT available_until FROM shop_bundles WHERE id = p_bundle_id);

  IF bun_from  IS NOT NULL AND now() < bun_from  THEN RAISE EXCEPTION 'not_yet_available';  END IF;
  IF bun_until IS NOT NULL AND now() > bun_until THEN RAISE EXCEPTION 'no_longer_available'; END IF;

  wallet_bal := (SELECT balance FROM user_wallet WHERE user_id = caller_uid);
  IF wallet_bal IS NULL OR wallet_bal < bun_price THEN
    RAISE EXCEPTION 'insufficient_balance';
  END IF;

  -- Débit atomique (guard >= price → race-safe contre add_pulses concurrents).
  UPDATE user_wallet
     SET balance    = balance - bun_price,
         updated_at = now()
   WHERE user_id = caller_uid
     AND balance >= bun_price;
  GET DIAGNOSTICS updated_n = ROW_COUNT;
  IF updated_n = 0 THEN RAISE EXCEPTION 'insufficient_balance'; END IF;

  new_bal := (SELECT balance FROM user_wallet WHERE user_id = caller_uid);

  -- Log ledger bundle.
  INSERT INTO shop_bundle_purchases (user_id, bundle_id, price_paid)
    VALUES (caller_uid, p_bundle_id, bun_price);

  -- Insérer chaque pièce du bundle dans l'inventaire (skip déjà possédé).
  FOR rec IN
    SELECT si.item_type, si.item_id
      FROM shop_bundle_items sbi
      JOIN shop_items si ON si.id = sbi.shop_item_id
     WHERE sbi.bundle_id = p_bundle_id
     ORDER BY sbi.sort_order
  LOOP
    INSERT INTO user_inventory (user_id, item_type, item_id, source)
      VALUES (caller_uid, rec.item_type, rec.item_id, 'shop')
    ON CONFLICT (user_id, item_type, item_id) DO NOTHING;
    GET DIAGNOSTICS updated_n = ROW_COUNT;
    added_n := added_n + updated_n;
  END LOOP;

  RETURN jsonb_build_object(
    'balance',     new_bal,
    'bundle_id',   p_bundle_id,
    'items_added', added_n
  );
END;
$func$;

REVOKE ALL ON FUNCTION purchase_bundle(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION purchase_bundle(uuid) TO authenticated;

-- ─── Seed bundle Héliarque ───────────────────────────────────────────────────

INSERT INTO shop_bundles (slug, name, description, tier, price, is_new, featured, sort_order) VALUES
  ('solaire_v1',
   'Set Solaire — Héliarque',
   'Forge solaire, or en fusion, braises ascendantes. 8 pièces légendaires (−20%).',
   'legendary',
   6000,
   true,
   true,
   10)
ON CONFLICT (slug) DO NOTHING;

-- Lier les 8 pièces (insérées en 007).
INSERT INTO shop_bundle_items (bundle_id, shop_item_id, sort_order)
SELECT b.id, si.id, n.sort_order
  FROM shop_bundles b
  JOIN (
    VALUES
      ('emblem',           'heliarque',                  1),
      ('title',            'heliarque',                  2),
      ('card_design',      'or_en_fusion',               3),
      ('background',       'horizon_incandescent',       4),
      ('screen_animation', 'braises_ascendantes',        5),
      ('badge',            'heliarque_eruption',         6),
      ('badge',            'heliarque_couronne_solaire', 7),
      ('badge',            'heliarque_phenix',           8)
  ) AS n(item_type, item_id, sort_order) ON true
  JOIN shop_items si ON si.item_type = n.item_type AND si.item_id = n.item_id
 WHERE b.slug = 'solaire_v1'
ON CONFLICT (bundle_id, shop_item_id) DO NOTHING;

COMMIT;
