-- ═══════════════════════════════════════════════════════════════════════════════
-- 009_purge_legacy_cosmetics.sql
--
-- Purge tous les cosmétiques et badges hérités désormais retirés du code.
-- On ne conserve que :
--   • les défauts (default_rank, dynamic_rank, default, none) — jamais stockés
--     en inventaire (ils sont implicites côté client) ;
--   • le Set Héliarque · Vol. 01 (solaire_v1) :
--       emblem           → heliarque
--       title            → heliarque
--       card_design      → or_en_fusion
--       background       → horizon_incandescent
--       screen_animation → braises_ascendantes
--       badge            → heliarque_eruption | heliarque_couronne_solaire | heliarque_phenix
--   • les badges issus d'achievements (source='achievement' — non impactés ici).
--
-- Actions :
--   1. Reset des slots équipés des profils pointant vers un id retiré
--      (retombe proprement sur le cosmétique par défaut côté client).
--   2. Retire les legacy badge ids du tableau profiles.featured_badges.
--   3. DELETE user_inventory pour toutes les rows cosmétiques / shop-badges
--      ne figurant pas dans la whitelist Héliarque.
--
-- Les badges d'achievements (source='achievement') sont préservés intégralement.
-- Le ledger shop_purchases / wallet_transactions est conservé tel quel
-- (ledger historique, sans FK stricte sur les items retirés).
-- ═══════════════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Reset des slots équipés pointant vers un cosmétique retiré ───────────

UPDATE profiles SET equipped_emblem_id = NULL
  WHERE equipped_emblem_id IS NOT NULL
    AND equipped_emblem_id NOT IN ('default_rank', 'heliarque');

UPDATE profiles SET equipped_title_id = NULL
  WHERE equipped_title_id IS NOT NULL
    AND equipped_title_id NOT IN ('dynamic_rank', 'heliarque');

UPDATE profiles SET equipped_card_design_id = NULL
  WHERE equipped_card_design_id IS NOT NULL
    AND equipped_card_design_id NOT IN ('default', 'or_en_fusion');

UPDATE profiles SET equipped_background_id = NULL
  WHERE equipped_background_id IS NOT NULL
    AND equipped_background_id NOT IN ('default', 'horizon_incandescent');

UPDATE profiles SET equipped_screen_anim_id = NULL
  WHERE equipped_screen_anim_id IS NOT NULL
    AND equipped_screen_anim_id NOT IN ('none', 'braises_ascendantes');

-- ── 2. Purge featured_badges : retire les legacy shop-badges ────────────────
-- (les badges d'achievements restent intacts ; seuls les 2 shop-badges retirés
-- sont filtrés + les 3 héliarque sont conservés)

UPDATE profiles
   SET featured_badges = COALESCE(
     ARRAY(
       SELECT b FROM unnest(featured_badges) AS b
        WHERE b NOT IN ('shop_badge_crown', 'shop_badge_diamond')
     ),
     '{}'
   )
 WHERE featured_badges && ARRAY['shop_badge_crown', 'shop_badge_diamond']::text[];

-- ── 3. Purge user_inventory : supprime les items cosmétiques hors whitelist ─
--
-- Whitelist Héliarque par type :
--   emblem            : heliarque
--   title             : heliarque
--   card_design       : or_en_fusion
--   background        : horizon_incandescent
--   screen_animation  : braises_ascendantes
--   badge (shop)      : heliarque_eruption, heliarque_couronne_solaire, heliarque_phenix
--
-- Pour item_type = 'badge', on ne touche QUE les rows source='shop' afin de
-- préserver les badges unlockés via achievements (source='achievement').

DELETE FROM user_inventory
 WHERE (item_type = 'emblem'           AND item_id <> 'heliarque')
    OR (item_type = 'title'            AND item_id <> 'heliarque')
    OR (item_type = 'card_design'      AND item_id <> 'or_en_fusion')
    OR (item_type = 'background'       AND item_id <> 'horizon_incandescent')
    OR (item_type = 'screen_animation' AND item_id <> 'braises_ascendantes')
    OR (item_type = 'badge'
        AND source   = 'shop'
        AND item_id NOT IN (
          'heliarque_eruption',
          'heliarque_couronne_solaire',
          'heliarque_phenix'
        ));

COMMIT;

-- ── Vérification ────────────────────────────────────────────────────────────
-- Doit ne retourner que des rows whitelist Héliarque (et des badges achievements).
SELECT item_type, item_id, source, count(*) AS n
  FROM user_inventory
 GROUP BY item_type, item_id, source
 ORDER BY item_type, item_id;
