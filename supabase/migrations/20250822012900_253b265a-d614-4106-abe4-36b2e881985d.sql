-- Fix security warning for get_active_session_count function
CREATE OR REPLACE FUNCTION public.get_active_session_count()
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = 'public', 'pg_temp'
AS $$
  SELECT COUNT(*)::integer
  FROM public.active_sessions
  WHERE last_ping > now() - interval '90 seconds'
$$;