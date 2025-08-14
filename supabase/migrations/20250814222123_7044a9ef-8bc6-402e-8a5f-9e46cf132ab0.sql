-- Add media type support to testimonies table
ALTER TABLE public.testimonies 
ADD COLUMN media_type text CHECK (media_type IN ('text', 'video', 'audio')) DEFAULT 'text';

-- Update the public testimonies view to include media type
DROP VIEW IF EXISTS public.public_testimonies;

CREATE VIEW public.public_testimonies AS
SELECT 
  id,
  display_name,
  message,
  media_url,
  media_type,
  country,
  created_at,
  published_at,
  song_id
FROM public.testimonies
WHERE status = 'approved' AND published_at IS NOT NULL
ORDER BY published_at DESC;