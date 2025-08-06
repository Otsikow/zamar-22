-- Create testimonials table
CREATE TABLE public.testimonials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  message TEXT NOT NULL,
  audio_url TEXT,
  status TEXT DEFAULT 'pending', -- pending, approved, rejected
  moderated_at TIMESTAMP WITH TIME ZONE,
  moderated_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

-- Create policies for testimonials
CREATE POLICY "Anyone can view approved testimonials" 
ON public.testimonials 
FOR SELECT 
USING (status = 'approved');

CREATE POLICY "Users can view their own testimonials" 
ON public.testimonials 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create testimonials" 
ON public.testimonials 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pending testimonials" 
ON public.testimonials 
FOR UPDATE 
USING (auth.uid() = user_id AND status = 'pending');

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_testimonials_updated_at
BEFORE UPDATE ON public.testimonials
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();