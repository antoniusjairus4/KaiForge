-- Create drills table
CREATE TABLE public.drills (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  drill_name TEXT NOT NULL,
  skill_focus TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  description TEXT NOT NULL,
  key_tips TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.drills ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (drills are the same for everyone)
CREATE POLICY "Anyone can view drills" 
ON public.drills 
FOR SELECT 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_drills_updated_at
BEFORE UPDATE ON public.drills
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();