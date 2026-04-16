-- ═══════════════════════════════════════════════════════════════════════════════
-- Pulse Quizz — Migration : défi journalier passe à 10 questions
-- ═══════════════════════════════════════════════════════════════════════════════
--
-- À exécuter dans Supabase SQL Editor.
--
-- Changements :
--   1. Contrainte score (0-5 → 0-10) dans daily_challenge_entries
--   2. Mise à jour de la RPC get_daily_questions (LIMIT 10)
--   3. Mise à jour de la RPC submit_daily_entry (vérification score <= 10)
--   4. Thème de test pour 2026-04-16 avec 15 questions Sciences
-- ═══════════════════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Contrainte de score
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE daily_challenge_entries
  DROP CONSTRAINT IF EXISTS daily_challenge_entries_score_check;

ALTER TABLE daily_challenge_entries
  ADD CONSTRAINT daily_challenge_entries_score_check
  CHECK (score >= 0 AND score <= 10);


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. RPC get_daily_questions — LIMIT 10
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_daily_questions(p_date date)
RETURNS TABLE (
  id               uuid,
  language         text,
  category         text,
  difficulty       text,
  question         text,
  correct_answer   text,
  incorrect_answers text[],
  anecdote         text
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_category_tags text[];
  v_seed          float8;
BEGIN
  SELECT category_tags
    INTO v_category_tags
    FROM daily_themes
   WHERE date = p_date;

  v_seed := ((p_date - '1970-01-01'::date) % 1000)::float8 / 500.0 - 1.0;
  PERFORM setseed(v_seed);

  RETURN QUERY
  SELECT
    q.id, q.language, q.category, q.difficulty,
    q.question, q.correct_answer, q.incorrect_answers, q.anecdote
  FROM questions q
  WHERE q.language = 'fr'
    AND (
      v_category_tags IS NULL
      OR array_length(v_category_tags, 1) IS NULL
      OR q.category = ANY(v_category_tags)
    )
  ORDER BY random()
  LIMIT 10;
END;
$$;

GRANT EXECUTE ON FUNCTION get_daily_questions(date) TO anon, authenticated;


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. RPC submit_daily_entry — score <= 10
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION submit_daily_entry(
  p_date       date,
  p_score      int,
  p_xp_earned  int,
  p_multiplier numeric
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id      uuid   := auth.uid();
  v_streak       record;
  v_new_streak   int;
  v_longest      int;
  v_streak_day   int;
  v_entry_id     uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  IF p_score < 0 OR p_score > 10 THEN
    RAISE EXCEPTION 'invalid_score';
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

  INSERT INTO daily_challenge_entries (user_id, date, score, xp_earned, multiplier, streak_day)
    VALUES (v_user_id, p_date, p_score, p_xp_earned, p_multiplier, v_streak_day)
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


-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Thème et questions de test — "Espace & Astronomie" (2026-04-16)
--    15 questions pour avoir un bon pool → 10 choisies de façon déterministe
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO daily_themes (date, title, emoji, description, category_tags)
VALUES (
  '2026-04-16',
  'Espace & Astronomie',
  '🚀',
  'Teste tes connaissances sur l''univers, les planètes et l''exploration spatiale.',
  ARRAY['Sciences']
)
ON CONFLICT (date) DO UPDATE SET
  title         = EXCLUDED.title,
  emoji         = EXCLUDED.emoji,
  description   = EXCLUDED.description,
  category_tags = EXCLUDED.category_tags;


INSERT INTO questions (question, correct_answer, incorrect_answers, difficulty, language, category, anecdote)
VALUES
  ('Quelle est la planète la plus proche du Soleil ?',
   'Mercure', ARRAY['Vénus','Mars','Terre'], 'easy', 'fr', 'Sciences',
   'Mercure réalise une orbite complète autour du Soleil en seulement 88 jours terrestres.'),

  ('Combien de lunes possède Mars ?',
   '2', ARRAY['0','1','3'], 'easy', 'fr', 'Sciences',
   'Les deux lunes de Mars s''appellent Phobos et Déimos, découvertes en 1877.'),

  ('En quelle année l''homme a-t-il marché sur la Lune pour la première fois ?',
   '1969', ARRAY['1965','1972','1961'], 'easy', 'fr', 'Sciences',
   'Neil Armstrong et Buzz Aldrin ont aluni le 20 juillet 1969 lors de la mission Apollo 11.'),

  ('Combien de temps met la lumière du Soleil pour atteindre la Terre ?',
   '8 minutes', ARRAY['1 seconde','1 heure','24 heures'], 'easy', 'fr', 'Sciences',
   'Exactement 8 minutes et 20 secondes à 299 792 km/s.'),

  ('Quel astronome a découvert les 4 grandes lunes de Jupiter en 1610 ?',
   'Galilée', ARRAY['Copernic','Kepler','Newton'], 'easy', 'fr', 'Sciences',
   'Io, Europe, Ganymède et Callisto sont appelées "lunes galiléennes" en son honneur.'),

  ('Quelle est la galaxie la plus proche de la Voie lactée ?',
   'Andromède', ARRAY['Magellan','Triangulum','Sombrero'], 'medium', 'fr', 'Sciences',
   'La galaxie d''Andromède (M31) se trouve à environ 2,5 millions d''années-lumière.'),

  ('Quel est le nom de la première station spatiale soviétique ?',
   'Saliout 1', ARRAY['Mir','Soyouz','Vostok'], 'medium', 'fr', 'Sciences',
   'Saliout 1 a été lancée en avril 1971 et a accueilli l''équipage de Soyouz 11.'),

  ('Quelle planète possède le plus grand nombre de lunes connues ?',
   'Saturne', ARRAY['Jupiter','Uranus','Neptune'], 'medium', 'fr', 'Sciences',
   'En 2023, Saturne détient le record avec plus de 140 lunes confirmées.'),

  ('Quel est le diamètre approximatif du Soleil par rapport à la Terre ?',
   '109 fois', ARRAY['50 fois','500 fois','10 fois'], 'medium', 'fr', 'Sciences',
   'Le Soleil mesure environ 1 392 000 km de diamètre contre 12 742 km pour la Terre.'),

  ('Quelle sonde spatiale a quitté le système solaire en premier ?',
   'Voyager 1', ARRAY['Voyager 2','Pioneer 10','New Horizons'], 'medium', 'fr', 'Sciences',
   'Voyager 1 a officiellement quitté l''héliosphère en 2012, à plus de 23 milliards de km du Soleil.'),

  ('Comment appelle-t-on la force qui empêche les étoiles de s''effondrer sous leur propre gravité ?',
   'Pression de radiation', ARRAY['Force nucléaire forte','Pression osmotique','Force de Coriolis'], 'hard', 'fr', 'Sciences',
   'L''équilibre entre gravité et pression de radiation détermine la durée de vie d''une étoile.'),

  ('Quel est le nom du phénomène où une étoile massive explose en fin de vie ?',
   'Supernova', ARRAY['Nova','Pulsar','Quasar'], 'hard', 'fr', 'Sciences',
   'Une supernova peut être brièvement plus lumineuse que toute une galaxie.'),

  ('Quelle est la distance moyenne Terre-Lune en kilomètres ?',
   '384 400 km', ARRAY['150 000 km','1 000 000 km','56 000 km'], 'medium', 'fr', 'Sciences',
   'Cette distance varie entre 356 500 km (périgée) et 406 700 km (apogée).'),

  ('Quel est le nom de la région autour d''un trou noir d''où rien ne peut s''échapper ?',
   'Horizon des événements', ARRAY['Zone de Roche','Ceinture de Kuiper','Sphère de Hill'], 'hard', 'fr', 'Sciences',
   'Au-delà de l''horizon des événements, même la lumière ne peut s''échapper du trou noir.'),

  ('Quelle planète a une journée plus longue que son année ?',
   'Vénus', ARRAY['Mercure','Saturne','Uranus'], 'hard', 'fr', 'Sciences',
   'Vénus met 243 jours terrestres pour faire un tour sur elle-même, mais seulement 225 jours pour orbiter le Soleil.')
ON CONFLICT DO NOTHING;


-- ─────────────────────────────────────────────────────────────────────────────
-- Vérification : doit retourner exactement 10 questions identiques
-- ─────────────────────────────────────────────────────────────────────────────

SELECT 'Appel 1' AS appel, question, difficulty
FROM get_daily_questions('2026-04-16');

SELECT 'Appel 2' AS appel, question, difficulty
FROM get_daily_questions('2026-04-16');
