-- Drop and recreate the view without SECURITY DEFINER
DROP VIEW IF EXISTS public.public_testimonies;

-- Recreate the view with default security (SECURITY INVOKER)
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
FROM testimonies
WHERE status = 'approved' AND published_at IS NOT NULL
ORDER BY published_at DESC;