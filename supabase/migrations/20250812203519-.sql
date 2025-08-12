-- 1) ENUM and table alterations for custom_song_requests
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'custom_status') THEN
    CREATE TYPE public.custom_status AS ENUM (
      'pending_brief','quoted','awaiting_payment',
      'in_production','draft_shared','revision_requested',
      'approved','delivered','cancelled','rejected'
    );
  END IF;
END $$;

-- Ensure custom_song_requests exists (it already exists in project). Add needed columns safely.
ALTER TABLE public.custom_song_requests
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS style TEXT,
  ADD COLUMN IF NOT EXISTS scripture_ref TEXT,
  ADD COLUMN IF NOT EXISTS tone TEXT,
  ADD COLUMN IF NOT EXISTS duration_seconds INT,
  ADD COLUMN IF NOT EXISTS need_by_date DATE,
  ADD COLUMN IF NOT EXISTS reference_urls TEXT[],
  ADD COLUMN IF NOT EXISTS assigned_admin UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS price_cents INT,
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'GBP',
  ADD COLUMN IF NOT EXISTS stripe_pi_id TEXT;

-- Constrain duration range if present
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'custom_song_requests' AND column_name = 'duration_seconds'
  ) THEN
    -- Add constraint if not exists
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conname = 'custom_song_requests_duration_seconds_check'
    ) THEN
      ALTER TABLE public.custom_song_requests
      ADD CONSTRAINT custom_song_requests_duration_seconds_check CHECK (duration_seconds BETWEEN 30 AND 240);
    END IF;
  END IF;
END $$;

-- Migrate status text -> enum custom_status
-- First normalize any existing values to valid enum labels
UPDATE public.custom_song_requests
SET status = 'pending_brief'
WHERE status IS NULL OR status NOT IN (
  'pending_brief','quoted','awaiting_payment','in_production','draft_shared','revision_requested','approved','delivered','cancelled','rejected'
);

DO $$ BEGIN
  -- Alter type only if not already enum type
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='custom_song_requests' AND column_name='status' AND data_type <> 'USER-DEFINED'
  ) THEN
    ALTER TABLE public.custom_song_requests
      ALTER COLUMN status TYPE public.custom_status USING status::public.custom_status,
      ALTER COLUMN status SET DEFAULT 'pending_brief';
  END IF;
END $$;

-- Add helpful indexes
CREATE INDEX IF NOT EXISTS idx_csr_user_id ON public.custom_song_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_csr_assigned_admin ON public.custom_song_requests(assigned_admin);
CREATE INDEX IF NOT EXISTS idx_csr_status ON public.custom_song_requests(status);

-- updated_at trigger using existing function
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_custom_requests_updated_at'
  ) THEN
    CREATE TRIGGER trg_custom_requests_updated_at
    BEFORE UPDATE ON public.custom_song_requests
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- 2) New tables
CREATE TABLE IF NOT EXISTS public.custom_song_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.custom_song_requests(id) ON DELETE CASCADE,
  kind TEXT CHECK (kind IN ('brief','reference','draft_audio','final_audio','lyrics_pdf','cover_art')),
  storage_path TEXT NOT NULL,
  duration_seconds INT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_csa_request_id ON public.custom_song_assets(request_id);
CREATE INDEX IF NOT EXISTS idx_csa_kind ON public.custom_song_assets(kind);

CREATE TABLE IF NOT EXISTS public.custom_song_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.custom_song_requests(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id),
  body TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_csm_request_created ON public.custom_song_messages(request_id, created_at);

CREATE TABLE IF NOT EXISTS public.custom_song_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.custom_song_requests(id) ON DELETE CASCADE,
  final_audio_path TEXT NOT NULL,
  lyrics_pdf_path TEXT,
  cover_art_path TEXT,
  delivered_by UUID REFERENCES auth.users(id),
  delivered_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_custom_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_id UUID NOT NULL REFERENCES public.custom_song_requests(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  final_audio_path TEXT NOT NULL,
  lyrics_pdf_path TEXT,
  cover_art_path TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, request_id)
);

-- 3) RLS enable and policies for new tables (use existing is_admin())
ALTER TABLE public.custom_song_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_song_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_song_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_custom_library ENABLE ROW LEVEL SECURITY;

