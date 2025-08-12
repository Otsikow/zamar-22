-- Fix status column migration by removing default before type change, then set new default
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='custom_song_requests' AND column_name='status'
  ) THEN
    -- Normalize values first
    UPDATE public.custom_song_requests
    SET status = 'pending_brief'
    WHERE status IS NULL OR status NOT IN (
      'pending_brief','quoted','awaiting_payment','in_production','draft_shared','revision_requested','approved','delivered','cancelled','rejected'
    );

    -- Drop old default if any
    ALTER TABLE public.custom_song_requests
      ALTER COLUMN status DROP DEFAULT;

    -- Change type to enum
    DO $$ BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema='public' AND table_name='custom_song_requests' AND column_name='status' AND data_type <> 'USER-DEFINED'
      ) THEN
        ALTER TABLE public.custom_song_requests
          ALTER COLUMN status TYPE public.custom_status USING status::public.custom_status;
      END IF;
    END $$;

    -- Set new default
    ALTER TABLE public.custom_song_requests
      ALTER COLUMN status SET DEFAULT 'pending_brief';
  END IF;
END $$;