-- Fix search path security vulnerability in get_referral_count function
-- Also fix table reference from 'referrals' to 'referral_rewards' which appears to be the correct table
CREATE OR REPLACE FUNCTION public.get_referral_count()
 RETURNS TABLE(count bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  RETURN QUERY
  SELECT COUNT(*)::BIGINT as count
  FROM public.referral_rewards;
END;
$function$