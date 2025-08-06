-- Update remaining table policies

-- Update active_sessions policies
DROP POLICY IF EXISTS "Active sessions are publicly readable for count" ON public.active_sessions;
DROP POLICY IF EXISTS "Anyone can create active sessions" ON public.active_sessions;
DROP POLICY IF EXISTS "Anyone can update their session" ON public.active_sessions;

CREATE POLICY "Public can view session count only" 
ON public.active_sessions 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create sessions" 
ON public.active_sessions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update sessions" 
ON public.active_sessions 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete sessions" 
ON public.active_sessions 
FOR DELETE 
USING (true);

-- Update song_plays policies
CREATE POLICY "Anyone can create play logs" 
ON public.song_plays 
FOR INSERT 
WITH CHECK (true);

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