-- Create songs table for the featured songs grid
CREATE TABLE public.songs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  artist TEXT,
  genre TEXT,
  occasion TEXT,
  audio_url TEXT,
  thumbnail_url TEXT,
  featured BOOLEAN DEFAULT false,
  tags TEXT[],
  duration_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create active_sessions table for live listener counter
CREATE TABLE public.active_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL UNIQUE,
  user_agent TEXT,
  last_ping TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.active_sessions ENABLE ROW LEVEL SECURITY;

-- Songs are viewable by everyone (public library)
CREATE POLICY "Songs are viewable by everyone" 
ON public.songs 
FOR SELECT 
USING (true);

-- Active sessions are viewable by everyone for the counter
CREATE POLICY "Active sessions are viewable by everyone" 
ON public.active_sessions 
FOR SELECT 
USING (true);

-- Anyone can insert/update their session
CREATE POLICY "Anyone can manage active sessions" 
ON public.active_sessions 
FOR ALL
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates on songs
CREATE TRIGGER update_songs_updated_at
BEFORE UPDATE ON public.songs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some sample featured songs
INSERT INTO public.songs (title, artist, genre, occasion, featured, tags, thumbnail_url) VALUES
('Blessed Union', 'Zamar Artists', 'Gospel', 'Wedding', true, ARRAY['wedding', 'gospel', 'love'], '/placeholder.svg'),
('Birthday Praise', 'Zamar Artists', 'Afrobeats', 'Birthday', true, ARRAY['birthday', 'celebration', 'afrobeats'], '/placeholder.svg'),
('Faithful Journey', 'Zamar Artists', 'Classical', 'Church', true, ARRAY['church', 'classical', 'faith'], '/placeholder.svg'),
('Joyful Celebration', 'Zamar Artists', 'RnB', 'Birthday', true, ARRAY['birthday', 'rnb', 'joy'], '/placeholder.svg');