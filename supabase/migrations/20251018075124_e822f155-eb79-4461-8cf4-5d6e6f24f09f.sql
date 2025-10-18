-- Fix profiles table RLS policy to prevent public access to user contact information
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Add database-level constraints for maid rates validation
ALTER TABLE public.maids 
ADD CONSTRAINT check_hourly_rate_positive 
CHECK (hourly_rate > 0 AND hourly_rate < 10000);

ALTER TABLE public.maids 
ADD CONSTRAINT check_daily_rate_positive 
CHECK (daily_rate > 0 AND daily_rate < 50000);

ALTER TABLE public.maids 
ADD CONSTRAINT check_monthly_rate_positive 
CHECK (monthly_rate > 0 AND monthly_rate < 500000);