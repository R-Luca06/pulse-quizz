-- ═══════════════════════════════════════════════════════════════════════════════
-- Pulse Quizz — Schéma complet Supabase
-- ═══════════════════════════════════════════════════════════════════════════════
--
-- Source de vérité unique de la base de données.
-- Remplace et consolide tous les fichiers par feature :
--   - scripts/daily_challenge_schema.sql
--   - scripts/pulses_schema.sql
--   - scripts/user_badges.sql
--   - scripts/migrations/001_public_profile.sql
--   - scripts/migrations/002_achievement_dates.sql
-- (conservés pour référence historique uniquement).
--
-- Exécution :
--   Supabase Dashboard → SQL Editor → New query → coller ce fichier → Run
--   OU via la CLI : supabase db push (si migration configurée)
--
-- Ordre : respecter l'ordre du fichier (dépendances FK).
--
-- Tables :
--   1.  profiles                    — profils utilisateurs (lié à auth.users)
--   2.  questions                   — banque de questions de quiz
--   3.  leaderboard                 — classements (normal + compétitif)
--   4.  user_stats                  — stats par catégorie / mode / difficulté
--   5.  user_global_stats           — totaux agrégés (games, XP, comp score)
--   6.  user_achievements           — achievements débloqués
--   7.  user_inventory              — possession unifiée d'items cosmétiques (tous types, toutes sources)
--   8.  friendships                 — relations d'amitié
--   9.  notifications               — notifications in-app (20 max / user)
--   10. daily_themes                — thème pré-curé par date
--   11. daily_challenge_entries     — participations journalières (1 / user / date)
--   12. daily_streaks               — séries journalières par utilisateur
--   13. user_wallet                 — solde Pulses ◈
--   14. wallet_transactions         — ledger immuable des gains de Pulses
--   15. shop_items                  — catalogue de la Boutique (lecture publique)
--   16. shop_purchases              — ledger immuable des achats en Boutique
--   17. shop_bundles                — bundles (packs d'items vendus ensemble)
--   18. shop_bundle_items           — junction bundle ↔ shop_items
--   19. shop_bundle_purchases       — ledger immuable des achats de bundle
--
-- Fonctions RPC :
--   - get_random_questions          — sélection aléatoire via pivot UUID
--   - submit_score                  — seul point d'écriture dans leaderboard
--   - increment_category_stats      — upsert atomique de user_stats
--   - increment_global_stats        — upsert atomique de user_global_stats (+ XP)
--   - add_xp                        — crédit ponctuel d'XP
--   - add_pulses                    — ledger + wallet upsert atomique
--   - purchase_item                 — achat atomique Boutique (wallet + inventory)
--   - purchase_bundle               — achat atomique d'un bundle (N pièces, 1 débit)
--   - submit_daily_entry            — insert + calcul de série (UNIQUE user/date)
--   - mark_daily_recap_seen         — flag recap_seen=true pour une entrée journalière
--   - get_daily_leaderboard         — classement journalier paginé
--   - check_daily_rank_achievements — unlock rang-based daily (pg_cron en fin de jour)
--   - get_public_profile            — profil public + stats + rang + achievements
--   - delete_user                   — suppression complète du compte
--
-- Triggers :
--   - sync_achievement_to_inventory — user_achievements → user_inventory (item_type='badge')
--   - sync_username_to_leaderboard  — profiles → leaderboard (changement de pseudo)
--   - trim_notifications            — garde les 20 dernières par utilisateur
--   - update_friendships_updated_at — maintient friendships.updated_at
--
-- ═══════════════════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────────────────────
-- 1. profiles
-- ─────────────────────────────────────────────────────────────────────────────
-- Créé lors de l'inscription (AuthContext.signUp).
-- `username` est affiché partout (leaderboard, public profile) — dénormalisé
-- dans leaderboard.username pour éviter les JOINs en lecture ; synchronisé
-- lors d'un changement de pseudo via profile.ts.

CREATE TABLE IF NOT EXISTS profiles (
  id                         uuid        PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  username                   text        NOT NULL,
  featured_badges            text[]      NOT NULL DEFAULT '{}',  -- jusqu'à 3 badge_id épinglés
  description                text        NOT NULL DEFAULT '',    -- bio libre (max 120 char côté client)
  username_changed           boolean     NOT NULL DEFAULT false,
  avatar_changed             boolean     NOT NULL DEFAULT false,
  description_changed        boolean     NOT NULL DEFAULT false,
  notification_prefs         jsonb       NOT NULL DEFAULT '{"achievement_unlocked":true,"rank_change":true}',
  -- Items cosmétiques équipés (NULL = rendu par défaut, résolu côté client)
  equipped_emblem_id         text        DEFAULT NULL,
  equipped_background_id     text        DEFAULT NULL,
  equipped_title_id          text        DEFAULT NULL,
  equipped_card_design_id    text        DEFAULT NULL,
  equipped_screen_anim_id    text        DEFAULT NULL,
  created_at                 timestamptz NOT NULL DEFAULT now()
);

-- Migration idempotente pour bases existantes (ajout des colonnes equipped_*)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS equipped_emblem_id       text DEFAULT NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS equipped_background_id   text DEFAULT NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS equipped_title_id        text DEFAULT NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS equipped_card_design_id  text DEFAULT NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS equipped_screen_anim_id  text DEFAULT NULL;

-- Unicité insensible à la casse : index fonctionnel sur lower(username).
-- 'Alice' et 'alice' = même username.
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower_unique
  ON profiles (lower(username));

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Lecture publique (leaderboard, vérif unicité pseudo, profil public)
CREATE POLICY "profiles_select_public"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. questions
-- ─────────────────────────────────────────────────────────────────────────────
-- Banque alimentée via scripts/import-custom.mjs (lecture seule depuis le client).

CREATE TABLE IF NOT EXISTS questions (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  language          text        NOT NULL,                                     -- 'fr'
  category          text        NOT NULL,
  difficulty        text        NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  question          text        NOT NULL,
  correct_answer    text        NOT NULL,
  incorrect_answers text[]      NOT NULL,                                     -- 3 mauvaises réponses
  anecdote          text,
  source            text        NOT NULL DEFAULT 'openquizzdb',
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- Index couvrant pour le pivot UUID (get_random_questions) : range scan direct
-- dans l'index, aucun retour heap.
CREATE INDEX IF NOT EXISTS idx_questions_lang_diff_cat_id
  ON questions (language, difficulty, category, id);

ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "questions_read_public"
  ON questions FOR SELECT
  USING (true);


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. leaderboard
-- ─────────────────────────────────────────────────────────────────────────────
-- Mode normal     : une entrée par (user_id, 'normal', difficulty, language)
-- Mode compétitif : une entrée par (user_id, 'compétitif', 'mixed', language)

CREATE TABLE IF NOT EXISTS leaderboard (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  username   text        NOT NULL,
  score      integer     NOT NULL DEFAULT 0,
  mode       text        NOT NULL,                                            -- 'normal' | 'compétitif'
  difficulty text        NOT NULL,                                            -- 'easy' | 'medium' | 'hard' | 'mixed'
  language   text        NOT NULL DEFAULT 'fr',
  game_data  jsonb,                                                           -- détail des réponses (compétitif)
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT leaderboard_user_mode_unique UNIQUE (user_id, mode, difficulty, language)
);

CREATE INDEX IF NOT EXISTS idx_leaderboard_comp
  ON leaderboard (mode, language, score DESC)
  WHERE mode = 'compétitif';

CREATE INDEX IF NOT EXISTS idx_leaderboard_normal
  ON leaderboard (mode, difficulty, score DESC)
  WHERE mode != 'compétitif';

CREATE INDEX IF NOT EXISTS idx_leaderboard_user
  ON leaderboard (user_id, mode);

ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

-- Lecture publique. INSERT/UPDATE interdits directement → seuls les appels à
-- submit_score (SECURITY DEFINER + GREATEST) peuvent écrire.
CREATE POLICY "leaderboard_select_public"
  ON leaderboard FOR SELECT
  USING (true);


-- ─────────────────────────────────────────────────────────────────────────────
-- 4. user_stats
-- ─────────────────────────────────────────────────────────────────────────────
-- Incrémenté via la RPC increment_category_stats après chaque partie.

CREATE TABLE IF NOT EXISTS user_stats (
  user_id         uuid        NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  mode            text        NOT NULL,                                       -- 'normal' | 'compétitif'
  difficulty      text        NOT NULL,                                       -- 'easy' | 'medium' | 'hard' | 'mixed'
  category        text        NOT NULL,                                       -- 'all' | nom de catégorie
  games_played    integer     NOT NULL DEFAULT 0,
  total_questions integer     NOT NULL DEFAULT 0,
  total_correct   integer     NOT NULL DEFAULT 0,
  total_time      real        NOT NULL DEFAULT 0,
  best_score      integer     NOT NULL DEFAULT 0,
  best_streak     integer     NOT NULL DEFAULT 0,
  fastest_perfect real,                                                       -- meilleur temps pour un 10/10 (null si jamais)
  updated_at      timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, mode, difficulty, category)
);

ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_stats_select_own"  ON user_stats FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_stats_insert_own"  ON user_stats FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_stats_update_own"  ON user_stats FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- 5. user_global_stats
-- ─────────────────────────────────────────────────────────────────────────────
-- Une seule ligne par utilisateur. Incrémentée via increment_global_stats.

CREATE TABLE IF NOT EXISTS user_global_stats (
  user_id           uuid        PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  games_played      integer     NOT NULL DEFAULT 0,
  comp_games_played integer     NOT NULL DEFAULT 0,                           -- compteur compétitif (achievements Combattant/Gladiateur/Légende)
  total_questions   integer     NOT NULL DEFAULT 0,
  total_correct     integer     NOT NULL DEFAULT 0,
  best_streak       integer     NOT NULL DEFAULT 0,
  fastest_perfect   real,
  comp_total_score  integer     NOT NULL DEFAULT 0,                           -- score cumulé compétitif (toutes parties)
  total_xp          integer     NOT NULL DEFAULT 0,                           -- XP cumulé (système de niveaux)
  updated_at        timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE user_global_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_global_stats_select_own" ON user_global_stats FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_global_stats_insert_own" ON user_global_stats FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_global_stats_update_own" ON user_global_stats FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- 6. user_achievements
-- ─────────────────────────────────────────────────────────────────────────────
-- Inséré via achievements.checkAndUnlockAchievements() et
-- checkAndUnlockDailyAchievements(). Upsert avec ignoreDuplicates.
-- Ids définis côté client dans src/constants/achievements.ts.

CREATE TABLE IF NOT EXISTS user_achievements (
  user_id        uuid        NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  achievement_id text        NOT NULL,
  unlocked_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, achievement_id)
);

ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_achievements_select_own" ON user_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_achievements_insert_own" ON user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- 7. user_inventory
-- ─────────────────────────────────────────────────────────────────────────────
-- Possession unifiée des items cosmétiques : badges, emblèmes, fonds, titres,
-- designs de carte, animations d'écran — toutes sources confondues.
-- Alimentée automatiquement pour (item_type='badge', source='achievement') par
-- le trigger sync_achievement_to_inventory. Les autres types/sources seront
-- alimentés par leurs flux dédiés (boutique, saison, classement).

CREATE TABLE IF NOT EXISTS user_inventory (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  item_type   text        NOT NULL CHECK (item_type IN (
                'badge', 'emblem', 'background', 'title', 'card_design', 'screen_animation'
              )),
  item_id     text        NOT NULL,
  source      text        NOT NULL CHECK (source IN ('achievement', 'shop', 'season', 'rank')),
  obtained_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, item_type, item_id)
);

