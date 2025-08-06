-- Create the synced_lyrics table
CREATE TABLE public.synced_lyrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  song_id UUID REFERENCES public.songs(id) ON DELETE CASCADE,
  line_index INTEGER NOT NULL,
  time_seconds NUMERIC NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for efficient lookup
CREATE INDEX idx_synced_lyrics_song_line ON public.synced_lyrics (song_id, line_index);
CREATE INDEX idx_synced_lyrics_song_time ON public.synced_lyrics (song_id, time_seconds);

-- Enable RLS
ALTER TABLE public.synced_lyrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view synced lyrics" 
ON public.synced_lyrics 
FOR SELECT 
USING (true);

CREATE POLICY "Only admins can manage synced lyrics" 
ON public.synced_lyrics 
FOR ALL 
USING (is_admin());