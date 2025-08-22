-- Fix infinite recursion in profiles RLS policies
DROP POLICY IF EXISTS "profiles: admin read all" ON public.profiles;
DROP POLICY IF EXISTS "profiles: admin update" ON public.profiles;

-- Create clean RLS policies without circular references
CREATE POLICY "Users can view own profile only" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Service role can update profiles" 
ON public.profiles 
FOR UPDATE 
USING (auth.role() = 'service_role') 
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can insert profiles" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.role() = 'service_role' OR auth.uid() = id);

-- Update is_admin function to use admin_users table instead of profiles
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.admin_users au
    WHERE au.user_id = auth.uid() AND au.role = 'admin'
  );
$$;