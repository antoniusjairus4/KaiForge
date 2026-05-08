-- Fix security issue: Ensure profiles are only accessible to authenticated users who own them
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Add DELETE policy so users can delete their own profile data
CREATE POLICY "Users can delete their own profile" 
ON public.profiles 
FOR DELETE 
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);