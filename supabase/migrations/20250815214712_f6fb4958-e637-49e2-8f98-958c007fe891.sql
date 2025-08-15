-- Allow public access to approved testimonies
-- This fixes the issue where testimonies disappeared after setting security_invoker=on on views
CREATE POLICY "public_can_view_approved_testimonies" 
ON public.testimonies 
FOR SELECT 
USING (status = 'approved' AND published_at IS NOT NULL);