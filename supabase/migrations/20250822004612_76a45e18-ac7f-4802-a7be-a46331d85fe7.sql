-- Create testimonies table with proper schema
CREATE TABLE IF NOT EXISTS public.testimonies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name text,                -- display name shown publicly
  country text,             -- for searching/filtering
  message text NOT NULL,    -- the testimony text
  media_url text,           -- optional audio/video/image in Storage
  status text NOT NULL DEFAULT 'pending', -- pending|approved|rejected
  created_at timestamptz NOT NULL DEFAULT now(),
  approved_at timestamptz
);

-- Indexes for fast search
CREATE INDEX IF NOT EXISTS idx_testimonies_status_created
  ON public.testimonies (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_testimonies_country
  ON public.testimonies (country);

ALTER TABLE public.testimonies ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "public read approved testimonies" ON public.testimonies;
DROP POLICY IF EXISTS "auth can insert pending testimony" ON public.testimonies;
DROP POLICY IF EXISTS "author can read own" ON public.testimonies;
DROP POLICY IF EXISTS "admins full access" ON public.testimonies;

-- Public can read only approved testimonies
CREATE POLICY "public read approved testimonies"
ON public.testimonies FOR SELECT
USING (status = 'approved');

-- Authenticated users can insert their own pending testimony
CREATE POLICY "auth can insert pending testimony"
ON public.testimonies FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Users can read their own submissions (any status)
CREATE POLICY "author can read own"
ON public.testimonies FOR SELECT
USING (user_id = auth.uid());

-- Admins can read/update all rows (moderation)
CREATE POLICY "admins full access"
ON public.testimonies FOR ALL
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Admin RPCs for approve/reject
CREATE OR REPLACE FUNCTION public.approve_testimony(t_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE public.testimonies
  SET status = 'approved', approved_at = now()
  WHERE id = t_id;
END; $$;

CREATE OR REPLACE FUNCTION public.reject_testimony(t_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE public.testimonies
  SET status = 'rejected'
  WHERE id = t_id;
END; $$;

-- Public feed with cursor pagination (no policy recursion)
CREATE OR REPLACE FUNCTION public.testimonies_feed(limit_rows int DEFAULT 20, before_time timestamptz DEFAULT now())
RETURNS TABLE (
  id uuid,
  name text,
  country text,
  message text,
  media_url text,
  created_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT t.id, t.name, t.country, t.message, t.media_url, t.created_at
  FROM public.testimonies t
  WHERE t.status = 'approved' AND t.created_at < before_time
  ORDER BY t.created_at DESC
  LIMIT GREATEST(limit_rows, 1);
$$;

-- Grant proper permissions
REVOKE ALL ON FUNCTION public.approve_testimony(uuid) FROM public, anon;
REVOKE ALL ON FUNCTION public.reject_testimony(uuid) FROM public, anon;
REVOKE ALL ON FUNCTION public.testimonies_feed(int, timestamptz) FROM public, anon;

GRANT EXECUTE ON FUNCTION public.testimonies_feed(int, timestamptz) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.approve_testimony(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_testimony(uuid) TO authenticated;