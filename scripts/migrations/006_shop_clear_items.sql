-- ═══════════════════════════════════════════════════════════════════════════════
-- 006_shop_clear_items.sql
--
-- Vide la boutique — on réinjectera les items plus tard quand le catalogue sera
-- finalisé. Les tables `shop_items`, `shop_purchases` et la RPC `purchase_item`
-- restent en place (schéma inchangé). Les lignes déjà présentes dans
-- `user_inventory` avec `source = 'shop'` sont conservées : elles ne référencent
-- pas `shop_items` par FK et restent valides (le joueur garde ses achats).
-- ═══════════════════════════════════════════════════════════════════════════════

BEGIN;

-- Purge du ledger d'abord (FK shop_purchases.shop_item_id → shop_items.id).
DELETE FROM shop_purchases;

-- Puis du catalogue.
DELETE FROM shop_items;

COMMIT;
