-- Fix remaining security warnings from linter

-- Fix search path vulnerabilities in remaining functions
CREATE OR REPLACE FUNCTION public.get_user_referral_stats(target_user_id uuid)
RETURNS TABLE(total_referrals bigint, active_referrals bigint, inactive_referrals bigint, total_earned numeric, paid_earnings numeric, pending_earnings numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.get_top_referrers()
RETURNS TABLE(user_id uuid, first_name text, last_name text, email text, total_earned numeric, reward_count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.reverse_referral_earnings_for_payment(p_payment_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  UPDATE public.referral_earnings
     SET status = 'reversed', updated_at = now()
   WHERE payment_id = p_payment_id
     AND status <> 'paid';
END;
$$;

CREATE OR REPLACE FUNCTION public.process_referral_earnings(new_user uuid, payment_amount numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.mark_referral_earnings_as_paid(earnings_ids uuid[], payout_method text DEFAULT 'manual payout'::text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  eid uuid;
  uid uuid;
  amt numeric(10,2);
BEGIN
  -- Loop through all provided earning IDs
  FOREACH eid IN ARRAY earnings_ids
  LOOP
    -- Get data before updating
    SELECT user_id, amount INTO uid, amt
    FROM public.referral_earnings
    WHERE id = eid AND status = 'pending';

    -- Only proceed if record exists and is pending
    IF FOUND THEN
      -- Update referral earnings
      UPDATE public.referral_earnings
      SET status = 'paid'
      WHERE id = eid;

      -- Log into payouts table for traceability
      INSERT INTO public.payouts (user_id, amount, method, notes)
      VALUES (uid, amt, payout_method, 'Auto-logged from admin bulk update');
    END IF;

  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.add_manual_referral_reward(p_user_id uuid, p_referred_user_id uuid, p_payment_amount numeric, p_reward_amount numeric, p_level integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.get_all_referral_rewards()
RETURNS TABLE(id uuid, user_id uuid, referred_user_id uuid, payment_amount numeric, reward_amount numeric, level integer, reward_type text, created_at timestamp with time zone, referrer_first_name text, referrer_last_name text, referrer_email text, referred_first_name text, referred_last_name text, referred_email text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
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
$$;