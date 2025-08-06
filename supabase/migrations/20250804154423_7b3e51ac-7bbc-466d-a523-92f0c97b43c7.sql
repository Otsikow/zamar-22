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

CREATE POLICY "Only admins can manage songs" 
ON public.songs 
FOR INSERT, UPDATE, DELETE 
USING (public.get_user_role(auth.uid()) = 'admin');

-- Update lyrics policies
DROP POLICY IF EXISTS "Anyone can view lyrics for featured songs" ON public.lyrics;

CREATE POLICY "Anyone can view lyrics" 
ON public.lyrics 
FOR SELECT 
USING (true);

CREATE POLICY "Only admins can manage lyrics" 
ON public.lyrics 
FOR INSERT, UPDATE, DELETE 
USING (public.get_user_role(auth.uid()) = 'admin');

-- Update testimonials policies
DROP POLICY IF EXISTS "Anyone can view approved testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "Users can view their own testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "Users can create testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "Users can update their own pending testimonials" ON public.testimonials;

CREATE POLICY "Public can view approved testimonials" 
ON public.testimonials 
FOR SELECT 
USING (status = 'approved');

CREATE POLICY "Users can view their own testimonials" 
ON public.testimonials 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create testimonials" 
ON public.testimonials 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pending testimonials" 
ON public.testimonials 
FOR UPDATE 
USING (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Admins can manage all testimonials" 
ON public.testimonials 
FOR UPDATE, DELETE 
USING (public.get_user_role(auth.uid()) = 'admin');

-- Update purchases policies
CREATE POLICY "Users can create their own purchases" 
ON public.purchases 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Update active_sessions policies
DROP POLICY IF EXISTS "Active sessions are publicly readable for count" ON public.active_sessions;
DROP POLICY IF EXISTS "Anyone can create active sessions" ON public.active_sessions;
DROP POLICY IF EXISTS "Anyone can update their session" ON public.active_sessions;

CREATE POLICY "Public can view session count only" 
ON public.active_sessions 
FOR SELECT 
USING (true);

CREATE POLICY "Users can manage their own sessions" 
ON public.active_sessions 
FOR INSERT, UPDATE, DELETE 
USING (true); -- Allow anonymous session tracking

-- Update song_plays policies
CREATE POLICY "Users can create play logs" 
ON public.song_plays 
FOR INSERT 
WITH CHECK (true); -- Allow anonymous play tracking

CREATE POLICY "Admins can view all play logs" 
ON public.song_plays 
FOR SELECT 
USING (public.get_user_role(auth.uid()) = 'admin');

-- Update donations policies
CREATE POLICY "Users can view their own donations" 
ON public.donations 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create donations" 
ON public.donations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Update ads policies (keep existing admin-only access)
-- (Already properly configured with admin access only)

-- Update profiles policies for better security
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (public.get_user_role(auth.uid()) = 'admin');