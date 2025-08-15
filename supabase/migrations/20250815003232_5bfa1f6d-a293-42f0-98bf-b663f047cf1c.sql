-- Fix security issues by adding proper search_path to functions

-- Update privacy_safe_name function with proper search_path
CREATE OR REPLACE FUNCTION public.privacy_safe_name(u_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $$
  SELECT
    TRIM(
      COALESCE(
        NULLIF(TRIM(p.first_name || ' ' || COALESCE(p.last_name, '')), ''),
        SPLIT_PART(COALESCE(p.email, 'Friend'), '@', 1)
      )
    ) || CASE 
      WHEN p.last_name IS NOT NULL AND p.last_name <> '' 
      THEN '.' 
      ELSE '' 
    END
  FROM public.profiles p
  WHERE p.id = u_id;
$$;

-- Update link_suggester_to_song function with proper search_path
CREATE OR REPLACE FUNCTION public.link_suggester_to_song()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $$
BEGIN
  -- only act when status is 'created' and a song_id is set
  IF (NEW.status = 'created' AND NEW.song_id IS NOT NULL) THEN
    UPDATE public.songs
       SET suggested_by = NEW.user_id,
           suggested_by_display = COALESCE(public.privacy_safe_name(NEW.user_id), 'A Supporter')
     WHERE id = NEW.song_id;

    -- stamp the suggestion as fulfilled
    NEW.fulfilled_at := COALESCE(NEW.fulfilled_at, now());
  END IF;

  RETURN NEW;
END;
$$;