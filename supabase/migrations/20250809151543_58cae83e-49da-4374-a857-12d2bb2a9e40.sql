-- 1) Add image_url column to chat_messages
ALTER TABLE public.chat_messages
ADD COLUMN IF NOT EXISTS image_url text;

-- 2) Create public storage bucket for chat images
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat', 'chat', true)
ON CONFLICT (id) DO NOTHING;

-- 3) Storage policies for chat images
-- Anyone can read objects from public bucket 'chat'
DROP POLICY IF EXISTS "Public can view chat images" ON storage.objects;
CREATE POLICY "Public can view chat images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'chat');

-- Only chat participants can upload to a folder named with the room UUID
DROP POLICY IF EXISTS "Chat participants can upload images" ON storage.objects;
CREATE POLICY "Chat participants can upload images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'chat' AND
  EXISTS (
    SELECT 1 FROM public.chat_rooms r
    WHERE r.id = ((storage.foldername(name))[1])::uuid
      AND (r.user_id = auth.uid() OR r.admin_id = auth.uid())
  )
);

-- Only chat participants can update their room images
DROP POLICY IF EXISTS "Chat participants can update images" ON storage.objects;
CREATE POLICY "Chat participants can update images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'chat' AND
  EXISTS (
    SELECT 1 FROM public.chat_rooms r
    WHERE r.id = ((storage.foldername(name))[1])::uuid
      AND (r.user_id = auth.uid() OR r.admin_id = auth.uid())
  )
)
WITH CHECK (
  bucket_id = 'chat' AND
  EXISTS (
    SELECT 1 FROM public.chat_rooms r
    WHERE r.id = ((storage.foldername(name))[1])::uuid
      AND (r.user_id = auth.uid() OR r.admin_id = auth.uid())
  )
);

-- Only chat participants can delete their room images
DROP POLICY IF EXISTS "Chat participants can delete images" ON storage.objects;
CREATE POLICY "Chat participants can delete images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'chat' AND
  EXISTS (
    SELECT 1 FROM public.chat_rooms r
    WHERE r.id = ((storage.foldername(name))[1])::uuid
      AND (r.user_id = auth.uid() OR r.admin_id = auth.uid())
  )
);
