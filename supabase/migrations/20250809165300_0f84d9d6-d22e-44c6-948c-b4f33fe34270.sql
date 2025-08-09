-- Allow public to view songs in public playlists while keeping private playlists restricted
CREATE POLICY "Public can view songs in public playlists"
ON public.playlist_songs
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.playlists p
    WHERE p.id = playlist_songs.playlist_id
      AND p.is_public = true
  )
);
