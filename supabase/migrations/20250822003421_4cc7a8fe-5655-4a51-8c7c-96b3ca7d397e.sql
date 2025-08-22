-- Fix infinite recursion in profiles RLS policies

-- 1) Remove the recursive policies
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Self can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Self can update own non-role" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all" ON public.profiles;
DROP POLICY IF EXISTS "Prevent profile deletion" ON public.profiles;
DROP POLICY IF EXISTS "p_profiles_read_public" ON public.profiles;

-- 2) Safe admin checker (no recursion)
CREATE OR REPLACE FUNCTION public.is_admin(uid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = uid AND role = 'admin'
  );
$$;

-- Overload for current user
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Lock down execution to authenticated users
REVOKE ALL ON FUNCTION public.is_admin(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.is_admin() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- 3) Recreate RLS policies using the helper
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Read own row
CREATE POLICY "self can read own profile"
ON public.profiles FOR SELECT
USING (id = auth.uid());

-- Admins can read all rows (NO recursion now)
CREATE POLICY "admins can read all profiles"
ON public.profiles FOR SELECT
USING (public.is_admin(auth.uid()));

-- Users can update their own NON-role fields
CREATE POLICY "self can update own non-role"
ON public.profiles FOR UPDATE
USING (id = auth.uid())
WITH CHECK (id = auth.uid() AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()));

-- Admins can update anyone (including role)
CREATE POLICY "admins can update all"
ON public.profiles FOR UPDATE
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Prevent profile deletion
CREATE POLICY "prevent profile deletion"
ON public.profiles FOR DELETE
USING (false);

-- 4) Backfill profiles for any auth.users without a profile row
INSERT INTO public.profiles (id, email)
SELECT u.id, u.email
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;

-- 5) Fix admin_counts function to avoid recursion
CREATE OR REPLACE FUNCTION public.admin_counts()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN (
    WITH t AS (SELECT count(*)::int AS total FROM profiles),
         a AS (SELECT count(*)::int AS c FROM profiles WHERE role='admin'),
         s AS (SELECT count(*)::int AS c FROM profiles WHERE role='supporter'),
         l AS (SELECT count(*)::int AS c FROM profiles WHERE role='listener')
    SELECT json_build_object(
      'total', (SELECT total FROM t),
      'admins', (SELECT c FROM a),
      'supporters', (SELECT c FROM s),
      'listeners', (SELECT c FROM l)
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_counts() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_counts() TO authenticated;