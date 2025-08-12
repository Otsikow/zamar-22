-- Create advertisements table to avoid ad-blocker conflicts with 'ads' path
-- and set secure RLS policies

-- 1) Create table
CREATE TABLE IF NOT EXISTS public.advertisements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  ad_type TEXT NOT NULL,
  target_url TEXT,
  media_url TEXT,
  frequency INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT true,
  placement TEXT,
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'active',
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2) Enable RLS
ALTER TABLE public.advertisements ENABLE ROW LEVEL SECURITY;

-- 3) Policies
-- Public can view active ads within date window
DROP POLICY IF EXISTS "Public can view active advertisements" ON public.advertisements;
CREATE POLICY "Public can view active advertisements"
ON public.advertisements
FOR SELECT
USING (
  is_active = true
  AND (start_date IS NULL OR start_date::timestamptz <= now())
  AND (end_date IS NULL OR end_date::timestamptz >= now())
);

-- Admins can view all, insert, update, delete
DROP POLICY IF EXISTS "Admins can view all advertisements" ON public.advertisements;
CREATE POLICY "Admins can view all advertisements"
ON public.advertisements
FOR SELECT
USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can insert advertisements" ON public.advertisements;
CREATE POLICY "Admins can insert advertisements"
ON public.advertisements
FOR INSERT
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update advertisements" ON public.advertisements;
CREATE POLICY "Admins can update advertisements"
ON public.advertisements
FOR UPDATE
USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete advertisements" ON public.advertisements;
CREATE POLICY "Admins can delete advertisements"
ON public.advertisements
FOR DELETE
USING (public.is_admin());

-- 4) Trigger to keep updated_at fresh
DROP TRIGGER IF EXISTS update_advertisements_updated_at ON public.advertisements;
CREATE TRIGGER update_advertisements_updated_at
BEFORE UPDATE ON public.advertisements
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 5) Attempt to backfill data from existing public.ads table if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'ads'
  ) THEN
    INSERT INTO public.advertisements (
      id, title, ad_type, target_url, media_url, frequency, is_active, placement, start_date, end_date, status, impressions, clicks, created_at, updated_at
    )
    SELECT 
      id, title, ad_type, target_url, media_url, frequency, COALESCE(is_active, true), placement, start_date, end_date, COALESCE(status, 'active'), COALESCE(impressions, 0), COALESCE(clicks, 0), created_at, updated_at
    FROM public.ads
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

-- 6) Create a new storage bucket that avoids the name 'ads'
INSERT INTO storage.buckets (id, name, public)
VALUES ('advertisements', 'advertisements', true)
ON CONFLICT (id) DO NOTHING;

-- 7) Storage policies for the new bucket
-- Public can read files
DROP POLICY IF EXISTS "Public read advertisements bucket" ON storage.objects;
CREATE POLICY "Public read advertisements bucket"
ON storage.objects
FOR SELECT
USING (bucket_id = 'advertisements');

-- Admins can write
DROP POLICY IF EXISTS "Admins write advertisements bucket" ON storage.objects;
CREATE POLICY "Admins write advertisements bucket"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'advertisements' AND public.is_admin());

DROP POLICY IF EXISTS "Admins update advertisements bucket" ON storage.objects;
CREATE POLICY "Admins update advertisements bucket"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'advertisements' AND public.is_admin());

DROP POLICY IF EXISTS "Admins delete advertisements bucket" ON storage.objects;
CREATE POLICY "Admins delete advertisements bucket"
ON storage.objects
FOR DELETE
USING (bucket_id = 'advertisements' AND public.is_admin());