-- Fix RLS policies for anonymous access

-- 1. Fix testimonies RLS policies
DROP POLICY IF EXISTS "Public can read approved testimonies" ON public.testimonies;
DROP POLICY IF EXISTS "Authenticated can create testimonies" ON public.testimonies;

ALTER TABLE public.testimonies ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to read approved testimonies
CREATE POLICY "Public can read approved testimonies"
ON public.testimonies FOR SELECT
TO anon, authenticated
USING (status = 'approved');

-- Allow authenticated users to create testimonies
CREATE POLICY "Authenticated can create testimonies"
ON public.testimonies FOR INSERT
TO authenticated
WITH CHECK (true);

-- 2. Fix advertisements RLS policies
DROP POLICY IF EXISTS "Public can read active advertisements" ON public.advertisements;

ALTER TABLE public.advertisements ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to read active ads
CREATE POLICY "Public can read active ads"
ON public.advertisements FOR SELECT
TO anon, authenticated
USING (
  is_active = true
  AND (start_date IS NULL OR start_date <= now()::date)
  AND (end_date IS NULL OR end_date >= now()::date)
);

-- 3. Fix active sessions RPC for anonymous access
CREATE OR REPLACE FUNCTION public.get_active_session_count()
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::integer
  FROM active_sessions
  WHERE last_ping > now() - interval '90 seconds'
$$;

REVOKE ALL ON FUNCTION public.get_active_session_count() FROM public;
GRANT EXECUTE ON FUNCTION public.get_active_session_count() TO anon, authenticated;

-- 4. Add missing translation keys
INSERT INTO public.app_translations (language, key, value) VALUES
-- Hero section
('en', 'hero.stat1', 'Songs in the library'),
('en', 'hero.stat2', 'Worshippers online'),
('en', 'hero.stat3', 'Countries reached'),
('en', 'hero.title_line1', 'Worship with'),
('en', 'hero.title_line2', 'the Global Church'),
('en', 'hero.subtitle', 'Free streaming. Paid downloads. Spirit-led music.'),
('en', 'hero.create_song', 'Create a Song'),
('en', 'hero.suggest_song', 'Suggest a Song'),
('en', 'hero.radio', 'Radio'),

-- Featured section
('en', 'featured.title', 'Featured Songs'),

-- Video section
('en', 'video.how_zamar_works', 'How Zamar Works'),
('en', 'video.description', 'Discover the mission behind the music.'),
('en', 'video.learn_more', 'Learn More'),
('en', 'video.testimonials_title', 'Testimonies'),

-- Footer section
('en', 'footer.description', 'Zamar is a worship platform for the global Church.'),
('en', 'footer.faith_values', 'Faith & Values'),
('en', 'footer.follow_us', 'Follow Us'),
('en', 'footer.quick_links', 'Quick Links'),
('en', 'footer.about_us', 'About Us'),
('en', 'footer.song_library', 'Song Library'),
('en', 'footer.pricing', 'Pricing'),
('en', 'footer.create_song', 'Create Song'),
('en', 'footer.testimonies', 'Testimonies'),
('en', 'footer.support', 'Support'),
('en', 'footer.faq', 'FAQ'),
('en', 'footer.legal', 'Legal'),
('en', 'footer.terms_conditions', 'Terms & Conditions'),
('en', 'footer.contact_us', 'Contact Us'),
('en', 'footer.donate', 'Donate'),
('en', 'footer.support_mission', 'Support the Mission'),
('en', 'footer.rights', 'All rights reserved'),
('en', 'footer.faith_disclaimer', 'All content glorifies Jesus Christ.'),

-- Navigation
('en', 'nav.home', 'Home'),
('en', 'nav.songs', 'Songs'),
('en', 'nav.radio', 'Radio'),
('en', 'nav.library', 'Library'),
('en', 'nav.menu', 'Menu'),

-- Auth
('en', 'auth.signin', 'Sign in'),

-- App
('en', 'app.title', 'Zamar')

ON CONFLICT (language, key) DO UPDATE SET value = EXCLUDED.value;