-- Ensure league matches schema exists and is secured.
-- This is idempotent and safe to run multiple times.

CREATE TABLE IF NOT EXISTS public.league_matches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  opponent_name TEXT NOT NULL,
  score TEXT NOT NULL,
  result TEXT NOT NULL,
  points_gained INTEGER NOT NULL DEFAULT 0,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT league_matches_result_check CHECK (result IN ('Win', 'Loss', 'Draw'))
);

ALTER TABLE public.league_matches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own league matches" ON public.league_matches;
DROP POLICY IF EXISTS "Users can create their own league matches" ON public.league_matches;
DROP POLICY IF EXISTS "Users can update their own league matches" ON public.league_matches;
DROP POLICY IF EXISTS "Users can delete their own league matches" ON public.league_matches;

CREATE POLICY "Users can view their own league matches"
ON public.league_matches
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own league matches"
ON public.league_matches
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own league matches"
ON public.league_matches
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own league matches"
ON public.league_matches
FOR DELETE
USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_league_matches_updated_at ON public.league_matches;
CREATE TRIGGER update_league_matches_updated_at
BEFORE UPDATE ON public.league_matches
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_league_matches_tournament_id ON public.league_matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_league_matches_user_id ON public.league_matches(user_id);
