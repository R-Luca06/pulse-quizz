-- ═══════════════════════════════════════════════════════════════════════════════
-- Pulse Quizz — Défi Journalier : questions déterministes
-- ═══════════════════════════════════════════════════════════════════════════════
--
-- Nouvelle fonction RPC :
--   get_daily_questions(p_date)
--     → Retourne toujours les mêmes 5 questions pour une date donnée,
--       identiques pour tous les joueurs.
--
-- Principe : setseed() initialise le PRNG PostgreSQL avec une valeur dérivée
-- de la date. ORDER BY random() produit alors la même séquence pour tous les
-- appels avec la même date, quelle que soit la session ou le moment de la journée.
--
-- Application : exécuter dans Supabase SQL Editor (une seule fois).
-- ═══════════════════════════════════════════════════════════════════════════════

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
  -- Récupère les catégories du thème du jour (peut être NULL si aucun thème)
  SELECT category_tags
    INTO v_category_tags
    FROM daily_themes
   WHERE date = p_date;

  -- Seed déterministe : nombre de jours depuis l'epoch, normalisé dans [-1, 1]
  -- Exemple : 2026-04-16 → 20559 jours → seed ≈ 0.118
  v_seed := ((p_date - '1970-01-01'::date) % 1000)::float8 / 500.0 - 1.0;
  PERFORM setseed(v_seed);

  -- Retourne 5 questions filtrées par catégories (ou toutes si aucune tag)
  RETURN QUERY
  SELECT
    q.id,
    q.language,
    q.category,
    q.difficulty,
    q.question,
    q.correct_answer,
    q.incorrect_answers,
    q.anecdote
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

-- Permissions : accessible à tous les utilisateurs authentifiés et anonymes
GRANT EXECUTE ON FUNCTION get_daily_questions(date) TO anon, authenticated;
