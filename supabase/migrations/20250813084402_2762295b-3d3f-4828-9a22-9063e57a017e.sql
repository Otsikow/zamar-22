-- Fix active_sessions security vulnerability by restricting access to aggregate data only
-- and creating a secure function for session counting

-- Drop the overly permissive public read policy
DROP POLICY IF EXISTS "Public can view session count only" ON public.active_sessions;

-- Create a secure function that only returns session counts (no sensitive data)
CREATE OR REPLACE FUNCTION public.get_active_session_count(minutes_threshold integer DEFAULT 2)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path TO 'public'
AS $$
  SELECT COUNT(*)::integer
  FROM public.active_sessions
  WHERE last_ping >= (now() - (minutes_threshold || ' minutes')::interval);
$$;

-- Create a more restrictive policy for session management
-- Only allow reading aggregate counts through the function, not raw data
CREATE POLICY "Restrict session data access" 
ON public.active_sessions 
FOR SELECT 
USING (false); -- Block all direct access to session data

-- Keep insert/update/delete policies for session management
-- These are needed for the LiveCounter functionality
-- But ensure they don't expose sensitive data

-- Update the insert policy to be more specific
DROP POLICY IF EXISTS "Anyone can create sessions" ON public.active_sessions;
CREATE POLICY "Allow session creation" 
ON public.active_sessions 
FOR INSERT 
WITH CHECK (true); -- Allow session creation but not reading

-- Update the update policy 
DROP POLICY IF EXISTS "Anyone can update sessions" ON public.active_sessions;
CREATE POLICY "Allow session updates" 
ON public.active_sessions 
FOR UPDATE 
USING (true); -- Allow session updates for heartbeat

-- Update delete policy for cleanup
DROP POLICY IF EXISTS "Anyone can delete sessions" ON public.active_sessions;
CREATE POLICY "Allow session cleanup" 
ON public.active_sessions 
FOR DELETE 
USING (true); -- Allow deletion for cleanup

-- Grant execute permission on the count function to authenticated and anonymous users
GRANT EXECUTE ON FUNCTION public.get_active_session_count TO authenticated, anon;