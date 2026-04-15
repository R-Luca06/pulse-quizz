-- ─── user_badges : possession unifiée de badges (toutes sources) ──────────────
--
-- À exécuter dans le SQL Editor de Supabase.
-- Source peut être : 'achievement' | 'shop' | 'season' | 'rank'
--
-- Le trigger sync_achievement_to_badge() alimente automatiquement cette table
-- à chaque insert dans user_achievements (= chaque achievement débloqué).
-- Le backfill final recopie les achievements déjà existants.

-- ─── 1. Table ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.user_badges (
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id    text        NOT NULL,
  source      text        NOT NULL CHECK (source IN ('achievement', 'shop', 'season', 'rank')),
  obtained_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, badge_id)
);

-- ─── 2. RLS ───────────────────────────────────────────────────────────────────

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- Lecture : chacun ne voit que ses badges
CREATE POLICY "user_badges_select_own"
  ON public.user_badges FOR SELECT
  USING (auth.uid() = user_id);

-- Insert/Update : uniquement via fonctions SECURITY DEFINER (trigger + service role)
CREATE POLICY "user_badges_insert_service"
  ON public.user_badges FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ─── 3. Trigger : user_achievements → user_badges ─────────────────────────────

CREATE OR REPLACE FUNCTION public.sync_achievement_to_badge()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_badges (user_id, badge_id, source, obtained_at)
  VALUES (
    NEW.user_id,
    NEW.achievement_id,
    'achievement',
    COALESCE(NEW.unlocked_at, now())
  )
  ON CONFLICT (user_id, badge_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Supprime l'ancien trigger s'il existait déjà (idempotent)
DROP TRIGGER IF EXISTS on_achievement_unlock ON public.user_achievements;

CREATE TRIGGER on_achievement_unlock
  AFTER INSERT ON public.user_achievements
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_achievement_to_badge();

-- ─── 4. Backfill : achievements existants → user_badges ───────────────────────

INSERT INTO public.user_badges (user_id, badge_id, source, obtained_at)
SELECT
  user_id,
  achievement_id,
  'achievement',
  COALESCE(unlocked_at, now())
FROM public.user_achievements
ON CONFLICT (user_id, badge_id) DO NOTHING;
