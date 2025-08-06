-- Create songs table for featured songs display
CREATE TABLE public.songs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  genre TEXT,
  occasion TEXT,
  audio_url TEXT,
  thumbnail_url TEXT,
  featured BOOLEAN DEFAULT false,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create active_sessions table for live counter
CREATE TABLE public.active_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL UNIQUE,
  last_ping TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.active_sessions ENABLE ROW LEVEL SECURITY;

-- Songs policies (public read access for featured songs)
CREATE POLICY "Featured songs are publicly viewable" 
ON public.songs 
FOR SELECT 
USING (featured = true);

-- Active sessions policies (public read for counter)
CREATE POLICY "Active sessions are publicly readable for count" 
ON public.active_sessions 
FOR SELECT 
USING (true);

-- Active sessions insert/update policies (public for tracking)
CREATE POLICY "Anyone can create active sessions" 
ON public.active_sessions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update their session" 
ON public.active_sessions 
FOR UPDATE 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_songs_updated_at
BEFORE UPDATE ON public.songs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample featured songs
INSERT INTO public.songs (title, genre, occasion, thumbnail_url, featured, tags) VALUES
('Wedding Blessing', 'Gospel', 'Wedding', '/placeholder.svg', true, ARRAY['wedding', 'gospel', 'blessing']),
('Birthday Celebration', 'Afrobeats', 'Birthday', '/placeholder.svg', true, ARRAY['birthday', 'afrobeats', 'celebration']),
('Church Anniversary', 'Gospel', 'Church', '/placeholder.svg', true, ARRAY['church', 'anniversary', 'gospel']),
('Business Launch', 'RnB', 'Business', '/placeholder.svg', true, ARRAY['business', 'launch', 'rnb']);