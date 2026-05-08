-- Create tournaments table
CREATE TABLE IF NOT EXISTS public.tournaments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  location TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;

-- Create policies for tournaments
CREATE POLICY "Users can view their own tournaments" 
ON public.tournaments 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tournaments" 
ON public.tournaments 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tournaments" 
ON public.tournaments 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tournaments" 
ON public.tournaments 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_tournaments_updated_at
BEFORE UPDATE ON public.tournaments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update tournament_matches to reference tournament by ID
ALTER TABLE public.tournament_matches 
ADD COLUMN IF NOT EXISTS tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_tournament_matches_tournament_id 
ON public.tournament_matches(tournament_id);

-- Add R128 and PQF rounds to match requirements
-- (existing rounds already support R64, R32, R16, QF, SF, Finals)