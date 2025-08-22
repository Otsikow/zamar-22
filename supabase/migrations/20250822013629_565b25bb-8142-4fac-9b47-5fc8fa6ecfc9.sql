-- Fix the core issue: is_admin function permissions for anonymous users
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO anon, authenticated;

-- Fix active_sessions RLS to allow anonymous inserts (for session tracking)
DROP POLICY IF EXISTS "Allow anyone to insert session data" ON public.active_sessions;
DROP POLICY IF EXISTS "Allow anyone to update session data" ON public.active_sessions; 
DROP POLICY IF EXISTS "Allow anyone to delete session data" ON public.active_sessions;

CREATE POLICY "Allow anyone to insert session data" 
ON public.active_sessions FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Allow anyone to update session data" 
ON public.active_sessions FOR UPDATE 
TO anon, authenticated
USING (true);

CREATE POLICY "Allow anyone to delete session data" 
ON public.active_sessions FOR DELETE 
TO anon, authenticated
USING (true);

-- Also fix public_testimonies table (it's being queried but needs RLS)
DROP POLICY IF EXISTS "Public can read approved public testimonies" ON public.public_testimonies;

ALTER TABLE public.public_testimonies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read approved public testimonies"
ON public.public_testimonies FOR SELECT
TO anon, authenticated
USING (true); -- public_testimonies is a view/table of already approved content