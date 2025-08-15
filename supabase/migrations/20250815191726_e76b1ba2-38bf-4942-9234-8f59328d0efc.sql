-- Fix all potential security definer views by explicitly setting security_invoker=on
-- This ensures all views use the querying user's permissions, not the view creator's

-- Fix public_profiles view
ALTER VIEW IF EXISTS public.public_profiles SET (security_invoker=on);

-- Fix public_testimonies view  
ALTER VIEW IF EXISTS public.public_testimonies SET (security_invoker=on);

-- Fix referral views
ALTER VIEW IF EXISTS public.v_my_referral_totals SET (security_invoker=on);
ALTER VIEW IF EXISTS public.v_referral_earnings_detailed SET (security_invoker=on);
ALTER VIEW IF EXISTS public.v_referral_summary SET (security_invoker=on);
ALTER VIEW IF EXISTS public.v_top_referrers_last30 SET (security_invoker=on);