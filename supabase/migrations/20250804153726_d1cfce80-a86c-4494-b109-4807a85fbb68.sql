-- Create lyrics table
CREATE TABLE public.lyrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  song_id UUID REFERENCES public.songs(id) ON DELETE CASCADE,
  text TEXT,
  language TEXT DEFAULT 'English',
  pdf_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create donations table
CREATE TABLE public.donations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('one-time', 'monthly')),
  campaign TEXT,
  stripe_payment_id TEXT,
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.lyrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

-- Create storage bucket for lyrics PDFs
INSERT INTO storage.buckets (id, name, public) 
VALUES ('lyrics', 'lyrics', true);

-- Lyrics policies
CREATE POLICY "Anyone can view lyrics for featured songs" 
ON public.lyrics 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.songs 
    WHERE songs.id = lyrics.song_id 
    AND songs.featured = true
  )
);

CREATE POLICY "Admins can manage all lyrics" 
ON public.lyrics 
FOR ALL 
USING (public.is_admin());

-- Donations policies
CREATE POLICY "Users can view their own donations" 
ON public.donations 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own donations" 
ON public.donations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all donations" 
ON public.donations 
FOR SELECT 
USING (public.is_admin());

CREATE POLICY "Admins can manage all donations" 
ON public.donations 
FOR ALL 
USING (public.is_admin());

-- Storage policies for lyrics PDFs
CREATE POLICY "Anyone can view lyrics PDFs" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'lyrics');

CREATE POLICY "Admins can upload lyrics PDFs" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'lyrics' AND public.is_admin());

CREATE POLICY "Admins can update lyrics PDFs" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'lyrics' AND public.is_admin());

CREATE POLICY "Admins can delete lyrics PDFs" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'lyrics' AND public.is_admin());

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_lyrics_updated_at
BEFORE UPDATE ON public.lyrics
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_donations_updated_at
BEFORE UPDATE ON public.donations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();