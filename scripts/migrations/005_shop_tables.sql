-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  Migration 005a — Boutique : tables + seed (sans RPC)                    ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
-- Étape 1/2. Exécuter dans le SQL Editor, puis 005_shop_rpc.sql.

-- ─── shop_items ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS shop_items (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  item_type       text        NOT NULL CHECK (item_type IN (
                    'badge', 'emblem', 'background', 'title', 'card_design', 'screen_animation'
                  )),
  item_id         text        NOT NULL,
  name            text        NOT NULL,
  description     text,
  tier            text        NOT NULL CHECK (tier IN ('common', 'rare', 'epic', 'legendary')),
  price           int         NOT NULL CHECK (price > 0),
  is_new          boolean     NOT NULL DEFAULT false,
  is_limited      boolean     NOT NULL DEFAULT false,
  available_from  timestamptz,
  available_until timestamptz,
  featured        boolean     NOT NULL DEFAULT false,
  sort_order      int         NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (item_type, item_id)
);

CREATE INDEX IF NOT EXISTS idx_shop_items_type            ON shop_items (item_type);
CREATE INDEX IF NOT EXISTS idx_shop_items_featured        ON shop_items (featured);
CREATE INDEX IF NOT EXISTS idx_shop_items_available_until ON shop_items (available_until);

ALTER TABLE shop_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "shop_items_select_all" ON shop_items;
CREATE POLICY "shop_items_select_all"
  ON shop_items FOR SELECT
  USING (true);


-- ─── shop_purchases ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS shop_purchases (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  shop_item_id uuid        NOT NULL REFERENCES shop_items (id),
  price_paid   int         NOT NULL CHECK (price_paid > 0),
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shop_purchases_user_created
  ON shop_purchases (user_id, created_at DESC);

ALTER TABLE shop_purchases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "shop_purchases_select_own" ON shop_purchases;
CREATE POLICY "shop_purchases_select_own"
  ON shop_purchases FOR SELECT
  USING (auth.uid() = user_id);

