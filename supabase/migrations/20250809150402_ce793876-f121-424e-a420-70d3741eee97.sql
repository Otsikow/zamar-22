-- Ensure RLS is enabled and correct policies exist so both participants can read/send messages
-- Chat rooms
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "chat_rooms_select_participants" ON public.chat_rooms;
CREATE POLICY "chat_rooms_select_participants"
ON public.chat_rooms
FOR SELECT
USING (auth.uid() = user_id OR auth.uid() = admin_id);

DROP POLICY IF EXISTS "chat_rooms_insert_self" ON public.chat_rooms;
CREATE POLICY "chat_rooms_insert_self"
ON public.chat_rooms
FOR INSERT
WITH CHECK (auth.uid() = user_id OR auth.uid() = admin_id);

DROP POLICY IF EXISTS "chat_rooms_update_participants" ON public.chat_rooms;
CREATE POLICY "chat_rooms_update_participants"
ON public.chat_rooms
FOR UPDATE
USING (auth.uid() = user_id OR auth.uid() = admin_id);

-- Chat messages
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "chat_messages_select_participants" ON public.chat_messages;
CREATE POLICY "chat_messages_select_participants"
ON public.chat_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.chat_rooms r
    WHERE r.id = chat_messages.room_id
      AND (r.user_id = auth.uid() OR r.admin_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "chat_messages_insert_participants" ON public.chat_messages;
CREATE POLICY "chat_messages_insert_participants"
ON public.chat_messages
FOR INSERT
WITH CHECK (
  sender_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.chat_rooms r
    WHERE r.id = chat_messages.room_id
      AND (r.user_id = auth.uid() OR r.admin_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "chat_messages_update_participants" ON public.chat_messages;
CREATE POLICY "chat_messages_update_participants"
ON public.chat_messages
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.chat_rooms r
    WHERE r.id = chat_messages.room_id
      AND (r.user_id = auth.uid() OR r.admin_id = auth.uid())
  )
);

-- Improve realtime payloads for updates
ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;