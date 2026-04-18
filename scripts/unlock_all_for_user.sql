-- ─────────────────────────────────────────────────────────────────────────────
-- unlock_all_for_user.sql
-- ─────────────────────────────────────────────────────────────────────────────
-- Débloque la totalité du contenu pour un utilisateur donné :
--   • Tous les achievements (user_achievements → propage vers user_inventory
--     automatiquement via le trigger sync_achievement_to_inventory)
--   • Tous les cosmétiques non-défaut (emblèmes, titres, cartes, fonds, anims)
--   • XP max (niveau 50 = 245 000)
--   • 50 000 Pulses ◈ crédités au wallet
--
-- Usage (Supabase SQL editor OU psql) :
--   Remplace 'MON_PSEUDO' aux DEUX endroits ci-dessous (ligne 23 et 100), puis
--   exécute. 100 % SQL pur (pas de DO block) : compatible avec tous les éditeurs.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Achievements ─────────────────────────────────────────────────────────
-- Le trigger sync_achievement_to_inventory propage automatiquement chaque
-- insert dans user_achievements vers user_inventory (item_type='badge').
INSERT INTO user_achievements (user_id, achievement_id)
SELECT p.id, t.achievement_id
FROM profiles p
CROSS JOIN (VALUES
  ('premiers_pas'), ('coup_d_envoi'), ('pris_au_jeu'), ('accro'),
  ('centenaire'), ('marathonien'),
  ('premier_competiteur'), ('combattant'), ('gladiateur'), ('legende_de_lareme'),
  ('serie_de_feu'), ('inferno'), ('inarretable'), ('transcendant'),
  ('vif'), ('foudroyant'), ('supersonique'), ('instinct_pur'),
  ('perfectionniste'),
  ('rookie'), ('challenger'), ('performeur'), ('chasseur_de_points'),
  ('expert'), ('maitre'), ('grand_maitre'), ('legende'), ('mythique'),
  ('touche_a_tout'), ('polyvalent'),
  ('dans_l_elite'), ('reconnu'), ('les_25'), ('les_meilleurs'),
  ('sur_le_podium'), ('sans_rival'),
  ('premier_pin'), ('collectionneur'),
  ('reinvention'), ('nouveau_visage'), ('mon_histoire'),
  ('daily_premier_defi'), ('daily_serie_3'), ('daily_semaine_de_feu'),
  ('daily_quinzaine'), ('daily_mois_de_fer'), ('daily_centenaire'),
  ('daily_score_parfait'), ('daily_sniper'), ('daily_infaillible'),
  ('daily_podium'), ('daily_roi_du_jour')
) AS t(achievement_id)
WHERE lower(p.username) = lower('MON_PSEUDO')
ON CONFLICT (user_id, achievement_id) DO NOTHING;

-- ── 2. Cosmétiques non-défaut ───────────────────────────────────────────────
-- Les défauts (default_rank, dynamic_rank, default, none) ne sont jamais
-- stockés en inventory — ils sont toujours disponibles implicitement.
INSERT INTO user_inventory (user_id, item_type, item_id, source)
SELECT p.id, t.item_type, t.item_id, 'shop'
FROM profiles p
CROSS JOIN (VALUES
  -- Emblèmes
  ('emblem',           'flamme_dor'),
  ('emblem',           'cristal_de_glace'),
  ('emblem',           'eclair_neon'),
  ('emblem',           'rose_cyberpunk'),
  -- Titres
  ('title',            'erudit'),
  ('title',            'maitre_des_categories'),
  ('title',            'foudre_mentale'),
  ('title',            'legende_quotidienne'),
  -- Designs de carte
  ('card_design',      'holographique'),
  ('card_design',      'parchemin_dor'),
  ('card_design',      'givre'),
  ('card_design',      'rune_arcane'),
  -- Fonds
  ('background',       'aurore_violette'),
  ('background',       'constellation'),
  ('background',       'grille_neon'),
  ('background',       'nebuleuse_doree'),
  -- Animations d'écran
  ('screen_animation', 'pluie_pulses'),
  ('screen_animation', 'etincelles_dorees'),
  ('screen_animation', 'particules_violet'),
  ('screen_animation', 'eclairs')
) AS t(item_type, item_id)
WHERE lower(p.username) = lower('MON_PSEUDO')
ON CONFLICT (user_id, item_type, item_id) DO NOTHING;

-- ── 3. XP max (niveau 50 = 245 000) ─────────────────────────────────────────
INSERT INTO user_global_stats (user_id, total_xp)
SELECT p.id, 245000
FROM profiles p
WHERE lower(p.username) = lower('MON_PSEUDO')
ON CONFLICT (user_id) DO UPDATE
  SET total_xp = GREATEST(user_global_stats.total_xp, 245000);

-- ── 4. Pulses ───────────────────────────────────────────────────────────────
-- Insertion directe dans wallet + ledger plutôt qu'add_pulses() qui exige
-- auth.uid() = p_user_id (ici on est service-role / propriétaire schéma).
INSERT INTO wallet_transactions (user_id, amount, source, source_ref)
SELECT p.id, 50000, 'admin_grant', 'unlock_all_script'
FROM profiles p
WHERE lower(p.username) = lower('MON_PSEUDO');

INSERT INTO user_wallet (user_id, balance, lifetime_earned, updated_at)
SELECT p.id, 50000, 50000, now()
FROM profiles p
WHERE lower(p.username) = lower('MON_PSEUDO')
ON CONFLICT (user_id) DO UPDATE
  SET balance         = user_wallet.balance         + 50000,
      lifetime_earned = user_wallet.lifetime_earned + 50000,
      updated_at      = now();

-- ── Vérification ────────────────────────────────────────────────────────────
SELECT
  p.username,
  (SELECT count(*) FROM user_achievements WHERE user_id = p.id) AS achievements,
  (SELECT count(*) FROM user_inventory    WHERE user_id = p.id) AS inventory_items,
  (SELECT total_xp FROM user_global_stats WHERE user_id = p.id) AS total_xp,
  (SELECT balance  FROM user_wallet       WHERE user_id = p.id) AS pulses_balance
FROM profiles p
WHERE lower(p.username) = lower('MON_PSEUDO');
