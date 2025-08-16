-- SONGS: add recognition fields
ALTER TABLE public.songs
  ADD COLUMN IF NOT EXISTS suggested_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS suggested_by_display text;

-- SONG SUGGESTIONS: link to a created song
CREATE TABLE IF NOT EXISTS public.song_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text,
  description text,
  scripture_reference text,
  preferred_language text,
  status text NOT NULL DEFAULT 'pending',        -- pending | approved | created | rejected
  admin_notes text,
  song_id uuid NULL REFERENCES public.songs(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  fulfilled_at timestamptz
);

-- Helper for display-name privacy
CREATE OR REPLACE FUNCTION public.privacy_safe_name(u_id uuid)
RETURNS text
LANGUAGE sql
STABLE
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

-- Trigger: when a suggestion becomes created
CREATE OR REPLACE FUNCTION public.link_suggester_to_song()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
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

DROP TRIGGER IF EXISTS trg_link_suggester_to_song ON public.song_suggestions;

CREATE TRIGGER trg_link_suggester_to_song
AFTER UPDATE OF status, song_id
ON public.song_suggestions
FOR EACH ROW
EXECUTE FUNCTION public.link_suggester_to_song();

-- Enable RLS
ALTER TABLE public.song_suggestions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for song_suggestions
CREATE POLICY "Users can view their own suggestions" 
ON public.song_suggestions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own suggestions" 
ON public.song_suggestions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pending suggestions" 
ON public.song_suggestions 
FOR UPDATE 
USING (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Admins can manage all suggestions" 
ON public.song_suggestions 
FOR ALL 
USING (is_admin());

-- Notify admins of new suggestions
CREATE OR REPLACE FUNCTION public.notify_admin_new_suggestion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $$
DECLARE
  admin_user_id uuid;
  suggester_name text;
BEGIN
  -- Get suggester information
  SELECT COALESCE(first_name || ' ' || last_name, email, 'Anonymous') as name
  INTO suggester_name
  FROM public.profiles 
  WHERE id = NEW.user_id;

  -- Notify all admins about the new suggestion
  FOR admin_user_id IN 
    SELECT user_id FROM public.admin_users
  LOOP
    INSERT INTO public.notifications (
      user_id, 
      type, 
      title,
      message, 
      link,
      metadata
    ) VALUES (
      admin_user_id,
      'song_suggestion',
      'New Song Suggestion',
      'New suggestion from ' || COALESCE(suggester_name, 'Anonymous') || ': ' || COALESCE(NEW.title, 'No title'),
      '/admin/suggestions',
      jsonb_build_object(
        'suggestion_id', NEW.id,
        'suggester_id', NEW.user_id,
        'title', NEW.title
      )
    );
  END LOOP;

  RETURN NEW;
END;
$$;

CREATE TRIGGER notify_admin_new_suggestion
AFTER INSERT ON public.song_suggestions
FOR EACH ROW
EXECUTE FUNCTION public.notify_admin_new_suggestion();