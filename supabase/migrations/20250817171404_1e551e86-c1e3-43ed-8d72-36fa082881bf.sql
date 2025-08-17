-- Create playlist_likes table for likes/follows functionality
CREATE TABLE public.playlist_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  playlist_id UUID NOT NULL REFERENCES public.playlists(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, playlist_id)
);

-- Create playlist_comments table for comments functionality  
CREATE TABLE public.playlist_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  playlist_id UUID NOT NULL REFERENCES public.playlists(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.playlist_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlist_comments ENABLE ROW LEVEL SECURITY;

-- RLS policies for playlist_likes
CREATE POLICY "Users can view all playlist likes" 
ON public.playlist_likes 
FOR SELECT 
USING (true);

CREATE POLICY "Users can like public playlists" 
ON public.playlist_likes 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id 
  AND EXISTS (
    SELECT 1 FROM public.playlists 
    WHERE id = playlist_id AND is_public = true
  )
);

CREATE POLICY "Users can unlike their own likes" 
ON public.playlist_likes 
FOR DELETE 
USING (auth.uid() = user_id);

-- RLS policies for playlist_comments
CREATE POLICY "Users can view comments on public playlists" 
ON public.playlist_comments 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.playlists 
    WHERE id = playlist_id AND is_public = true
  )
);

CREATE POLICY "Users can comment on public playlists" 
ON public.playlist_comments 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id 
  AND EXISTS (
    SELECT 1 FROM public.playlists 
    WHERE id = playlist_id AND is_public = true
  )
);

CREATE POLICY "Users can update their own comments" 
ON public.playlist_comments 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" 
ON public.playlist_comments 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_playlist_likes_playlist_id ON public.playlist_likes(playlist_id);
CREATE INDEX idx_playlist_likes_user_id ON public.playlist_likes(user_id);
CREATE INDEX idx_playlist_comments_playlist_id ON public.playlist_comments(playlist_id);
CREATE INDEX idx_playlist_comments_created_at ON public.playlist_comments(created_at DESC);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_playlist_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_playlist_comments_updated_at
BEFORE UPDATE ON public.playlist_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_playlist_comments_updated_at();