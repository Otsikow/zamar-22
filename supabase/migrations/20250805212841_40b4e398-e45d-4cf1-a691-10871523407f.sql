-- Create custom_songs table for user-specific songs
CREATE TABLE public.custom_songs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  request_id UUID REFERENCES public.custom_song_requests(id),
  song_title TEXT NOT NULL,
  audio_url TEXT,
  lyrics_url TEXT,
  thumbnail_url TEXT,
  status TEXT NOT NULL DEFAULT 'created',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.custom_songs ENABLE ROW LEVEL SECURITY;

-- Create policies for custom_songs
CREATE POLICY "Users can view their own custom songs" 
ON public.custom_songs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all custom songs" 
ON public.custom_songs 
FOR ALL 
USING (is_admin());

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_custom_songs_updated_at
BEFORE UPDATE ON public.custom_songs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create an index for better performance
CREATE INDEX idx_custom_songs_user_id ON public.custom_songs(user_id);
CREATE INDEX idx_custom_songs_request_id ON public.custom_songs(request_id);