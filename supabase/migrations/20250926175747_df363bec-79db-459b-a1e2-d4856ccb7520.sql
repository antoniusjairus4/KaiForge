-- Drop the drills table
DROP TABLE IF EXISTS public.drills;

-- Create tournament_matches table
CREATE TABLE public.tournament_matches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tournament_name TEXT NOT NULL,
  tournament_type TEXT NOT NULL,
  round TEXT NOT NULL,
  opponent_name TEXT NOT NULL,
  result TEXT NOT NULL,
  score TEXT,
  notes TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on tournament_matches
ALTER TABLE public.tournament_matches ENABLE ROW LEVEL SECURITY;

-- Create policies for tournament_matches
CREATE POLICY "Users can view their own tournament matches" 
ON public.tournament_matches 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tournament matches" 
ON public.tournament_matches 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tournament matches" 
ON public.tournament_matches 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tournament matches" 
ON public.tournament_matches 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add tournament_reference to performances table
ALTER TABLE public.performances 
ADD COLUMN tournament_reference UUID;

-- Add foreign key constraint
ALTER TABLE public.performances 
ADD CONSTRAINT fk_performances_tournament_reference 
FOREIGN KEY (tournament_reference) 
REFERENCES public.tournament_matches(id);

-- Create trigger for tournament_matches timestamps
CREATE TRIGGER update_tournament_matches_updated_at
BEFORE UPDATE ON public.tournament_matches
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();