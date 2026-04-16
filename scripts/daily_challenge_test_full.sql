-- ═══════════════════════════════════════════════════════════════════════════════
-- Pulse Quizz — Test complet du Défi Journalier (2026-04-16)
-- ═══════════════════════════════════════════════════════════════════════════════
--
-- Ce script est auto-suffisant. À exécuter en une fois dans Supabase SQL Editor.
--
-- Étapes :
--   1. Crée (ou remplace) la RPC get_daily_questions
--   2. Insère le thème du jour "Espace & Astronomie"
--   3. Insère 12 questions dans la catégorie 'Sciences' (→ 5 seront sélectionnées)
--   4. Vérifie le déterminisme : deux appels successifs retournent les mêmes IDs
-- ═══════════════════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Créer / remplacer la RPC get_daily_questions
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

  -- Seed déterministe basé sur le nombre de jours depuis l'epoch, dans [-1, 1]
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
  LIMIT 5;
END;
$$;

GRANT EXECUTE ON FUNCTION get_daily_questions(date) TO anon, authenticated;


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Thème du jour — "Espace & Astronomie"
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


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Questions de test (catégorie 'Sciences', langue 'fr')
--    12 questions → seules 5 seront tirées de façon déterministe
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO questions (question, correct_answer, incorrect_answers, difficulty, language, category, anecdote)
VALUES
  (
    'Quelle est la planète la plus proche du Soleil ?',
    'Mercure',
    ARRAY['Vénus', 'Mars', 'Terre'],
    'easy', 'fr', 'Sciences',
    'Mercure réalise une orbite complète autour du Soleil en seulement 88 jours terrestres.'
  ),
  (
    'Combien de lunes possède Mars ?',
    '2',
    ARRAY['0', '1', '3'],
    'easy', 'fr', 'Sciences',
    'Les deux lunes de Mars s''appellent Phobos et Déimos, découvertes en 1877.'
  ),
  (
    'Quel est le nom de la première station spatiale soviétique ?',
    'Saliout 1',
    ARRAY['Mir', 'Soyouz', 'Vostok'],
    'medium', 'fr', 'Sciences',
    'Saliout 1 a été lancée en avril 1971 et a accueilli l''équipage de Soyouz 11.'
  ),
  (
    'En quelle année l''homme a-t-il marché sur la Lune pour la première fois ?',
    '1969',
    ARRAY['1965', '1972', '1961'],
    'easy', 'fr', 'Sciences',
    'Neil Armstrong et Buzz Aldrin ont aluni le 20 juillet 1969 lors de la mission Apollo 11.'
  ),
  (
    'Quelle est la galaxie la plus proche de la Voie lactée ?',
    'Andromède',
    ARRAY['Magellan', 'Triangulum', 'Sombrero'],
    'medium', 'fr', 'Sciences',
    'La galaxie d''Andromède (M31) se trouve à environ 2,5 millions d''années-lumière.'
  ),
  (
    'Combien de temps met la lumière du Soleil pour atteindre la Terre ?',
    '8 minutes',
    ARRAY['1 seconde', '1 heure', '24 heures'],
    'easy', 'fr', 'Sciences',
    'Exactement 8 minutes et 20 secondes à 299 792 km/s.'
  ),
  (
    'Quel astronome a découvert les 4 grandes lunes de Jupiter en 1610 ?',
    'Galilée',
    ARRAY['Copernic', 'Kepler', 'Newton'],
    'easy', 'fr', 'Sciences',
    'Io, Europe, Ganymède et Callisto sont appelées "lunes galiléennes" en son honneur.'
  ),
  (
    'Quelle planète possède le plus grand nombre de lunes connues ?',
    'Saturne',
    ARRAY['Jupiter', 'Uranus', 'Neptune'],
    'medium', 'fr', 'Sciences',
    'En 2023, Saturne détient le record avec plus de 140 lunes confirmées.'
  ),
  (
    'Comment appelle-t-on la force qui empêche les étoiles de s''effondrer sous leur propre gravité ?',
    'Pression de radiation',
    ARRAY['Force nucléaire forte', 'Pression osmotique', 'Force de Coriolis'],
    'hard', 'fr', 'Sciences',
    'L''équilibre entre gravité et pression de radiation détermine la durée de vie d''une étoile.'
  ),
  (
    'Quel est le diamètre approximatif du Soleil par rapport à la Terre ?',
    '109 fois',
    ARRAY['50 fois', '500 fois', '10 fois'],
    'medium', 'fr', 'Sciences',
    'Le Soleil mesure environ 1 392 000 km de diamètre contre 12 742 km pour la Terre.'
  ),
  (
    'Quelle sonde spatiale a quitté le système solaire en premier ?',
    'Voyager 1',
    ARRAY['Voyager 2', 'Pioneer 10', 'New Horizons'],
    'hard', 'fr', 'Sciences',
    'Voyager 1 a officiellement quitté l''héliosphère en 2012, à plus de 23 milliards de km du Soleil.'
  ),
  (
    'Quel est le nom du phénomène où une étoile massive explose en fin de vie ?',
    'Supernova',
    ARRAY['Nova', 'Pulsar', 'Quasar'],
    'easy', 'fr', 'Sciences',
    'Une supernova peut être brièvement plus lumineuse que toute une galaxie.'
  )
ON CONFLICT DO NOTHING;


-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Vérification du déterminisme
--    Les deux SELECT ci-dessous doivent retourner exactement les mêmes IDs
--    dans le même ordre, à chaque exécution.
-- ─────────────────────────────────────────────────────────────────────────────

SELECT 'Appel 1' AS appel, id, question
FROM get_daily_questions('2026-04-16');

SELECT 'Appel 2' AS appel, id, question
FROM get_daily_questions('2026-04-16');