-- Assets policies
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='custom_song_assets' AND policyname='csa_select_participants'
  ) THEN
    CREATE POLICY csa_select_participants ON public.custom_song_assets
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM public.custom_song_requests r
        WHERE r.id = custom_song_assets.request_id
          AND (r.user_id = auth.uid() OR public.is_admin() OR r.assigned_admin = auth.uid())
      )
    );
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='custom_song_assets' AND policyname='csa_insert_admin_or_assigned'
  ) THEN
    CREATE POLICY csa_insert_admin_or_assigned ON public.custom_song_assets
    FOR INSERT WITH CHECK (
      public.is_admin() OR auth.uid() = (SELECT assigned_admin FROM public.custom_song_requests WHERE id = request_id)
    );
  END IF;
END $$;

-- Messages policies
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='custom_song_messages' AND policyname='csm_select_participants'
  ) THEN
    CREATE POLICY csm_select_participants ON public.custom_song_messages
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM public.custom_song_requests r
        WHERE r.id = custom_song_messages.request_id
          AND (r.user_id = auth.uid() OR public.is_admin() OR r.assigned_admin = auth.uid())
      )
    );
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='custom_song_messages' AND policyname='csm_insert_participants'
  ) THEN
    CREATE POLICY csm_insert_participants ON public.custom_song_messages
    FOR INSERT WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.custom_song_requests r
        WHERE r.id = custom_song_messages.request_id
          AND (r.user_id = auth.uid() OR public.is_admin() OR r.assigned_admin = auth.uid())
      )
    );
  END IF;
END $$;

-- Deliveries policies
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='custom_song_deliveries' AND policyname='csd_select_owner_or_admin'
  ) THEN
    CREATE POLICY csd_select_owner_or_admin ON public.custom_song_deliveries
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM public.custom_song_requests r
        WHERE r.id = custom_song_deliveries.request_id AND (r.user_id = auth.uid() OR public.is_admin())
      )
    );
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='custom_song_deliveries' AND policyname='csd_insert_admin_only'
  ) THEN
    CREATE POLICY csd_insert_admin_only ON public.custom_song_deliveries
    FOR INSERT WITH CHECK (public.is_admin());
  END IF;
END $$;

-- Library policies
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='user_custom_library' AND policyname='ucl_select_owner'
  ) THEN
    CREATE POLICY ucl_select_owner ON public.user_custom_library
    FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='user_custom_library' AND policyname='ucl_insert_admin'
  ) THEN
    CREATE POLICY ucl_insert_admin ON public.user_custom_library
    FOR INSERT WITH CHECK (public.is_admin());
  END IF;
END $$;

-- 4) Triggers for automation
-- After delivery insert: update status, add to library (if not already), and notify user
CREATE OR REPLACE FUNCTION public.custom_after_delivery_insert()
RETURNS trigger AS $$
DECLARE
  r public.custom_song_requests;
BEGIN
  SELECT * INTO r FROM public.custom_song_requests WHERE id = NEW.request_id;

  INSERT INTO public.user_custom_library (user_id, request_id, title, final_audio_path, lyrics_pdf_path, cover_art_path)
  VALUES (r.user_id, r.id, COALESCE(r.title, 'Custom Song'), NEW.final_audio_path, NEW.lyrics_pdf_path, NEW.cover_art_path)
  ON CONFLICT (user_id, request_id) DO NOTHING;

  UPDATE public.custom_song_requests SET status='delivered' WHERE id = r.id;

  INSERT INTO public.notifications (user_id, type, title, message, link)
  VALUES (
    r.user_id,
    'custom_song_delivered',
    'Your custom song is ready!',
    'Tap to download your final files.',
    '/library'
  );
  RETURN NEW;
END; $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_custom_after_delivery_insert'
  ) THEN
    CREATE TRIGGER trg_custom_after_delivery_insert
    AFTER INSERT ON public.custom_song_deliveries
    FOR EACH ROW EXECUTE FUNCTION public.custom_after_delivery_insert();
  END IF;
END $$;

