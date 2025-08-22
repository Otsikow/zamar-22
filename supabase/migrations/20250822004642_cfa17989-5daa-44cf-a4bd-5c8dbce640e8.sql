-- Update testimonies table with proper RLS policies
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

-- Admin RPCs for approve/reject using existing schema
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
  SET status = 'approved'::testimony_status, 
      approved_at = now(),
      approved_by = auth.uid(),
      published_at = COALESCE(published_at, now())
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
  SET status = 'rejected'::testimony_status,
      approved_by = auth.uid()
  WHERE id = t_id;
END; $$;

-- Public feed with cursor pagination using existing columns
CREATE OR REPLACE FUNCTION public.testimonies_feed(limit_rows int DEFAULT 20, before_time timestamptz DEFAULT now())
RETURNS TABLE (
  id uuid,
  display_name text,
  country text,
  message text,
  media_url text,
  media_type text,
  created_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT t.id, t.display_name, t.country, t.message, t.media_url, t.media_type, t.created_at
  FROM public.testimonies t
  WHERE t.status = 'approved'::testimony_status AND t.created_at < before_time
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