-- 4. Clean RLS policies for profiles table
DROP POLICY IF EXISTS "Users can view own profile only" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile only" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile data" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles via admin_users" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update profiles via admin_users" ON public.profiles;

-- Users can see their own profile
CREATE POLICY "Self can read own profile"
ON public.profiles FOR SELECT
USING (id = auth.uid());

-- Admins can read all profiles
CREATE POLICY "Admins can read all profiles"
ON public.profiles FOR SELECT
USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

-- Users can update their own NON-role fields
CREATE POLICY "Self can update own non-role"
ON public.profiles FOR UPDATE
USING (id = auth.uid())
WITH CHECK (id = auth.uid() AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()));

-- Admins can update anyone (including role)
CREATE POLICY "Admins can update all"
ON public.profiles FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);