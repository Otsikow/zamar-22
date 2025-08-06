
-- Remove the problematic donation_analytics view that bypasses RLS
DROP VIEW IF EXISTS public.donation_analytics;
