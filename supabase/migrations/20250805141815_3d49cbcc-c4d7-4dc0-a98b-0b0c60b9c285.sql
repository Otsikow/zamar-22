-- Fix search path security vulnerability in get_monthly_referral_stats function
CREATE OR REPLACE FUNCTION public.get_monthly_referral_stats()
 RETURNS TABLE(total numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  RETURN QUERY
  SELECT COALESCE(SUM(reward_amount), 0) as total
  FROM public.referral_rewards
  WHERE created_at >= date_trunc('month', CURRENT_DATE)
    AND created_at < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month';
END;
$function$