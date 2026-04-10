-- ─────────────────────────────────────────────────────────────────────────────
-- Table questions
-- Coller dans : Supabase Dashboard → SQL Editor → New query → Run
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS questions (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  language          text        NOT NULL,                        -- 'fr' | 'en'
  category          text        NOT NULL,                        -- thème OpenQuizzDB (ex: "Cinéma")
  difficulty        text        NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  question          text        NOT NULL,
  correct_answer    text        NOT NULL,
  incorrect_answers text[]      NOT NULL,                        -- 3 mauvaises réponses
  anecdote          text,                                        -- explication (future learning mode)
  source            text        NOT NULL DEFAULT 'openquizzdb',
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- Index pour accélérer les requêtes filtrées
CREATE INDEX IF NOT EXISTS idx_questions_lang_diff
  ON questions (language, difficulty);

-- Row Level Security — lecture publique, écriture interdite depuis le client
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "questions_read_public"
  ON questions FOR SELECT
  USING (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- Fonction RPC : sélection aléatoire de N questions
-- ─────────────────────────────────────────────────────────────────────────────

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
LANGUAGE sql
STABLE
AS $$
  SELECT
    id, language, category, difficulty,
    question, correct_answer, incorrect_answers, anecdote
  FROM questions
  WHERE language = p_language
    AND (p_difficulty = 'mixed' OR difficulty = p_difficulty)
    AND (p_category = 'all' OR category = p_category)
  ORDER BY RANDOM()
  LIMIT p_limit;
$$;
