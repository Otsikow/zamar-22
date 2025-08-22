-- Step 1: Create test approved testimony
INSERT INTO public.testimonies (user_id, display_name, country, message, status, approved_at)
VALUES (null, 'John A.', 'Ghana', 'God healed me during worship!', 'approved', now());

-- Step 2: Fix RLS policies - wipe and recreate clean ones
DROP POLICY IF EXISTS "public read approved testimonies" ON public.testimonies;
DROP POLICY IF EXISTS "author can read own" ON public.testimonies;
DROP POLICY IF EXISTS "auth can insert pending testimony" ON public.testimonies;
DROP POLICY IF EXISTS "admins full access" ON public.testimonies;

ALTER TABLE public.testimonies ENABLE ROW LEVEL SECURITY;

-- Public web page: can read ONLY approved (no auth.uid() dependency)
CREATE POLICY "public read approved testimonies"
ON public.testimonies FOR SELECT
USING (status = 'approved');

-- Authors see their own submissions in account area
CREATE POLICY "author can read own"
ON public.testimonies FOR SELECT
USING (user_id = auth.uid());

-- Allow inserts from signed-in users (pending by default)
CREATE POLICY "auth can insert pending testimony"
ON public.testimonies FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Admin moderation
CREATE POLICY "admins full access"
ON public.testimonies FOR ALL
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Step 3: Fix RPC permissions for anonymous users
REVOKE ALL ON FUNCTION public.testimonies_feed(int, timestamptz) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.testimonies_feed(int, timestamptz) TO anon, authenticated;

-- Step 8: Seed more test data
INSERT INTO public.testimonies (display_name, country, message, status, approved_at)
VALUES
('Mary K.', 'UK', 'Peace flooded my heart listening here.', 'approved', now()),
('Ade', 'Nigeria', 'God restored my joy.', 'approved', now());