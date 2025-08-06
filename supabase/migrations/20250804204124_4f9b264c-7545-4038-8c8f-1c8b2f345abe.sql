-- Create storage bucket for songs if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('songs', 'songs', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for songs bucket
CREATE POLICY "Anyone can view songs" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'songs');

CREATE POLICY "Admins can upload songs" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'songs' AND is_admin());

CREATE POLICY "Admins can delete songs" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'songs' AND is_admin());