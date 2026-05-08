-- Create league_matches table for tracking league matches within tournaments
CREATE TABLE public.league_matches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  opponent_name TEXT NOT NULL,
  score TEXT NOT NULL,
  result TEXT NOT NULL,
  points_gained INTEGER NOT NULL DEFAULT 0,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.league_matches ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
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
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own league matches"
ON public.league_matches
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_league_matches_updated_at
BEFORE UPDATE ON public.league_matches
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();