CREATE INDEX IF NOT EXISTS idx_user_inventory_user_type
  ON user_inventory (user_id, item_type);

ALTER TABLE user_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_inventory_select_own"
  ON user_inventory FOR SELECT
  USING (auth.uid() = user_id);

-- L'insertion directe est permise (WITH CHECK own), mais en pratique elle passe
-- par le trigger SECURITY DEFINER ou des flux service-role (shop/season).
CREATE POLICY "user_inventory_insert_service"
  ON user_inventory FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- Migration user_badges → user_inventory
-- ─────────────────────────────────────────────────────────────────────────────
-- À exécuter une seule fois sur les bases existantes. Copie les badges possédés
-- dans la nouvelle table, puis supprime l'ancienne. Envelopper dans BEGIN/COMMIT
-- lors de l'exécution réelle. Idempotent : skip si user_badges n'existe pas.
--
--   BEGIN;
--   INSERT INTO user_inventory (user_id, item_type, item_id, source, obtained_at)
--   SELECT user_id, 'badge', badge_id, source, obtained_at
--   FROM   user_badges
--   ON CONFLICT (user_id, item_type, item_id) DO NOTHING;
--   DROP TABLE user_badges;
--   COMMIT;


-- ─────────────────────────────────────────────────────────────────────────────
-- 8. friendships
-- ─────────────────────────────────────────────────────────────────────────────
-- Relation symétrique (une seule ligne par paire).
-- Les deux sens sont lus via OR(requester_id=me, addressee_id=me).

