-- Drop the existing custom_songs table to recreate with proper constraints
DROP TABLE IF EXISTS public.custom_songs;

-- Create the optimized custom_songs table with proper foreign key reference
CREATE TABLE public.custom_songs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  song_title TEXT NOT NULL,
  audio_url TEXT NOT NULL,
  lyrics_url TEXT,
  status TEXT DEFAULT 'created' CHECK (status IN ('pending', 'created', 'delivered')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
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

-- Create index for better performance
CREATE INDEX idx_custom_songs_user_id ON public.custom_songs(user_id);
CREATE INDEX idx_custom_songs_status ON public.custom_songs(status);