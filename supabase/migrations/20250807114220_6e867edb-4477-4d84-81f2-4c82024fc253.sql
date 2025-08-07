-- Update RLS policy to allow everyone to view all songs
DROP POLICY IF EXISTS "Anyone can view featured songs" ON public.songs;
DROP POLICY IF EXISTS "Authenticated users can view all songs" ON public.songs;

-- Create new policy that allows everyone to view all songs
CREATE POLICY "Everyone can view all songs"
ON public.songs
FOR SELECT
USING (true);