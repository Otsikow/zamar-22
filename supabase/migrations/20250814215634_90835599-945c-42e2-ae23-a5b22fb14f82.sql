-- 1. ENUM for status
DO $$ BEGIN
  CREATE TYPE testimony_status AS ENUM ('pending','approved','rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. testimonies table
CREATE TABLE IF NOT EXISTS public.testimonies (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  display_name     text,             -- show "A Grateful Listener" if null
  country          text,
  song_id          uuid,             -- optional link to a song
  message          text NOT NULL,
  media_url        text,             -- optional audio/video testimony
  status           testimony_status NOT NULL DEFAULT 'pending',
  admin_notes      text,
  approved_by      uuid REFERENCES auth.users(id),
  approved_at      timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  published_at     timestamptz       -- set when status becomes approved
);

-- 3. keep timestamps fresh
CREATE OR REPLACE FUNCTION public.touches_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

DROP TRIGGER IF EXISTS trg_testimonies_updated ON public.testimonies;
CREATE TRIGGER trg_testimonies_updated
BEFORE UPDATE ON public.testimonies
FOR EACH ROW EXECUTE FUNCTION public.touches_updated_at();

-- 4. view for public website (approved only)
CREATE OR REPLACE VIEW public.public_testimonies AS
SELECT
  t.id, COALESCE(NULLIF(t.display_name,''),'A Grateful Listener') AS display_name,
  t.country, t.song_id, t.message, t.media_url, t.published_at, t.created_at
FROM public.testimonies t
WHERE t.status = 'approved' AND t.published_at IS NOT NULL
ORDER BY t.published_at DESC;

-- 5. handy function for admins to approve
CREATE OR REPLACE FUNCTION public.approve_testimony(p_testimony_id uuid, p_admin uuid)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.testimonies
  SET status = 'approved',
      approved_by = p_admin,
      approved_at = now(),
      published_at = COALESCE(published_at, now())
  WHERE id = p_testimony_id;
END $$;

-- 6. optional: reject helper
CREATE OR REPLACE FUNCTION public.reject_testimony(p_testimony_id uuid, p_admin uuid, p_reason text)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.testimonies
  SET status = 'rejected',
      admin_notes = p_reason,
      approved_by = p_admin,
      approved_at = now(),
      published_at = NULL
  WHERE id = p_testimony_id;
END $$;

-- Row‑Level Security (RLS)
ALTER TABLE public.testimonies ENABLE ROW LEVEL SECURITY;

-- Policy: anyone (including guests) can read APPROVED via the view; for the base table:
-- 1) Owners can read their own rows
CREATE POLICY "testimonies_owner_read"
ON public.testimonies FOR SELECT
USING (auth.uid() = user_id);

-- 2) Authenticated users can INSERT their own testimony
CREATE POLICY "testimonies_owner_insert"
ON public.testimonies FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 3) Owners can UPDATE their own testimony only while pending (edit typos)
CREATE POLICY "testimonies_owner_update_pending"
ON public.testimonies FOR UPDATE
USING (auth.uid() = user_id AND status = 'pending')
WITH CHECK (auth.uid() = user_id AND status = 'pending');

-- 4) Admins can SELECT/UPDATE all
CREATE POLICY "admin_full_access_testimonies"
ON public.testimonies FOR SELECT USING (is_admin());

CREATE POLICY "admin_update_testimonies"
ON public.testimonies FOR UPDATE USING (is_admin());

-- Public can read from the view
GRANT SELECT ON public.public_testimonies TO anon, authenticated;