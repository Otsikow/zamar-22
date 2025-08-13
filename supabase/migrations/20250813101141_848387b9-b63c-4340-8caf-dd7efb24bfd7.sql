-- Fix Security Definer View warnings by removing SECURITY DEFINER from functions that don't need it
-- Some TABLE-returning functions are flagged as "Security Definer Views"
-- We'll keep SECURITY DEFINER only for functions that truly need admin access

-- Functions that can work without SECURITY DEFINER (public data):
-- - get_referral_count: just counts public referral_rewards
-- - get_referral_totals: sums public referral_rewards
-- - get_monthly_referral_stats: aggregates public data

-- Remove SECURITY DEFINER from get_referral_count
DROP FUNCTION IF EXISTS public.get_referral_count();
CREATE OR REPLACE FUNCTION public.get_referral_count()
RETURNS TABLE(count bigint)
LANGUAGE plpgsql
STABLE
SET search_path TO ''
AS $function$
BEGIN
  RETURN QUERY
  SELECT COUNT(*)::BIGINT as count
  FROM public.referral_rewards;
END;
$function$;

-- Remove SECURITY DEFINER from get_referral_totals
DROP FUNCTION IF EXISTS public.get_referral_totals();
CREATE OR REPLACE FUNCTION public.get_referral_totals()
RETURNS TABLE(total numeric)
LANGUAGE plpgsql
STABLE
SET search_path TO ''
AS $function$
BEGIN
  RETURN QUERY
  SELECT COALESCE(SUM(reward_amount), 0) as total
  FROM public.referral_rewards;
END;
$function$;

-- Remove SECURITY DEFINER from get_monthly_referral_stats
DROP FUNCTION IF EXISTS public.get_monthly_referral_stats();
CREATE OR REPLACE FUNCTION public.get_monthly_referral_stats()
RETURNS TABLE(total numeric)
LANGUAGE plpgsql
STABLE
SET search_path TO ''
AS $function$
BEGIN
  RETURN QUERY
  SELECT COALESCE(SUM(reward_amount), 0) as total
  FROM public.referral_rewards
  WHERE created_at >= date_trunc('month', CURRENT_DATE)
    AND created_at < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month';
END;
$function$;

SELECT 'Removed SECURITY DEFINER from non-admin table-returning functions' as status;