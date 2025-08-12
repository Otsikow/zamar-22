-- Fix SECURITY DEFINER issue by recreating the view with SECURITY INVOKER semantics
-- Drop existing view if present
DROP VIEW IF EXISTS public.v_referral_earnings_detailed;

-- Recreate the view with invoker rights so RLS of underlying tables applies to the querying user
CREATE VIEW public.v_referral_earnings_detailed
WITH (security_invoker = on)
AS
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
  p.amount  AS payment_amount,
  p.currency AS payment_currency,
  p.created_at AS payment_created_at
FROM public.referral_earnings re
LEFT JOIN public.payments p ON p.id = re.payment_id;