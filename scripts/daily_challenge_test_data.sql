-- ============================================================
-- Test data for Défi Journalier — run in Supabase SQL editor
-- Date: 2026-04-16
-- ============================================================

-- 1. Insert today's theme (Sciences & Technologie)
INSERT INTO daily_themes (date, title, emoji, description, category_tags)
VALUES (
  '2026-04-16',
  'Sciences & Technologie',
  '🔬',
  'Teste tes connaissances en sciences et technologie moderne.',
  ARRAY['Sciences', 'Technologie', 'Informatique']
)
ON CONFLICT (date) DO UPDATE SET
  title = EXCLUDED.title,
  emoji = EXCLUDED.emoji,
  description = EXCLUDED.description,
  category_tags = EXCLUDED.category_tags;

-- 2. Insert a past theme (for date selector testing)
INSERT INTO daily_themes (date, title, emoji, description, category_tags)
VALUES (
  '2026-04-15',
  'Histoire & Géographie',
  '🌍',
  'Revivez les grands moments de l''histoire mondiale.',
  ARRAY['Histoire', 'Géographie']
)
ON CONFLICT (date) DO NOTHING;

INSERT INTO daily_themes (date, title, emoji, description, category_tags)
VALUES (
  '2026-04-14',
  'Culture Générale',
  '🎓',
  'Un défi varié sur tous les sujets.',
  ARRAY['Culture', 'Divers']
)
ON CONFLICT (date) DO NOTHING;

-- 3. Add 5 fake French questions for today's daily
--    The daily mode fetches questions via get_random_questions with p_category = 'all'.
--    Any category works — use 'Sciences' or any value already in your DB.
INSERT INTO questions (question, correct_answer, incorrect_answers, difficulty, language, category)
VALUES
  (
    'Quel est le symbole chimique de l''or ?',
    'Au',
    ARRAY['Or', 'Ag', 'Fe'],
    'easy',
    'fr',
    'Sciences'
  ),
  (
    'Combien de planètes compte notre système solaire ?',
    '8',
    ARRAY['9', '7', '10'],
    'easy',
    'fr',
    'Sciences'
  ),
  (
    'Quel langage de programmation a été créé par Guido van Rossum ?',
    'Python',
    ARRAY['Java', 'C++', 'Ruby'],
    'easy',
    'fr',
    'Sciences'
  ),
  (
    'Quelle est la vitesse de la lumière dans le vide (en km/s) ?',
    '300 000',
    ARRAY['150 000', '500 000', '200 000'],
    'medium',
    'fr',
    'Sciences'
  ),
  (
    'Quel est le composant de base d''un CPU ?',
    'Transistor',
    ARRAY['Condensateur', 'Résistance', 'Diode'],
    'medium',
    'fr',
    'Sciences'
  );

-- 4. Fake leaderboard entries for today's daily
--    Replace user UUIDs with real ones from your auth.users table,
--    or insert into daily_challenge_entries directly (bypasses streak logic).
--    NOTE: submit_daily_entry RPC requires auth.uid(), so we insert directly here.

-- First ensure streaks rows exist for fake users (use real user IDs from your DB).
-- Below are example entries — replace <user_uuid_1> etc. with real IDs, or leave
-- as-is to see empty-state until real users play.

-- Example with placeholder UUIDs (replace before running):
/*
INSERT INTO daily_streaks (user_id, current_streak, longest_streak, last_played_date)
VALUES
  ('00000000-0000-0000-0000-000000000001', 7,  7,  '2026-04-16'),
  ('00000000-0000-0000-0000-000000000002', 3,  5,  '2026-04-16'),
  ('00000000-0000-0000-0000-000000000003', 1,  3,  '2026-04-16'),
  ('00000000-0000-0000-0000-000000000004', 14, 14, '2026-04-16'),
  ('00000000-0000-0000-0000-000000000005', 1,  1,  '2026-04-16')
ON CONFLICT (user_id) DO UPDATE SET
  current_streak = EXCLUDED.current_streak,
  longest_streak = GREATEST(daily_streaks.longest_streak, EXCLUDED.longest_streak),
  last_played_date = EXCLUDED.last_played_date;

INSERT INTO daily_challenge_entries (user_id, date, score, xp_earned, multiplier, streak_day)
VALUES
  ('00000000-0000-0000-0000-000000000001', '2026-04-16', 5, 120, 2.0, 7),
  ('00000000-0000-0000-0000-000000000002', '2026-04-16', 5, 90,  1.5, 3),
  ('00000000-0000-0000-0000-000000000003', '2026-04-16', 4, 55,  1.0, 1),
  ('00000000-0000-0000-0000-000000000004', '2026-04-16', 5, 165, 2.5, 14),
  ('00000000-0000-0000-0000-000000000005', '2026-04-16', 3, 30,  1.0, 1)
ON CONFLICT (user_id, date) DO NOTHING;
*/

-- ============================================================
-- To test the full flow as yourself:
-- 1. Run only the INSERT INTO daily_themes block above.
-- 2. Run the INSERT INTO questions block (or use existing questions).
-- 3. Click "Défi journalier" in the app header → you'll see today's theme.
-- 4. Press "Jouer" → completes 5 questions → redirects to DailyChallengePage.
-- 5. Your entry appears in the leaderboard automatically via submit_daily_entry RPC.
-- ============================================================
