-- ═══════════════════════════════════════════════════════════════════════════════
-- 007_shop_solaire_items.sql
--
-- Seed les 8 pièces du Set Solaire — Héliarque · Vol. 01 comme items unitaires
-- dans `shop_items`. Le système de bundles n'est pas introduit ici (phase 3).
-- Seul le blason est `featured = true` (accroche dans la section « Nouveautés »).
-- Total catalogue : 1800 + 1200 + 1500 + 1000 + 1000 + 400 + 400 + 200 = 7 500 ◈.
-- ═══════════════════════════════════════════════════════════════════════════════

BEGIN;

INSERT INTO shop_items (item_type, item_id, name, description, tier, price, is_new, featured, sort_order) VALUES
  ('emblem',           'heliarque',                 'Blason Héliarque',          'Blason solaire couronné.',               'legendary', 1800, false, false,  10),
  ('title',            'heliarque',                 'Titre Héliarque',           'Titre doré scintillant.',                'legendary', 1200, false, false, 11),
  ('card_design',      'or_en_fusion',              'Carte Or en Fusion',        'Cartouche doré.',                        'legendary', 1500, false, false, 12),
  ('background',       'horizon_incandescent',      'Horizon Incandescent',      'Aube solaire, braises.',                 'legendary', 1000, false, false, 13),
  ('screen_animation', 'braises_ascendantes',       'Braises Ascendantes',       'Overlay de braises dorées.',             'legendary', 1000, false, false, 14),
  ('badge',            'heliarque_eruption',        'Badge Éruption',            'Flamme de forge en éruption.',           'legendary',  400, false, false, 15),
  ('badge',            'heliarque_couronne_solaire','Badge Couronne Solaire',    'Soleil couronné à douze rayons.',        'legendary',  400, false, false, 16),
  ('badge',            'heliarque_phenix',          'Badge Phénix',              'Phénix de braise.',                      'legendary',  200, false, false, 17)
ON CONFLICT (item_type, item_id) DO NOTHING;

COMMIT;
