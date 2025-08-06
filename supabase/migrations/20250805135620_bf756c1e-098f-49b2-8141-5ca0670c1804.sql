-- Fix search path security vulnerability in get_referral_totals function
CREATE OR REPLACE FUNCTION public.get_referral_totals()
 RETURNS TABLE(total numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  RETURN QUERY
  SELECT COALESCE(SUM(reward_amount), 0) as total
  FROM public.referral_rewards;
END;
$function$