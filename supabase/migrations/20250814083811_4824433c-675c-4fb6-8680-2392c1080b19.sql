-- Fix Security Definer View issue by recreating views with proper ownership and security

-- 1. Drop and recreate public_profiles view with security invoker behavior
-- This view currently bypasses RLS by showing all active profiles
DROP VIEW IF EXISTS public.public_profiles;

-- Create a more secure public_profiles view that respects RLS
CREATE VIEW public.public_profiles 
WITH (security_invoker = true) AS
SELECT 
  id,
  first_name,
  preferred_language,
  created_at
FROM public.profiles
WHERE account_status = 'active';

-- 2. Recreate v_referral_earnings_detailed with security invoker
DROP VIEW IF EXISTS public.v_referral_earnings_detailed;

CREATE VIEW public.v_referral_earnings_detailed
WITH (security_invoker = true) AS
SELECT 
  re.id,
  re.user_id,
  re.referred_user_id,
  re.generation,
  re.amount,
  re.status,
  re.payment_id,
  re.created_at,
  re.updated_at,
  p.amount AS payment_amount,
  p.currency AS payment_currency,
  p.created_at AS payment_created_at
FROM public.referral_earnings re
LEFT JOIN public.payments p ON p.id = re.payment_id;

-- 3. Recreate v_referral_summary with security invoker
DROP VIEW IF EXISTS public.v_referral_summary;

CREATE VIEW public.v_referral_summary
WITH (security_invoker = true) AS
SELECT 
  p.id AS user_id,
  COALESCE(SUM(
    CASE 
      WHEN e.status <> 'reversed' THEN e.amount 
      ELSE 0 
    END
  ), 0) AS total_earned,
  COALESCE(SUM(
    CASE 
      WHEN e.status = 'pending' THEN e.amount 
      ELSE 0 
    END
  ), 0) AS pending_earnings,
  COALESCE(SUM(
    CASE 
      WHEN e.status = 'paid' THEN e.amount 
      ELSE 0 
    END
  ), 0) AS paid_earnings,
  (SELECT COUNT(*) FROM public.referrals r 
   WHERE r.referrer_id = p.id AND r.generation = 1) AS direct_referrals,
  (SELECT COUNT(*) FROM public.referrals r 
   WHERE r.referrer_id = p.id AND r.generation = 2) AS indirect_referrals
FROM public.profiles p
LEFT JOIN public.referral_earnings e ON e.user_id = p.id
GROUP BY p.id;

-- 4. Recreate v_top_referrers_last30 with security invoker
DROP VIEW IF EXISTS public.v_top_referrers_last30;

CREATE VIEW public.v_top_referrers_last30
WITH (security_invoker = true) AS
SELECT 
  user_id AS earner_id,
  COALESCE(SUM(amount), 0) AS earned_30d,
  COUNT(*) AS earning_events
FROM public.referral_earnings e
WHERE status <> 'reversed' 
  AND created_at >= (now() - INTERVAL '30 days')
GROUP BY user_id
ORDER BY COALESCE(SUM(amount), 0) DESC
LIMIT 100;

-- 5. Add proper RLS policies for the views if needed
-- Ensure the underlying tables have proper RLS that will be respected by these views

-- Grant appropriate permissions to the views
GRANT SELECT ON public.public_profiles TO anon, authenticated;
GRANT SELECT ON public.v_referral_earnings_detailed TO authenticated;
GRANT SELECT ON public.v_referral_summary TO authenticated;  
GRANT SELECT ON public.v_top_referrers_last30 TO authenticated;