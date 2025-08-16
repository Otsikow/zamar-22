-- Fix security definer view to use security invoker
-- This ensures RLS policies are properly enforced for users querying the view
ALTER VIEW public.public_testimonies SET (security_invoker=on);