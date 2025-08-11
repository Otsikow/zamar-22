-- Ads system MVP: placements, scheduling, metrics, storage bucket, and logs
-- 1) Extend ads table with scheduling and placement
ALTER TABLE public.ads
  ADD COLUMN IF NOT EXISTS placement text,
  ADD COLUMN IF NOT EXISTS start_date date,
  ADD COLUMN IF NOT EXISTS end_date date,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS paid boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS impressions bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS clicks bigint NOT NULL DEFAULT 0;

-- Helpful index for querying active ads by placement and date window
CREATE INDEX IF NOT EXISTS idx_ads_active_placement_dates
  ON public.ads (is_active, placement, start_date, end_date);

-- 2) Create public storage bucket for ad assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('ads', 'ads', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for ads bucket
DO $$
BEGIN
  -- Allow public read of ads assets
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public can view ads assets'
  ) THEN
    CREATE POLICY "Public can view ads assets"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'ads');
  END IF;

  -- Admins can manage ads assets
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Admins can manage ads assets'
  ) THEN
    CREATE POLICY "Admins can manage ads assets"
    ON storage.objects
    FOR ALL
    USING (bucket_id = 'ads' AND public.is_admin())
    WITH CHECK (bucket_id = 'ads' AND public.is_admin());
  END IF;
END$$;

-- 3) Lightweight ad_logs table for future analytics
CREATE TABLE IF NOT EXISTS public.ad_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id uuid NOT NULL,
  placement text,
  type text NOT NULL CHECK (type IN ('impression','click')),
  ip inet,
  ua text,
  referrer text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ad_logs ENABLE ROW LEVEL SECURITY;

-- Anyone may insert logs (they contain no sensitive data); Admins may read
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'ad_logs' AND policyname = 'Anyone can insert ad logs'
  ) THEN
    CREATE POLICY "Anyone can insert ad logs"
    ON public.ad_logs
    FOR INSERT
    WITH CHECK (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'ad_logs' AND policyname = 'Admins can view ad logs'
  ) THEN
    CREATE POLICY "Admins can view ad logs"
    ON public.ad_logs
    FOR SELECT
    USING (public.is_admin());
  END IF;
END$$;