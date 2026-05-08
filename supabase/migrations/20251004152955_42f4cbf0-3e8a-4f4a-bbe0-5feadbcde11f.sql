-- Phase 1: Secure User Roles Table
-- Only admins can manage user roles to prevent privilege escalation
CREATE POLICY "Admins can insert user roles" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update user roles" 
ON public.user_roles 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete user roles" 
ON public.user_roles 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Phase 1.3: Add DELETE policy for payment submissions (admin cleanup)
CREATE POLICY "Admins can delete payment submissions" 
ON public.payment_submissions 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Phase 2: Subscription Management Policies
-- Only admins can manually create or delete subscriptions
-- (User subscriptions are auto-created by handle_new_user() trigger)
CREATE POLICY "Admins can insert subscriptions" 
ON public.subscriptions 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete subscriptions" 
ON public.subscriptions 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));