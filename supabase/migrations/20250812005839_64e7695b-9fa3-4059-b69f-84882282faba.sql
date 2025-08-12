-- Migration: Referral analytics views, payment linkage, and refund reversal

-- 1) Link earnings to payments (for precise refunds)
ALTER TABLE public.referral_earnings
  ADD COLUMN IF NOT EXISTS payment_id uuid;

CREATE INDEX IF NOT EXISTS idx_referral_earnings_payment_id
  ON public.referral_earnings(payment_id);

-- 2) New function: process earnings with payment id (v2)
CREATE OR REPLACE FUNCTION public.insert_referral_earnings_after_payment_v2(
  p_payment_id uuid,
  payer_id uuid,
  payment_amount numeric
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  first_gen UUID;
  second_gen UUID;
BEGIN
  -- Only process if payment amount meets minimum threshold (£25)
  IF payment_amount < 25.00 THEN
    RETURN;
  END IF;

  -- Find 1st Generation referrer
  SELECT referrer_id INTO first_gen
  FROM public.referrals
  WHERE referred_user_id = payer_id AND generation = 1;

  -- Insert 1st generation earning (15%)
  IF first_gen IS NOT NULL THEN
    INSERT INTO public.referral_earnings (payment_id, user_id, referred_user_id, generation, amount, status)
    VALUES (p_payment_id, first_gen, payer_id, 1, ROUND(payment_amount * 0.15, 2), 'pending');
  END IF;

  -- Find 2nd Generation referrer (of the 1st Gen)
  SELECT referrer_id INTO second_gen
  FROM public.referrals
  WHERE referred_user_id = first_gen AND generation = 1;

  -- Insert 2nd generation earning (10%)
  IF second_gen IS NOT NULL THEN
    INSERT INTO public.referral_earnings (payment_id, user_id, referred_user_id, generation, amount, status)
    VALUES (p_payment_id, second_gen, payer_id, 2, ROUND(payment_amount * 0.10, 2), 'pending');
  END IF;
END;
$$;

-- 3) Refund helper: reverse by payment id (keeps paid intact)
CREATE OR REPLACE FUNCTION public.reverse_referral_earnings_for_payment(
  p_payment_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  UPDATE public.referral_earnings
     SET status = 'reversed', updated_at = now()
   WHERE payment_id = p_payment_id
     AND status <> 'paid';
END;
$$;

-- 4) Update payment triggers to use v2 and handle refunds
CREATE OR REPLACE FUNCTION public.on_payment_insert_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Only process successful payments that meet minimum threshold
  IF NEW.status = 'succeeded' AND NEW.amount >= 25.00 THEN
    PERFORM public.insert_referral_earnings_after_payment_v2(NEW.id, NEW.user_id, NEW.amount);
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.on_payment_update_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- When status changes to succeeded and meets minimum amount -> create earnings
  IF OLD.status IS DISTINCT FROM 'succeeded' AND NEW.status = 'succeeded' AND NEW.amount >= 25.00 THEN
    PERFORM public.insert_referral_earnings_after_payment_v2(NEW.id, NEW.user_id, NEW.amount);
  -- If payment gets refunded/void/failed -> reverse earnings (unless already paid)
  ELSIF NEW.status IN ('refunded','void','failed') AND (OLD.status IS DISTINCT FROM NEW.status) THEN
    PERFORM public.reverse_referral_earnings_for_payment(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

-- Ensure triggers are attached on payments table
DROP TRIGGER IF EXISTS on_payment_insert_trigger ON public.payments;
CREATE TRIGGER on_payment_insert_trigger
AFTER INSERT ON public.payments
FOR EACH ROW EXECUTE FUNCTION public.on_payment_insert_trigger();

DROP TRIGGER IF EXISTS on_payment_update_trigger ON public.payments;
CREATE TRIGGER on_payment_update_trigger
AFTER UPDATE OF status ON public.payments
FOR EACH ROW EXECUTE FUNCTION public.on_payment_update_trigger();

-- 5) Views for UI
-- Summary per user
CREATE OR REPLACE VIEW public.v_referral_summary AS
SELECT
  p.id AS user_id,
  COALESCE(SUM(CASE WHEN e.status <> 'reversed' THEN e.amount ELSE 0 END), 0) AS total_earned,
  COALESCE(SUM(CASE WHEN e.status = 'pending' THEN e.amount ELSE 0 END), 0) AS pending_earnings,
  COALESCE(SUM(CASE WHEN e.status = 'paid' THEN e.amount ELSE 0 END), 0) AS paid_earnings,
  (SELECT COUNT(*) FROM public.referrals r WHERE r.referrer_id = p.id AND r.generation = 1) AS direct_referrals,
  (SELECT COUNT(*) FROM public.referrals r WHERE r.referrer_id = p.id AND r.generation = 2) AS indirect_referrals
FROM public.profiles p
LEFT JOIN public.referral_earnings e ON e.user_id = p.id
GROUP BY p.id;

-- Top referrers last 30 days (RLS will scope to own rows for non-admins)
CREATE OR REPLACE VIEW public.v_top_referrers_last30 AS
SELECT
  e.user_id AS earner_id,
  COALESCE(SUM(e.amount), 0) AS earned_30d,
  COUNT(*)::bigint AS earning_events
FROM public.referral_earnings e
WHERE e.status <> 'reversed'
  AND e.created_at >= now() - interval '30 days'
GROUP BY e.user_id
ORDER BY earned_30d DESC
LIMIT 100;

-- Detailed lines with optional payment info
CREATE OR REPLACE VIEW public.v_referral_earnings_detailed AS
SELECT
  e.id,
  e.user_id,
  e.referred_user_id,
  e.generation,
  e.amount,
  e.status,
  e.created_at,
  e.updated_at,
  e.payment_id,
  p.amount AS payment_amount,
  p.currency AS payment_currency,
  p.created_at AS payment_created_at
FROM public.referral_earnings e
LEFT JOIN public.payments p ON p.id = e.payment_id;