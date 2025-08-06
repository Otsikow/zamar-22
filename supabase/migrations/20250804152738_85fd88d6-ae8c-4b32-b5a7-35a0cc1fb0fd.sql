-- Create ads table
CREATE TABLE public.ads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  ad_type TEXT NOT NULL CHECK (ad_type IN ('audio', 'banner')),
  media_url TEXT,
  target_url TEXT,
  is_active BOOLEAN DEFAULT true,
  frequency INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create song_plays table for analytics
CREATE TABLE public.song_plays (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  song_id UUID REFERENCES public.songs(id) ON DELETE CASCADE,
  user_id UUID,
  country TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create admin_users table
CREATE TABLE public.admin_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'moderator')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.song_plays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check admin status
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid()
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Ads policies
CREATE POLICY "Anyone can view active ads" 
ON public.ads 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage all ads" 
ON public.ads 
FOR ALL 
USING (public.is_admin());

-- Song plays policies (for analytics)
CREATE POLICY "Anyone can create song plays" 
ON public.song_plays 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can view all song plays" 
ON public.song_plays 
FOR SELECT 
USING (public.is_admin());

-- Admin users policies
CREATE POLICY "Admins can view all admin users" 
ON public.admin_users 
FOR SELECT 
USING (public.is_admin());

CREATE POLICY "Admins can manage admin users" 
ON public.admin_users 
FOR ALL 
USING (public.is_admin());

-- Update existing testimonials policies for admin access
CREATE POLICY "Admins can manage all testimonials" 
ON public.testimonials 
FOR ALL 
USING (public.is_admin());

-- Update existing custom_song_requests policies for admin access
CREATE POLICY "Admins can view all custom song requests" 
ON public.custom_song_requests 
FOR SELECT 
USING (public.is_admin());

CREATE POLICY "Admins can update all custom song requests" 
ON public.custom_song_requests 
FOR UPDATE 
USING (public.is_admin());

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_ads_updated_at
BEFORE UPDATE ON public.ads
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_admin_users_updated_at
BEFORE UPDATE ON public.admin_users
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();