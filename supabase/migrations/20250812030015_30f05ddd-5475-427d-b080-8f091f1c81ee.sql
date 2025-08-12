-- Ensure the view runs with invoker rights so RLS applies
ALTER VIEW public.v_top_referrers_last30 SET (security_invoker = on);