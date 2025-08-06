-- Fix search path security vulnerability in get_all_referral_rewards function
CREATE OR REPLACE FUNCTION public.get_all_referral_rewards()
 RETURNS TABLE(id uuid, user_id uuid, referred_user_id uuid, payment_amount numeric, reward_amount numeric, level integer, reward_type text, created_at timestamp with time zone, referrer_first_name text, referrer_last_name text, referrer_email text, referred_first_name text, referred_last_name text, referred_email text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    rr.id,
    rr.user_id,
    rr.referred_user_id,
    rr.payment_amount,
    rr.reward_amount,
    rr.level,
    rr.reward_type,
    rr.created_at,
    p1.first_name as referrer_first_name,
    p1.last_name as referrer_last_name,
    p1.email as referrer_email,
    p2.first_name as referred_first_name,
    p2.last_name as referred_last_name,
    p2.email as referred_email
  FROM public.referral_rewards rr
  LEFT JOIN public.profiles p1 ON p1.id = rr.user_id
  LEFT JOIN public.profiles p2 ON p2.id = rr.referred_user_id
  ORDER BY rr.created_at DESC
  LIMIT 50;
END;
$function$