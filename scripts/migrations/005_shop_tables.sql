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


-- ─── Seed ────────────────────────────────────────────────────────────────────

INSERT INTO shop_items
  (item_type, item_id, name, description, tier, price, is_new, is_limited, featured, sort_order)
VALUES
  ('emblem', 'flamme_dor',       'Flamme d''or',       'Un blason enflammé qui scintille en permanence. Démarque-toi au classement.', 'legendary', 2200, true,  false, true,  10),
  ('emblem', 'cristal_de_glace', 'Cristal de glace',   'Un cristal rotatif aux reflets cyan, glacé et précis.',                       'epic',       680, false, false, false, 11),
  ('emblem', 'rose_cyberpunk',   'Rose cyberpunk',     'Une rose géométrique rose néon avec halo tournant.',                          'epic',       720, false, false, false, 12),
  ('emblem', 'eclair_neon',      'Éclair néon',        'Un éclair pulsant dans les tons violets, pour les joueurs rapides.',          'rare',       320, false, false, false, 13),

  ('title', 'legende_quotidienne',  'Légende Quotidienne',  'Streak légendaire au Défi Journalier.',                       'legendary', 1800, true,  true,  true,  20),
  ('title', 'foudre_mentale',       'Foudre Mentale',       'Pour les joueurs dont la vitesse de réponse défie l''humain.', 'epic',       620, false, false, false, 21),
  ('title', 'maitre_des_categories','Maître des Catégories','Réservé à ceux qui dominent toutes les catégories.',          'rare',       380, false, false, false, 22),
  ('title', 'erudit',               'Érudit',               'Pour ceux qui cumulent les bonnes réponses dans toutes les catégories.', 'common', 120, false, false, false, 23),

  ('card_design', 'parchemin_dor',  'Parchemin d''or',    'Bordure dorée ornée de coins sculptés.',                  'legendary', 2000, false, false, false, 30),
  ('card_design', 'holographique',  'Carte holographique','Bordure animée aux reflets holographiques prismatiques.', 'epic',       740, true,  false, false, 31),
  ('card_design', 'rune_arcane',    'Rune arcane',        'Glyphes runiques qui flottent autour de la carte.',       'epic',       560, false, false, false, 32),
  ('card_design', 'givre',          'Carte givrée',       'Bordure cyan glacée avec un reflet qui balaie le titre.', 'rare',       300, false, false, false, 33),

  ('background', 'nebuleuse_doree', 'Nébuleuse dorée',  'Fond cosmique d''or aux reflets profonds.',   'legendary', 2400, false, false, false, 40),
  ('background', 'grille_neon',     'Grille néon',      'Grille cyberpunk aux lignes électriques.',    'epic',       720, false, false, false, 41),
  ('background', 'aurore_violette', 'Aurore violette',  'Voile d''aurore violette en mouvement lent.', 'rare',       340, false, false, false, 42),
  ('background', 'constellation',   'Constellation',    'Ciel étoilé animé, astres en mouvement doux.','rare',       280, false, false, false, 43),

  ('screen_animation', 'eclairs',           'Éclairs',             'Éclairs fulgurants qui traversent l''écran.',             'legendary', 1600, false, false, false, 50),
  ('screen_animation', 'etincelles_dorees', 'Étincelles dorées',   'Pluie d''étincelles dorées lors des bonnes réponses.',    'epic',       520, false, false, false, 51),
  ('screen_animation', 'pluie_pulses',      'Pluie de Pulses',     'Des ◈ pleuvent à chaque Pulses gagnée.',                   'rare',       360, false, false, false, 52),
  ('screen_animation', 'particules_violet', 'Particules violettes','Nuée discrète de particules violettes en arrière-plan.',  'common',      80, false, false, false, 53),

  ('badge', 'shop_badge_crown',   'Couronne de la Boutique', 'Badge exclusif réservé aux acheteurs de la Boutique.', 'legendary', 2000, false, false, false, 60),
  ('badge', 'shop_badge_diamond', 'Diamant de la Boutique',  'Badge épique cristallin, débloqué via la Boutique.',   'epic',       780, false, false, false, 61)
ON CONFLICT (item_type, item_id) DO NOTHING;
