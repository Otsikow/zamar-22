-- Ensure the view runs with invoker rights so RLS applies
ALTER VIEW public.v_referral_summary SET (security_invoker = on);