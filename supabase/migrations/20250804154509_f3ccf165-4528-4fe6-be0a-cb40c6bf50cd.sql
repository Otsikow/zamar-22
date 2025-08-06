-- Create security definer function to check user roles
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT AS $$
  SELECT 
    CASE 
      WHEN EXISTS (SELECT 1 FROM public.admin_users WHERE admin_users.user_id = $1) THEN 'admin'
      ELSE 'user'
    END;
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- Update songs policies for better access control
DROP POLICY IF EXISTS "Featured songs are publicly viewable" ON public.songs;

CREATE POLICY "Anyone can view featured songs" 
ON public.songs 
FOR SELECT 
USING (featured = true);

CREATE POLICY "Authenticated users can view all songs" 
ON public.songs 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Only admins can insert songs" 
ON public.songs 
FOR INSERT 
WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Only admins can update songs" 
ON public.songs 
FOR UPDATE 
USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Only admins can delete songs" 
ON public.songs 
FOR DELETE 
USING (public.get_user_role(auth.uid()) = 'admin');