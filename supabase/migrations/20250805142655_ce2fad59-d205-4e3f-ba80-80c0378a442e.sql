-- Fix search path security vulnerability in add_manual_referral_reward function
CREATE OR REPLACE FUNCTION public.add_manual_referral_reward(p_user_id uuid, p_referred_user_id uuid, p_payment_amount numeric, p_reward_amount numeric, p_level integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  INSERT INTO public.referral_rewards (
    user_id,
    referred_user_id,
    payment_amount,
    reward_amount,
    level,
    reward_type
  ) VALUES (
    p_user_id,
    p_referred_user_id,
    p_payment_amount,
    p_reward_amount,
    p_level,
    'manual_adjustment'
  );
END;
$function$