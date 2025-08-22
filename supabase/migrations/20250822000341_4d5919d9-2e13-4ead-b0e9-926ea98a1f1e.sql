-- Drop the problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "profiles: admin read all" ON public.profiles;
DROP POLICY IF EXISTS "profiles: admin update" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage account status" ON public.profiles;

-- Add admin policies that use the admin_users table directly (no recursion)
CREATE POLICY "Admins can view all profiles via admin_users" 
ON public.profiles 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.admin_users au 
  WHERE au.user_id = auth.uid() AND au.role = 'admin'
));

CREATE POLICY "Admins can update profiles via admin_users" 
ON public.profiles 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.admin_users au 
  WHERE au.user_id = auth.uid() AND au.role = 'admin'
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.admin_users au 
  WHERE au.user_id = auth.uid() AND au.role = 'admin'
));