-- On draft asset insert: flip status and notify
CREATE OR REPLACE FUNCTION public.custom_on_draft_asset_insert()
RETURNS trigger AS $$
BEGIN
  IF NEW.kind = 'draft_audio' THEN
    UPDATE public.custom_song_requests
      SET status='draft_shared'
      WHERE id = NEW.request_id AND status = 'in_production';

    INSERT INTO public.notifications (user_id, type, title, message, link)
    SELECT r.user_id, 'custom_song_draft', 'Draft ready for review', 'Please review and request changes.', '/library'
    FROM public.custom_song_requests r
    WHERE r.id = NEW.request_id;
  END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_custom_on_draft_asset_insert'
  ) THEN
    CREATE TRIGGER trg_custom_on_draft_asset_insert
    AFTER INSERT ON public.custom_song_assets
    FOR EACH ROW EXECUTE FUNCTION public.custom_on_draft_asset_insert();
  END IF;
END $$;

-- Mark paid helper
CREATE OR REPLACE FUNCTION public.mark_paid(request UUID, amount INT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.custom_song_requests
  SET status='in_production', price_cents = COALESCE(price_cents, amount)
  WHERE id = request AND status IN ('awaiting_payment','quoted');
END; $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5) Storage buckets and policies
INSERT INTO storage.buckets (id, name, public) VALUES
  ('custom-briefs','custom-briefs', false),
  ('custom-drafts','custom-drafts', false),
  ('custom-finals','custom-finals', true),
  ('custom-art','custom-art', false)
ON CONFLICT (id) DO NOTHING;

-- Policies on storage.objects
-- Admin full control for drafts/briefs/art
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='custom_admin_rw_drafts_briefs_art'
  ) THEN
    CREATE POLICY custom_admin_rw_drafts_briefs_art ON storage.objects
    FOR ALL
    USING (
      (bucket_id IN ('custom-drafts','custom-briefs','custom-art')) AND public.is_admin()
    )
    WITH CHECK (
      (bucket_id IN ('custom-drafts','custom-briefs','custom-art')) AND public.is_admin()
    );
  END IF;
END $$;

-- Public read finals
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='custom_public_read_finals'
  ) THEN
    CREATE POLICY custom_public_read_finals ON storage.objects
    FOR SELECT USING (bucket_id = 'custom-finals');
  END IF;
END $$;

-- Admin write finals
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='custom_admin_write_finals'
  ) THEN
    CREATE POLICY custom_admin_write_finals ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'custom-finals' AND public.is_admin());
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='custom_admin_update_delete_finals'
  ) THEN
    CREATE POLICY custom_admin_update_delete_finals ON storage.objects
    FOR UPDATE USING (bucket_id = 'custom-finals' AND public.is_admin())
    WITH CHECK (bucket_id = 'custom-finals' AND public.is_admin());
  END IF;
END $$;

-- Allow authenticated users to upload briefs
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='custom_user_upload_briefs'
  ) THEN
    CREATE POLICY custom_user_upload_briefs ON storage.objects
    FOR INSERT
    WITH CHECK (bucket_id = 'custom-briefs' AND auth.role() = 'authenticated');
  END IF;
END $$;

-- Owners can read their drafts/briefs via linkage in custom_song_assets
-- Drafts read
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='custom_owner_read_drafts'
  ) THEN
    CREATE POLICY custom_owner_read_drafts ON storage.objects
    FOR SELECT USING (
      bucket_id = 'custom-drafts' AND EXISTS (
        SELECT 1 FROM public.custom_song_requests r
        JOIN public.custom_song_assets a ON a.request_id = r.id
        WHERE a.storage_path = storage.objects.name AND r.user_id = auth.uid()
      )
    );
  END IF;
END $$;

-- Briefs read
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='custom_owner_read_briefs'
  ) THEN
    CREATE POLICY custom_owner_read_briefs ON storage.objects
    FOR SELECT USING (
      bucket_id = 'custom-briefs' AND (
        public.is_admin() OR EXISTS (
          SELECT 1 FROM public.custom_song_requests r
          JOIN public.custom_song_assets a ON a.request_id = r.id
          WHERE a.storage_path = storage.objects.name AND r.user_id = auth.uid()
        )
      )
    );
  END IF;
END $$;