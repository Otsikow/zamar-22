-- Ensure user_favourites table exists with proper constraints and policies (fixed policy check)
-- 1) Create table if missing
CREATE TABLE IF NOT EXISTS public.user_favourites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  song_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2) Unique constraint to prevent duplicates
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_favourites_user_song_unique'
  ) THEN
    ALTER TABLE public.user_favourites
      ADD CONSTRAINT user_favourites_user_song_unique UNIQUE (user_id, song_id);
  END IF;
END $$;

-- 3) Foreign keys to profiles and songs for relational integrity and PostgREST embedding
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_favourites_user_id_fkey'
  ) THEN
    ALTER TABLE public.user_favourites
      ADD CONSTRAINT user_favourites_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_favourites_song_id_fkey'
  ) THEN
    ALTER TABLE public.user_favourites
      ADD CONSTRAINT user_favourites_song_id_fkey
      FOREIGN KEY (song_id) REFERENCES public.songs(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 4) Enable RLS (safe to run multiple times)
ALTER TABLE public.user_favourites ENABLE ROW LEVEL SECURITY;

-- 5) RLS policies (create only if missing)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_favourites' AND policyname = 'insert own favourites'
  ) THEN
    CREATE POLICY "insert own favourites"
    ON public.user_favourites
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_favourites' AND policyname = 'read own favourites'
  ) THEN
    CREATE POLICY "read own favourites"
    ON public.user_favourites
    FOR SELECT
    USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_favourites' AND policyname = 'delete own favourites'
  ) THEN
    CREATE POLICY "delete own favourites"
    ON public.user_favourites
    FOR DELETE
    USING (auth.uid() = user_id);
  END IF;
END $$;