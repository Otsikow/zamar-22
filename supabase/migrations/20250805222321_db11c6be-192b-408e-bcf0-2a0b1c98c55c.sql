-- Fix function search path security warnings by setting search_path
CREATE OR REPLACE FUNCTION public.process_referral_earnings(new_user UUID, payment_amount NUMERIC)
RETURNS VOID AS $$
DECLARE
  first_gen UUID;
  second_gen UUID;
BEGIN
  -- Find 1st Generation referrer
  SELECT referrer_id INTO first_gen FROM public.referrals 
  WHERE referred_user_id = new_user AND generation = 1;

  -- Process 1st generation earning (15%)
  IF first_gen IS NOT NULL THEN
    INSERT INTO public.referral_earnings (user_id, referred_user_id, generation, amount)
    VALUES (first_gen, new_user, 1, ROUND(payment_amount * 0.15, 2));
  END IF;

  -- Find 2nd Generation referrer
  SELECT referrer_id INTO second_gen FROM public.referrals 
  WHERE referred_user_id = first_gen AND generation = 1;

  -- Process 2nd generation earning (10%)
  IF second_gen IS NOT NULL THEN
    INSERT INTO public.referral_earnings (user_id, referred_user_id, generation, amount)
    VALUES (second_gen, new_user, 2, ROUND(payment_amount * 0.10, 2));
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Fix get_user_referral_stats function search path
CREATE OR REPLACE FUNCTION public.get_user_referral_stats(target_user_id UUID)
RETURNS TABLE(
  total_referrals BIGINT,
  active_referrals BIGINT,
  inactive_referrals BIGINT,
  total_earned NUMERIC,
  paid_earnings NUMERIC,
  pending_earnings NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(DISTINCT r.referred_user_id)::BIGINT as total_referrals,
    COUNT(DISTINCT CASE WHEN p.id IS NOT NULL THEN r.referred_user_id END)::BIGINT as active_referrals,
    COUNT(DISTINCT CASE WHEN p.id IS NULL THEN r.referred_user_id END)::BIGINT as inactive_referrals,
    COALESCE(SUM(re.amount), 0) as total_earned,
    COALESCE(SUM(CASE WHEN re.status = 'paid' THEN re.amount ELSE 0 END), 0) as paid_earnings,
    COALESCE(SUM(CASE WHEN re.status = 'pending' THEN re.amount ELSE 0 END), 0) as pending_earnings
  FROM public.referrals r
  LEFT JOIN public.profiles p ON p.id = r.referred_user_id
  LEFT JOIN public.referral_earnings re ON re.user_id = target_user_id
  WHERE r.referrer_id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';