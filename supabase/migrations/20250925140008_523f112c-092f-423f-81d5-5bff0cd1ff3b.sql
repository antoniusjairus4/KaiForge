-- Create doubles_performances table
CREATE TABLE public.doubles_performances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  partner_name TEXT NOT NULL,
  opponent_names TEXT NOT NULL,
  result TEXT NOT NULL,
  score TEXT,
  notes TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.doubles_performances ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own doubles performances" 
ON public.doubles_performances 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own doubles performances" 
ON public.doubles_performances 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own doubles performances" 
ON public.doubles_performances 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own doubles performances" 
ON public.doubles_performances 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_doubles_performances_updated_at
BEFORE UPDATE ON public.doubles_performances
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();