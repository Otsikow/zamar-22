-- Create custom_song_requests table
CREATE TABLE public.custom_song_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  occasion TEXT NOT NULL,
  style_genre TEXT NOT NULL,
  language TEXT,
  key_message TEXT NOT NULL,
  scripture_quote TEXT,
  reference_file_url TEXT,
  tier TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.custom_song_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for users to manage their own requests
CREATE POLICY "Users can view their own requests" 
ON public.custom_song_requests 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own requests" 
ON public.custom_song_requests 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own requests" 
ON public.custom_song_requests 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_custom_song_requests_updated_at
BEFORE UPDATE ON public.custom_song_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();