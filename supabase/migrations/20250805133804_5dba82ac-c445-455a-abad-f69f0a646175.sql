-- Fix search path security vulnerability in get_top_referrers function
CREATE OR REPLACE FUNCTION public.get_top_referrers()
 RETURNS TABLE(user_id uuid, first_name text, last_name text, email text, total_earned numeric, reward_count bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    rr.user_id,
    p.first_name,
    p.last_name,
    p.email,
    SUM(rr.reward_amount) as total_earned,
    COUNT(*)::BIGINT as reward_count
  FROM public.referral_rewards rr
  LEFT JOIN public.profiles p ON p.id = rr.user_id
  WHERE rr.user_id IS NOT NULL
  GROUP BY rr.user_id, p.first_name, p.last_name, p.email
  ORDER BY total_earned DESC
  LIMIT 10;
END;
$function$