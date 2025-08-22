-- 5. Create helper functions for admin management
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin');
$$;

-- 6. Migrate existing admin users from admin_users table to profiles table
UPDATE public.profiles 
SET role = 'admin' 
WHERE id IN (
  SELECT user_id FROM public.admin_users WHERE role = 'admin'
);

-- 7. Ensure profiles exist for all auth users (backfill)
INSERT INTO public.profiles (id, email, full_name, role)
SELECT 
  u.id, 
  u.email, 
  COALESCE(u.raw_user_meta_data->>'full_name', ''),
  'listener'
FROM auth.users u
WHERE u.id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- 8. Create admin counts function
CREATE OR REPLACE FUNCTION public.admin_counts()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  -- Check if caller is admin
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;
  
  RETURN (
    WITH 
      tot AS (SELECT COUNT(*)::int AS total FROM public.profiles),
      admins AS (SELECT COUNT(*)::int AS c FROM public.profiles WHERE role = 'admin'),
      supporters AS (SELECT COUNT(*)::int AS c FROM public.profiles WHERE role = 'supporter'),
      listeners AS (SELECT COUNT(*)::int AS c FROM public.profiles WHERE role = 'listener')
    SELECT json_build_object(
      'total', (SELECT total FROM tot),
      'admins', (SELECT c FROM admins),
      'supporters', (SELECT c FROM supporters),
      'listeners', (SELECT c FROM listeners)
    )
  );
END;
$$;