-- Add is_admin column to profiles if it doesn't exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Add display_name column to profiles for better name handling  
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Fix admin access function to use profiles table
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean 
LANGUAGE sql 
STABLE 
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.is_admin = true
  );
$$;

-- Drop existing views if they exist
DROP VIEW IF EXISTS public.v_referral_earnings_detailed CASCADE;
DROP VIEW IF EXISTS public.v_top_referrers_30d_named CASCADE; 
DROP VIEW IF EXISTS public.v_admin_referral_overview CASCADE;
DROP VIEW IF EXISTS public.v_admin_payout_queue CASCADE;

-- Rich detail view that joins names/emails (for cards, leaderboard, tables)
CREATE VIEW public.v_referral_earnings_detailed AS
SELECT
  e.id,
  e.created_at,
  e.level,
  e.status,
  e.locked_until,
  'GBP'::text as currency,
  e.amount * 100 as gross_amount_cents,
  CASE 
    WHEN e.level = 'L1' THEN 15
    WHEN e.level = 'L2' THEN 10
    ELSE 0
  END as rate,
  e.amount * 100 as commission_cents,
  e.paid_payout_id,
  e.user_id as referrer_id,
  COALESCE(
    rfer.display_name, 
    TRIM(rfer.first_name || ' ' || COALESCE(rfer.last_name, '')),
    rfer.email, 
    'Unknown'
  ) as referrer_name,
  e.referred_user_id,
  COALESCE(
    rfd.display_name,
    TRIM(rfd.first_name || ' ' || COALESCE(rfd.last_name, '')), 
    rfd.email, 
    'Unknown'
  ) as referred_name,
  e.referral_id
FROM referral_earnings e
LEFT JOIN profiles rfer ON rfer.id = e.user_id
LEFT JOIN profiles rfd ON rfd.id = e.referred_user_id;

-- Leaderboard (last 30d) with names
CREATE VIEW public.v_top_referrers_30d_named AS
SELECT
  e.user_id as referrer_id,
  COALESCE(
    p.display_name,
    TRIM(p.first_name || ' ' || COALESCE(p.last_name, '')),
    p.email, 
    'Unknown'
  ) as referrer_name,
  SUM(e.amount * 100) as total_cents
FROM referral_earnings e
LEFT JOIN profiles p ON p.id = e.user_id
WHERE e.created_at >= NOW() - INTERVAL '30 days'
GROUP BY 1, 2
ORDER BY total_cents DESC;

-- Overview cards view
CREATE VIEW public.v_admin_referral_overview AS
SELECT
  (SELECT COALESCE(SUM(amount * 100), 0) FROM referral_earnings WHERE status IN ('pending', 'paid')) as total_earned_cents,
  (SELECT COALESCE(SUM(amount * 100), 0) FROM referral_earnings WHERE status = 'paid') as total_paid_cents,
  (SELECT COALESCE(SUM(amount * 100), 0) FROM referral_earnings WHERE status = 'pending') as total_pending_cents,
  (SELECT COUNT(*) FROM referrals) as total_referrals;

-- Payout queue (ready to "Pay now")
CREATE VIEW public.v_admin_payout_queue AS
SELECT
  user_id as payee_id,
  COALESCE(
    p.display_name,
    TRIM(p.first_name || ' ' || COALESCE(p.last_name, '')),
    p.email, 
    'Unknown'
  ) as payee_name,
  'GBP'::text as currency,
  SUM(amount * 100) as payable_cents
FROM referral_earnings e
LEFT JOIN profiles p ON p.id = e.user_id
WHERE e.status = 'pending' AND (e.locked_until IS NULL OR e.locked_until <= NOW())
GROUP BY 1, 2;

-- Grant necessary permissions
GRANT SELECT ON public.v_referral_earnings_detailed TO authenticated;
GRANT SELECT ON public.v_top_referrers_30d_named TO authenticated;
GRANT SELECT ON public.v_admin_referral_overview TO authenticated;
GRANT SELECT ON public.v_admin_payout_queue TO authenticated;