CREATE TABLE IF NOT EXISTS friendships (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid        NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  addressee_id uuid        NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  status       text        NOT NULL DEFAULT 'pending'
                           CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT friendships_no_self_loop  CHECK (requester_id <> addressee_id),
  CONSTRAINT friendships_unique_pair   UNIQUE (requester_id, addressee_id)
);

CREATE INDEX IF NOT EXISTS idx_friendships_requester ON friendships (requester_id);
CREATE INDEX IF NOT EXISTS idx_friendships_addressee ON friendships (addressee_id);

ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "friendships_select_own"
  ON friendships FOR SELECT
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

CREATE POLICY "friendships_insert_own"
  ON friendships FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

-- Seul l'addressee peut changer le statut (accept/reject).
-- Le requester annule via DELETE.
CREATE POLICY "friendships_update_addressee"
  ON friendships FOR UPDATE
  USING (auth.uid() = addressee_id)
  WITH CHECK (
    auth.uid() = addressee_id
    AND status IN ('accepted', 'rejected')
  );

CREATE POLICY "friendships_delete_own"
  ON friendships FOR DELETE
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- 9. notifications
-- ─────────────────────────────────────────────────────────────────────────────
-- Historique in-app des 20 dernières notifications par utilisateur.
-- Types :
--   achievement_unlocked — data: { badge_id, badge_name, badge_icon }
--   rank_up              — data: { new_rank, delta }
--   rank_down            — data: { new_rank, delta }
-- Créées depuis le client (useGameOrchestration) après chaque partie.

