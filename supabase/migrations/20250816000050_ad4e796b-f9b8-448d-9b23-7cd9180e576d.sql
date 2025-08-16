-- Fix RLS policies for active_sessions table to allow proper session management
-- The current policies are too restrictive and causing 500 errors during registration

-- Drop existing policies
DROP POLICY IF EXISTS "Enable session deletion for cleanup" ON public.active_sessions;
DROP POLICY IF EXISTS "Enable session insertion for all users" ON public.active_sessions;  
DROP POLICY IF EXISTS "Enable session updates for all users" ON public.active_sessions;
DROP POLICY IF EXISTS "Restrict session data viewing to admins only" ON public.active_sessions;

-- Create new, more permissive policies for session management
CREATE POLICY "Allow anyone to insert session data" 
ON public.active_sessions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow anyone to update session data"
ON public.active_sessions 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow anyone to delete session data"
ON public.active_sessions 
FOR DELETE 
USING (true);

CREATE POLICY "Restrict session viewing to admins"
ON public.active_sessions 
FOR SELECT 
USING (is_admin());