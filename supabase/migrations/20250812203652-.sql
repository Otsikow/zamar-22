-- Ensure enum type exists
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'custom_status') THEN
    CREATE TYPE public.custom_status AS ENUM (
      'pending_brief','quoted','awaiting_payment',
      'in_production','draft_shared','revision_requested',
      'approved','delivered','cancelled','rejected'
    );
  END IF;
END $$;

-- Normalize values first
UPDATE public.custom_song_requests
SET status = 'pending_brief'
WHERE status IS NULL OR status NOT IN (
  'pending_brief','quoted','awaiting_payment','in_production','draft_shared','revision_requested','approved','delivered','cancelled','rejected'
);

-- Drop old default if any
ALTER TABLE public.custom_song_requests
  ALTER COLUMN status DROP DEFAULT;

-- Conditionally alter type if not already enum
DO $$
DECLARE v_type text;
BEGIN
  SELECT data_type INTO v_type
  FROM information_schema.columns 
  WHERE table_schema='public' AND table_name='custom_song_requests' AND column_name='status';

  IF v_type <> 'USER-DEFINED' THEN
    EXECUTE 'ALTER TABLE public.custom_song_requests ALTER COLUMN status TYPE public.custom_status USING status::public.custom_status';
  END IF;
END $$;

-- Set new default
ALTER TABLE public.custom_song_requests
  ALTER COLUMN status SET DEFAULT 'pending_brief';