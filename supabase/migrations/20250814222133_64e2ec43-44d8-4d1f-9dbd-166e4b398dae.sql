-- Drop the existing view
DROP VIEW IF EXISTS public.public_testimonies;

-- Recreate the view without SECURITY DEFINER (uses SECURITY INVOKER by default)
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

-- Grant access to view for anonymous and authenticated users
GRANT SELECT ON public.public_testimonies TO anon, authenticated;