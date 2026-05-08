-- Add round field to performances table for tournament matches
ALTER TABLE public.performances 
ADD COLUMN IF NOT EXISTS round text;

-- Drop the old foreign key constraint if it exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_performances_tournament_reference'
  ) THEN
    ALTER TABLE public.performances 
    DROP CONSTRAINT fk_performances_tournament_reference;
  END IF;
END $$;

-- Add foreign key to tournaments table instead
ALTER TABLE public.performances
ADD CONSTRAINT fk_performances_tournament
FOREIGN KEY (tournament_reference) 
REFERENCES public.tournaments(id) 
ON DELETE SET NULL;

-- Migrate existing tournament_matches data to performances table
INSERT INTO public.performances (
  user_id,
  session_type,
  opponent,
  result,
  score,
  notes,
  date,
  tournament_reference,
  round,
  created_at,
  updated_at
)
SELECT 
  tm.user_id,
  'Match' as session_type,
  tm.opponent_name as opponent,
  tm.result,
  tm.score,
  tm.notes,
  tm.date,
  tm.tournament_id as tournament_reference,
  tm.round,
  tm.created_at,
  tm.updated_at
FROM public.tournament_matches tm
WHERE NOT EXISTS (
  -- Avoid duplicates if migration was run before
  SELECT 1 FROM public.performances p 
  WHERE p.user_id = tm.user_id 
    AND p.opponent = tm.opponent_name 
    AND p.date = tm.date 
    AND p.round = tm.round
);

-- Drop the tournament_matches table as it's no longer needed
DROP TABLE IF EXISTS public.tournament_matches;