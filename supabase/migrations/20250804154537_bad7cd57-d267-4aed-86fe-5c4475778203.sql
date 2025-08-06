-- Update lyrics policies
DROP POLICY IF EXISTS "Anyone can view lyrics for featured songs" ON public.lyrics;

CREATE POLICY "Anyone can view lyrics" 
ON public.lyrics 
FOR SELECT 
USING (true);

CREATE POLICY "Only admins can insert lyrics" 
ON public.lyrics 
FOR INSERT 
WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Only admins can update lyrics" 
ON public.lyrics 
FOR UPDATE 
USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Only admins can delete lyrics" 
ON public.lyrics 
FOR DELETE 
USING (public.get_user_role(auth.uid()) = 'admin');

-- Update testimonials policies
DROP POLICY IF EXISTS "Anyone can view approved testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "Users can view their own testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "Users can create testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "Users can update their own pending testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "Admins can manage all testimonials" ON public.testimonials;

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

CREATE POLICY "Admins can update all testimonials" 
ON public.testimonials 
FOR UPDATE 
USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can delete all testimonials" 
ON public.testimonials 
FOR DELETE 
USING (public.get_user_role(auth.uid()) = 'admin');