CREATE TABLE IF NOT EXISTS notifications (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  type        text        NOT NULL CHECK (type IN (
                'achievement_unlocked', 'rank_up', 'rank_down'
              )),
  data        jsonb       NOT NULL DEFAULT '{}',
  read        boolean     NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_created
  ON notifications (user_id, created_at DESC);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_select_own" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notifications_insert_own" ON notifications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "notifications_update_own" ON notifications FOR UPDATE USING (auth.uid() = user_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- 10. daily_themes
-- ─────────────────────────────────────────────────────────────────────────────
-- Alimenté manuellement via le dashboard Supabase ou scripts/daily_week_*.sql.

CREATE TABLE IF NOT EXISTS daily_themes (
  date          date        PRIMARY KEY,
  title         text        NOT NULL,
  emoji         text        NOT NULL DEFAULT '📅',
  description   text,
  category_tags text[]      NOT NULL DEFAULT '{}'
);

ALTER TABLE daily_themes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "daily_themes read" ON daily_themes FOR SELECT USING (true);


-- ─────────────────────────────────────────────────────────────────────────────
-- 11. daily_challenge_entries
-- ─────────────────────────────────────────────────────────────────────────────
-- Une participation par (user, date). Enforce via UNIQUE + RPC SECURITY DEFINER.

CREATE TABLE IF NOT EXISTS daily_challenge_entries (
  id               uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid         NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  date             date         NOT NULL,
  score            int          NOT NULL CHECK (score >= 0),
  correct_answers  int          NOT NULL DEFAULT 0 CHECK (correct_answers >= 0 AND correct_answers <= 10),
  xp_earned        int          NOT NULL CHECK (xp_earned >= 0),
  multiplier       numeric(4,2) NOT NULL DEFAULT 1.0,
  streak_day       int          NOT NULL DEFAULT 1,
  completed_at     timestamptz  NOT NULL DEFAULT now(),
  recap_seen       boolean      NOT NULL DEFAULT false,
  question_results jsonb        NOT NULL DEFAULT '[]'::jsonb,
  UNIQUE (user_id, date)
);

CREATE INDEX IF NOT EXISTS daily_entries_date_score
  ON daily_challenge_entries (date, score DESC, completed_at ASC);

ALTER TABLE daily_challenge_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "entries read"   ON daily_challenge_entries FOR SELECT USING (true);
CREATE POLICY "entries insert" ON daily_challenge_entries FOR INSERT WITH CHECK (auth.uid() = user_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- 12. daily_streaks
-- ─────────────────────────────────────────────────────────────────────────────
-- Calculé par submit_daily_entry (SECURITY DEFINER).

CREATE TABLE IF NOT EXISTS daily_streaks (
  user_id          uuid  PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  current_streak   int   NOT NULL DEFAULT 0,
  longest_streak   int   NOT NULL DEFAULT 0,
  last_played_date date
);

ALTER TABLE daily_streaks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "streaks read"  ON daily_streaks FOR SELECT USING (true);
CREATE POLICY "streaks write" ON daily_streaks FOR ALL USING (auth.uid() = user_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- 13. user_wallet
-- ─────────────────────────────────────────────────────────────────────────────
-- Solde de Pulses ◈ par utilisateur. Écritures uniquement via add_pulses (RPC).

CREATE TABLE IF NOT EXISTS user_wallet (
  user_id         uuid        PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  balance         int         NOT NULL DEFAULT 0 CHECK (balance >= 0),
  lifetime_earned int         NOT NULL DEFAULT 0 CHECK (lifetime_earned >= 0),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE user_wallet ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wallet read own" ON user_wallet FOR SELECT USING (auth.uid() = user_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- 14. wallet_transactions
-- ─────────────────────────────────────────────────────────────────────────────
-- Ledger immuable (INSERT only, jamais UPDATE/DELETE).
-- source : 'game_normal' | 'game_competitif' | 'game_daily'
--        | 'achievement_common' | 'achievement_rare' | 'achievement_epic' | 'achievement_legendary'
--        | 'daily_streak_bonus' | ...
-- source_ref : référence optionnelle (id partie, achievement_id, date, …)

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
-- 15. shop_items
-- ─────────────────────────────────────────────────────────────────────────────
-- Catalogue de la Boutique. `item_type` + `item_id` référencent les registries
-- cosmétiques côté client (src/constants/cosmetics/*) — ou un id de badge shop
-- dédié pour les badges. Lecture ouverte (anon + authenticated) pour que la
-- landing puisse teaser les items. Écritures : service_role uniquement.

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
CREATE POLICY "shop_items_select_all" ON shop_items FOR SELECT USING (true);


-- ─────────────────────────────────────────────────────────────────────────────
-- 16. shop_purchases
-- ─────────────────────────────────────────────────────────────────────────────
-- Ledger immuable des achats en Boutique (INSERT only). Pendant symétrique de
-- wallet_transactions (lui-même réservé aux gains positifs). Alimenté
-- exclusivement par le RPC purchase_item (SECURITY DEFINER).

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
CREATE POLICY "shop_purchases_select_own" ON shop_purchases FOR SELECT USING (auth.uid() = user_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- 17. shop_bundles
-- ─────────────────────────────────────────────────────────────────────────────
-- Bundles de la Boutique : plusieurs `shop_items` vendus ensemble à un prix
-- global réduit. Même ergonomie que shop_items (featured, is_new, is_limited,
-- fenêtre de disponibilité). Lecture ouverte ; écritures : service_role.

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


-- ─────────────────────────────────────────────────────────────────────────────
-- 18. shop_bundle_items
-- ─────────────────────────────────────────────────────────────────────────────
-- Junction bundle ↔ shop_items. `sort_order` fixe l'ordre d'affichage des
-- pièces dans la modale d'achat.

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


-- ─────────────────────────────────────────────────────────────────────────────
-- 19. shop_bundle_purchases
-- ─────────────────────────────────────────────────────────────────────────────
-- Ledger immuable des achats de bundle. Séparé de shop_purchases pour éviter
-- de rendre shop_purchases.shop_item_id nullable. Alimenté exclusivement par
-- le RPC purchase_bundle (SECURITY DEFINER).

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


-- ═══════════════════════════════════════════════════════════════════════════════
-- Fonctions RPC
-- ═══════════════════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────────────────────
-- get_random_questions
-- ─────────────────────────────────────────────────────────────────────────────
-- Appelée par api.ts pour chaque partie.
-- Stratégie : pivot UUID aléatoire pour éviter ORDER BY RANDOM() sur l'ensemble
-- filtré. Scan d'index (idx_questions_lang_diff_cat_id).

CREATE OR REPLACE FUNCTION get_random_questions(
  p_language   text,
  p_difficulty text    DEFAULT 'mixed',
  p_category   text    DEFAULT 'all',
  p_limit      integer DEFAULT 10
)
RETURNS TABLE (
  id                uuid,
  language          text,
  category          text,
  difficulty        text,
  question          text,
  correct_answer    text,
  incorrect_answers text[],
  anecdote          text
)
LANGUAGE plpgsql
VOLATILE
AS $$
DECLARE
  v_pivot uuid := gen_random_uuid();
BEGIN
  RETURN QUERY
  WITH pivot_above AS (
    SELECT q.id, q.language, q.category, q.difficulty,
           q.question, q.correct_answer, q.incorrect_answers, q.anecdote
    FROM   questions q
    WHERE  q.language = p_language
      AND  (p_difficulty = 'mixed' OR q.difficulty = p_difficulty)
      AND  (p_category   = 'all'   OR q.category   = p_category)
      AND  q.id >= v_pivot
    ORDER BY q.id
    LIMIT p_limit
  ),
  pivot_below AS (
    SELECT q.id, q.language, q.category, q.difficulty,
           q.question, q.correct_answer, q.incorrect_answers, q.anecdote
    FROM   questions q
    WHERE  q.language = p_language
      AND  (p_difficulty = 'mixed' OR q.difficulty = p_difficulty)
      AND  (p_category   = 'all'   OR q.category   = p_category)
      AND  q.id < v_pivot
    ORDER BY q.id DESC
    LIMIT p_limit
  ),
  candidates AS (
    SELECT * FROM pivot_above
    UNION ALL
    SELECT * FROM pivot_below
  )
  SELECT c.id, c.language, c.category, c.difficulty,
         c.question, c.correct_answer, c.incorrect_answers, c.anecdote
  FROM   candidates c
  ORDER BY random()
  LIMIT p_limit;
END;
$$;


-- ─────────────────────────────────────────────────────────────────────────────
-- submit_score
-- ─────────────────────────────────────────────────────────────────────────────
-- Seul point d'entrée autorisé pour écrire dans leaderboard.
-- GREATEST(old, new) serveur-side empêche l'écriture d'un score arbitraire.

CREATE OR REPLACE FUNCTION submit_score(
  p_mode       text,
  p_difficulty text,
  p_language   text,
  p_score      integer,
  p_username   text,
  p_game_data  jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;

  INSERT INTO leaderboard (
    user_id, username, score, mode, difficulty, language, game_data, updated_at
  )
  VALUES (
    auth.uid(), p_username, p_score, p_mode, p_difficulty, p_language, p_game_data, now()
  )
  ON CONFLICT (user_id, mode, difficulty, language) DO UPDATE
    SET score      = GREATEST(leaderboard.score, EXCLUDED.score),
        username   = EXCLUDED.username,
        game_data  = CASE
                       WHEN EXCLUDED.score > leaderboard.score THEN EXCLUDED.game_data
                       ELSE leaderboard.game_data
                     END,
        updated_at = CASE
                       WHEN EXCLUDED.score > leaderboard.score THEN now()
                       ELSE leaderboard.updated_at
                     END;
END;
$$;

REVOKE ALL ON FUNCTION submit_score(text, text, text, integer, text, jsonb) FROM public, anon;
GRANT EXECUTE ON FUNCTION submit_score(text, text, text, integer, text, jsonb) TO authenticated;


-- ─────────────────────────────────────────────────────────────────────────────
-- increment_category_stats
-- ─────────────────────────────────────────────────────────────────────────────
-- Upsert atomique — pas de race condition si deux parties se terminent en
-- parallèle (double onglet, reconnexion réseau).

CREATE OR REPLACE FUNCTION increment_category_stats(
  p_mode            text,
  p_difficulty      text,
  p_category        text,
  p_questions       integer,
  p_correct         integer,
  p_time            real,
  p_score           integer,
  p_streak          integer,
  p_fastest_perfect real    DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;

  INSERT INTO user_stats (
    user_id, mode, difficulty, category,
    games_played, total_questions, total_correct, total_time,
    best_score, best_streak, fastest_perfect, updated_at
  )
  VALUES (
    auth.uid(), p_mode, p_difficulty, p_category,
    1, p_questions, p_correct, p_time,
    p_score, p_streak, p_fastest_perfect, now()
  )
  ON CONFLICT (user_id, mode, difficulty, category) DO UPDATE SET
    games_played    = user_stats.games_played    + 1,
    total_questions = user_stats.total_questions + EXCLUDED.total_questions,
    total_correct   = user_stats.total_correct   + EXCLUDED.total_correct,
    total_time      = user_stats.total_time      + EXCLUDED.total_time,
    best_score      = GREATEST(user_stats.best_score,  EXCLUDED.best_score),
    best_streak     = GREATEST(user_stats.best_streak, EXCLUDED.best_streak),
    fastest_perfect = CASE
      WHEN EXCLUDED.fastest_perfect IS NULL         THEN user_stats.fastest_perfect
      WHEN user_stats.fastest_perfect IS NULL       THEN EXCLUDED.fastest_perfect
      ELSE LEAST(user_stats.fastest_perfect, EXCLUDED.fastest_perfect)
    END,
    updated_at = now();
END;
$$;

REVOKE ALL ON FUNCTION increment_category_stats(text,text,text,integer,integer,real,integer,integer,real) FROM public, anon;
GRANT EXECUTE ON FUNCTION increment_category_stats(text,text,text,integer,integer,real,integer,integer,real) TO authenticated;


-- ─────────────────────────────────────────────────────────────────────────────
-- increment_global_stats
-- ─────────────────────────────────────────────────────────────────────────────
-- Incrémente user_global_stats (games, comp_games, XP, comp_total_score, …).

CREATE OR REPLACE FUNCTION increment_global_stats(
  p_mode            text,
  p_questions       integer,
  p_correct         integer,
  p_streak          integer,
  p_comp_score      integer,
  p_xp              integer,
  p_fastest_perfect real    DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;

  INSERT INTO user_global_stats (
    user_id,
    games_played, comp_games_played, total_questions, total_correct,
    best_streak, fastest_perfect, comp_total_score, total_xp, updated_at
  )
  VALUES (
    auth.uid(),
    1,
    CASE WHEN p_mode = 'compétitif' THEN 1 ELSE 0 END,
    p_questions, p_correct,
    p_streak, p_fastest_perfect, p_comp_score, p_xp, now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    games_played      = user_global_stats.games_played + 1,
    comp_games_played = user_global_stats.comp_games_played +
                        CASE WHEN p_mode = 'compétitif' THEN 1 ELSE 0 END,
    total_questions   = user_global_stats.total_questions + EXCLUDED.total_questions,
    total_correct     = user_global_stats.total_correct   + EXCLUDED.total_correct,
    best_streak       = GREATEST(user_global_stats.best_streak, EXCLUDED.best_streak),
    fastest_perfect   = CASE
      WHEN EXCLUDED.fastest_perfect IS NULL              THEN user_global_stats.fastest_perfect
      WHEN user_global_stats.fastest_perfect IS NULL     THEN EXCLUDED.fastest_perfect
      ELSE LEAST(user_global_stats.fastest_perfect, EXCLUDED.fastest_perfect)
    END,
    comp_total_score  = user_global_stats.comp_total_score + EXCLUDED.comp_total_score,
    total_xp          = user_global_stats.total_xp         + EXCLUDED.total_xp,
    updated_at        = now();
END;
$$;

REVOKE ALL ON FUNCTION increment_global_stats(text,integer,integer,integer,integer,integer,real) FROM public, anon;
GRANT EXECUTE ON FUNCTION increment_global_stats(text,integer,integer,integer,integer,integer,real) TO authenticated;


-- ─────────────────────────────────────────────────────────────────────────────
-- add_xp
-- ─────────────────────────────────────────────────────────────────────────────
-- Crédit ponctuel d'XP : achievements débloqués, bonus daily, …

CREATE OR REPLACE FUNCTION add_xp(p_amount integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;

  INSERT INTO user_global_stats (user_id, total_xp)
  VALUES (auth.uid(), p_amount)
  ON CONFLICT (user_id) DO UPDATE SET
    total_xp   = user_global_stats.total_xp + EXCLUDED.total_xp,
    updated_at = now();
END;
$$;

REVOKE ALL ON FUNCTION add_xp(integer) FROM public, anon;
GRANT EXECUTE ON FUNCTION add_xp(integer) TO authenticated;


-- ─────────────────────────────────────────────────────────────────────────────
-- add_pulses
-- ─────────────────────────────────────────────────────────────────────────────
-- Insère une ligne dans wallet_transactions + upsert atomique sur user_wallet.
-- Retourne { balance } (nouveau solde).

CREATE OR REPLACE FUNCTION add_pulses(
  p_amount     int,
  p_source     text,
  p_source_ref text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

REVOKE ALL ON FUNCTION add_pulses(int, text, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION add_pulses(int, text, text) TO authenticated;


-- ─────────────────────────────────────────────────────────────────────────────
-- purchase_item
-- ─────────────────────────────────────────────────────────────────────────────
-- Achat atomique en Boutique :
--   1. Vérifie auth (sinon 'not_authenticated').
--   2. Charge shop_items (sinon 'item_not_found').
--   3. Fenêtre de disponibilité : 'not_yet_available' / 'no_longer_available'.
--   4. Non déjà possédé dans user_inventory → sinon 'already_owned'.
--   5. Balance suffisante (check préalable) → sinon 'insufficient_balance'.
--   6. UPDATE user_wallet atomique (guard `balance >= price`) ; 0 row →
--      'insufficient_balance' (protection contre la race avec add_pulses).
--   7. INSERT shop_purchases + user_inventory(source='shop').
-- Retourne { balance, item_type, item_id } pour update optimiste côté client.

-- Note : on évite deux patterns plpgsql cassés dans l'env Supabase de ce
-- projet (validateur qui interprète les variables comme des relations) :
--   • `SELECT c1, c2 INTO v1, v2 FROM t` → remplacé par scalar-subquery
--     assignments `var := (SELECT col FROM t WHERE …);`
--   • `UPDATE … RETURNING col INTO var` → remplacé par UPDATE + GET
--     DIAGNOSTICS n = ROW_COUNT + relecture scalaire du solde.

CREATE OR REPLACE FUNCTION purchase_item(p_shop_item_id uuid)
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


-- ─────────────────────────────────────────────────────────────────────────────
-- purchase_bundle
-- ─────────────────────────────────────────────────────────────────────────────
-- Achat atomique d'un bundle :
--   1. Vérifie auth (sinon 'not_authenticated').
--   2. Charge shop_bundles (sinon 'bundle_not_found').
--   3. Fenêtre de disponibilité : 'not_yet_available' / 'no_longer_available'.
--   4. Balance suffisante (check + UPDATE gardé par `balance >= price`).
--   5. INSERT shop_bundle_purchases (1 seule ligne ledger).
--   6. INSERT user_inventory pour chaque pièce du bundle
--      (ON CONFLICT DO NOTHING → pièces déjà possédées ignorées).
-- Retourne { balance, bundle_id, items_added } (items_added < size(bundle) si
-- l'utilisateur possédait déjà certaines pièces, mais il paie le prix plein).
--
-- Mêmes workarounds plpgsql que purchase_item (pas de SELECT … INTO multi-col,
-- pas de UPDATE … RETURNING INTO).

CREATE OR REPLACE FUNCTION purchase_bundle(p_bundle_id uuid)
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

  UPDATE user_wallet
     SET balance    = balance - bun_price,
         updated_at = now()
   WHERE user_id = caller_uid
     AND balance >= bun_price;
  GET DIAGNOSTICS updated_n = ROW_COUNT;
  IF updated_n = 0 THEN RAISE EXCEPTION 'insufficient_balance'; END IF;

  new_bal := (SELECT balance FROM user_wallet WHERE user_id = caller_uid);

  INSERT INTO shop_bundle_purchases (user_id, bundle_id, price_paid)
    VALUES (caller_uid, p_bundle_id, bun_price);

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


-- ─────────────────────────────────────────────────────────────────────────────
-- submit_daily_entry
-- ─────────────────────────────────────────────────────────────────────────────
-- • UNIQUE(user_id, date) → erreur 'already_played' si déjà joué aujourd'hui.
-- • Calcule la nouvelle série (current_streak, longest_streak).
-- • Retourne { entry_id, streak_day, current_streak, longest_streak }.

CREATE OR REPLACE FUNCTION submit_daily_entry(
  p_date             date,
  p_score            int,
  p_xp_earned        int,
  p_multiplier       numeric,
  p_correct_answers  int   DEFAULT 0,
  p_question_results jsonb DEFAULT '[]'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id    uuid := auth.uid();
  v_streak     record;
  v_new_streak int;
  v_longest    int;
  v_streak_day int;
  v_entry_id   uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  SELECT current_streak, longest_streak, last_played_date
    INTO v_streak
    FROM daily_streaks
    WHERE user_id = v_user_id;

  IF NOT FOUND THEN
    v_streak.current_streak   := 0;
    v_streak.longest_streak   := 0;
    v_streak.last_played_date := NULL;
  END IF;

  IF v_streak.last_played_date IS NULL THEN
    v_new_streak := 1;
  ELSIF v_streak.last_played_date = p_date - 1 THEN
    v_new_streak := v_streak.current_streak + 1;
  ELSIF v_streak.last_played_date = p_date THEN
    RAISE EXCEPTION 'already_played';
  ELSE
    v_new_streak := 1;
  END IF;

  v_longest    := GREATEST(v_new_streak, v_streak.longest_streak);
  v_streak_day := v_new_streak;

  INSERT INTO daily_challenge_entries (user_id, date, score, correct_answers, xp_earned, multiplier, streak_day, question_results)
    VALUES (v_user_id, p_date, p_score, p_correct_answers, p_xp_earned, p_multiplier, v_streak_day, p_question_results)
    RETURNING id INTO v_entry_id;

  INSERT INTO daily_streaks (user_id, current_streak, longest_streak, last_played_date)
    VALUES (v_user_id, v_new_streak, v_longest, p_date)
    ON CONFLICT (user_id) DO UPDATE
      SET current_streak   = EXCLUDED.current_streak,
          longest_streak   = EXCLUDED.longest_streak,
          last_played_date = EXCLUDED.last_played_date;

  RETURN jsonb_build_object(
    'entry_id',       v_entry_id,
    'streak_day',     v_streak_day,
    'current_streak', v_new_streak,
    'longest_streak', v_longest
  );
END;
$$;

REVOKE ALL ON FUNCTION submit_daily_entry(date, int, int, numeric, int, jsonb) FROM public, anon;
GRANT EXECUTE ON FUNCTION submit_daily_entry(date, int, int, numeric, int, jsonb) TO authenticated;


-- ─────────────────────────────────────────────────────────────────────────────
-- mark_daily_recap_seen
-- ─────────────────────────────────────────────────────────────────────────────
-- Marque l'entrée journalière comme "recap vu" pour éviter de la remontrer.
-- SECURITY DEFINER + WHERE user_id = auth.uid() pour restreindre à la colonne
-- recap_seen du propriétaire uniquement.

CREATE OR REPLACE FUNCTION mark_daily_recap_seen(p_date date)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE daily_challenge_entries
     SET recap_seen = true
   WHERE user_id = auth.uid()
     AND date    = p_date;
$$;

REVOKE ALL ON FUNCTION mark_daily_recap_seen(date) FROM public, anon;
GRANT EXECUTE ON FUNCTION mark_daily_recap_seen(date) TO authenticated;


-- ─────────────────────────────────────────────────────────────────────────────
-- get_daily_leaderboard
-- ─────────────────────────────────────────────────────────────────────────────
-- Classement journalier paginé — joint profiles pour username + featured_badges.
-- Rang = ROW_NUMBER (score DESC, completed_at ASC → plus rapide gagne).

CREATE OR REPLACE FUNCTION get_daily_leaderboard(
  p_date      date,
  p_offset    int  DEFAULT 0,
  p_limit     int  DEFAULT 10
)
RETURNS TABLE (
  id              uuid,
  user_id         uuid,
  username        text,
  score           int,
  xp_earned       int,
  multiplier      numeric,
  streak_day      int,
  completed_at    timestamptz,
  rank            bigint,
  featured_badges text[]
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    e.id,
    e.user_id,
    p.username,
    e.score,
    e.xp_earned,
    e.multiplier,
    e.streak_day,
    e.completed_at,
    ROW_NUMBER() OVER (ORDER BY e.score DESC, e.completed_at ASC) AS rank,
    COALESCE(p.featured_badges, '{}') AS featured_badges
  FROM daily_challenge_entries e
  JOIN profiles p ON p.id = e.user_id
  WHERE e.date = p_date
  ORDER BY e.score DESC, e.completed_at ASC
  LIMIT p_limit OFFSET p_offset;
$$;


-- ─────────────────────────────────────────────────────────────────────────────
-- check_daily_rank_achievements
-- ─────────────────────────────────────────────────────────────────────────────
-- À appeler une fois par jour (pg_cron) pour la date de la veille.
-- Débloque daily_podium (top 3, tier legendary) et daily_roi_du_jour (rank 1,
-- tier legendary), crédite XP + Pulses selon le tier, et crée la notification.
-- Délibérément hors du flux end-of-game car le rang fluctue pendant la journée.
--
-- pg_cron (voir scripts/migrations/003_fix_username_sync_and_daily_rank.sql) :
--   SELECT cron.schedule(
--     'daily-rank-achievements',
--     '5 0 * * *',
--     $$ SELECT check_daily_rank_achievements((CURRENT_DATE - 1)::date); $$
--   );

CREATE OR REPLACE FUNCTION check_daily_rank_achievements(p_date date DEFAULT CURRENT_DATE)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec               RECORD;
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
    -- daily_podium (tier legendary) — 500 XP, 200 Pulses
    WITH ins AS (
      INSERT INTO user_achievements (user_id, achievement_id)
      VALUES (rec.user_id, 'daily_podium')
      ON CONFLICT (user_id, achievement_id) DO NOTHING
      RETURNING 1
    )
    SELECT COUNT(*) INTO v_inserted_podium FROM ins;

    IF v_inserted_podium > 0 THEN
      INSERT INTO user_global_stats (user_id, total_xp)
      VALUES (rec.user_id, 500)
      ON CONFLICT (user_id) DO UPDATE SET
        total_xp   = user_global_stats.total_xp + 500,
        updated_at = now();

      INSERT INTO wallet_transactions (user_id, amount, source, source_ref)
      VALUES (rec.user_id, 200, 'achievement_legendary', 'daily_podium:' || p_date::text);

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
          'badge_id',   'daily_podium',
          'badge_name', 'Podium Journalier',
          'badge_icon', '🏆',
          'date',       p_date::text
        )
      );
    END IF;

    -- daily_roi_du_jour (tier legendary) — 500 XP, 200 Pulses
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
-- get_public_profile
-- ─────────────────────────────────────────────────────────────────────────────
-- Profil public : stats globales, meilleur score comp, rang, achievements.
-- SECURITY DEFINER pour contourner les RLS own-only de user_global_stats /
-- user_achievements. Accessible authenticated + anon.

CREATE OR REPLACE FUNCTION get_public_profile(p_username text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id       uuid;
  v_username      text;
  v_desc          text;
  v_featured      text[];
  v_emblem        text;
  v_background    text;
  v_title         text;
  v_card_design   text;
  v_screen_anim   text;
  v_games         integer := 0;
  v_correct       integer := 0;
  v_streak        integer := 0;
  v_total_xp      integer := 0;
  v_best_comp     integer := 0;
  v_rank          bigint  := NULL;
  v_total         bigint  := 0;
  v_ach           jsonb   := '[]'::jsonb;
  v_ach_dates     jsonb   := '[]'::jsonb;
BEGIN
  SELECT id, username, description, featured_badges,
         equipped_emblem_id, equipped_background_id, equipped_title_id,
         equipped_card_design_id, equipped_screen_anim_id
  INTO v_user_id, v_username, v_desc, v_featured,
       v_emblem, v_background, v_title, v_card_design, v_screen_anim
  FROM profiles WHERE lower(username) = lower(p_username);

  IF NOT FOUND THEN RETURN NULL; END IF;

  SELECT COALESCE(games_played, 0), COALESCE(total_correct, 0),
         COALESCE(best_streak, 0),  COALESCE(total_xp, 0)
  INTO v_games, v_correct, v_streak, v_total_xp
  FROM user_global_stats WHERE user_id = v_user_id;

  SELECT COALESCE(score, 0) INTO v_best_comp
  FROM leaderboard WHERE user_id = v_user_id AND mode = 'compétitif' LIMIT 1;

  SELECT COUNT(*) INTO v_total
  FROM leaderboard WHERE mode = 'compétitif' AND language = 'fr';

  -- Rang O(1) via idx_leaderboard_comp (mode, language, score DESC).
  IF v_best_comp > 0 THEN
    SELECT COUNT(*) + 1 INTO v_rank
    FROM leaderboard
    WHERE mode = 'compétitif' AND language = 'fr' AND score > v_best_comp;
  END IF;

  -- Achievements : un seul parcours, deux agrégats (ids + id+date).
  SELECT
    jsonb_agg(achievement_id        ORDER BY unlocked_at),
    jsonb_agg(jsonb_build_object('id', achievement_id, 'unlocked_at', unlocked_at)
              ORDER BY unlocked_at)
  INTO v_ach, v_ach_dates
  FROM user_achievements WHERE user_id = v_user_id;

  RETURN jsonb_build_object(
    'username',                 v_username,
    'avatar_emoji',             '',
    'avatar_color',             '',
    'description',              COALESCE(v_desc, ''),
    'featured_badges',          COALESCE(to_jsonb(v_featured), '[]'::jsonb),
    'games_played',             v_games,
    'total_correct',            v_correct,
    'best_streak',              v_streak,
    'total_xp',                 v_total_xp,
    'best_comp_score',          v_best_comp,
    'rank',                     v_rank,
    'total_players',            v_total,
    'achievements',             COALESCE(v_ach,       '[]'::jsonb),
    'achievement_dates',        COALESCE(v_ach_dates, '[]'::jsonb),
    'equipped_emblem_id',       v_emblem,
    'equipped_background_id',   v_background,
    'equipped_title_id',        v_title,
    'equipped_card_design_id',  v_card_design,
    'equipped_screen_anim_id',  v_screen_anim
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION get_public_profile(text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION get_public_profile(text) TO authenticated, anon;


-- ─────────────────────────────────────────────────────────────────────────────
-- delete_user
-- ─────────────────────────────────────────────────────────────────────────────
-- Suppression complète du compte (profile.ts).
-- Les FK ON DELETE CASCADE couvrent les enfants, mais on supprime explicitement
-- d'abord pour être déterministe et ne pas dépendre de l'ordre de cascade.

CREATE OR REPLACE FUNCTION delete_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  DELETE FROM wallet_transactions      WHERE user_id = uid;
  DELETE FROM user_wallet              WHERE user_id = uid;
  DELETE FROM notifications            WHERE user_id = uid;
  DELETE FROM friendships              WHERE requester_id = uid OR addressee_id = uid;
  DELETE FROM daily_challenge_entries  WHERE user_id = uid;
  DELETE FROM daily_streaks            WHERE user_id = uid;
  DELETE FROM user_inventory           WHERE user_id = uid;
  DELETE FROM user_achievements        WHERE user_id = uid;
  DELETE FROM user_stats               WHERE user_id = uid;
  DELETE FROM user_global_stats        WHERE user_id = uid;
  DELETE FROM leaderboard              WHERE user_id = uid;
  DELETE FROM profiles                 WHERE id      = uid;

  DELETE FROM auth.users               WHERE id      = uid;
END;
$$;

REVOKE ALL ON FUNCTION delete_user() FROM public, anon;
GRANT EXECUTE ON FUNCTION delete_user() TO authenticated;


-- ═══════════════════════════════════════════════════════════════════════════════
-- Triggers
-- ═══════════════════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────────────────────
-- sync_achievement_to_inventory : user_achievements → user_inventory
-- (item_type='badge', source='achievement')
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION sync_achievement_to_inventory()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO user_inventory (user_id, item_type, item_id, source, obtained_at)
  VALUES (
    NEW.user_id,
    'badge',
    NEW.achievement_id,
    'achievement',
    COALESCE(NEW.unlocked_at, now())
  )
  ON CONFLICT (user_id, item_type, item_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_achievement_unlock ON user_achievements;
CREATE TRIGGER on_achievement_unlock
  AFTER INSERT ON user_achievements
  FOR EACH ROW EXECUTE FUNCTION sync_achievement_to_inventory();

-- Backfill one-shot pour les bases existantes
INSERT INTO user_inventory (user_id, item_type, item_id, source, obtained_at)
SELECT user_id, 'badge', achievement_id, 'achievement', COALESCE(unlocked_at, now())
FROM user_achievements
ON CONFLICT (user_id, item_type, item_id) DO NOTHING;


-- ─────────────────────────────────────────────────────────────────────────────
-- sync_username_to_leaderboard : profiles.username → leaderboard.username
-- ─────────────────────────────────────────────────────────────────────────────
-- RLS interdit l'UPDATE direct de leaderboard côté client ; on propage le
-- changement de pseudo automatiquement via ce trigger SECURITY DEFINER.

CREATE OR REPLACE FUNCTION sync_username_to_leaderboard()
RETURNS TRIGGER
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
-- trim_notifications : garde les 20 dernières par utilisateur
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION trim_notifications()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM notifications
  WHERE id IN (
    SELECT id FROM notifications
    WHERE user_id = NEW.user_id
    ORDER BY created_at DESC
    OFFSET 20
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notifications_trim ON notifications;
CREATE TRIGGER notifications_trim
  AFTER INSERT ON notifications
  FOR EACH ROW EXECUTE FUNCTION trim_notifications();


-- ─────────────────────────────────────────────────────────────────────────────
-- update_friendships_updated_at : maintient friendships.updated_at
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_friendships_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS friendships_updated_at ON friendships;
CREATE TRIGGER friendships_updated_at
  BEFORE UPDATE ON friendships
  FOR EACH ROW EXECUTE FUNCTION update_friendships_updated_at();
