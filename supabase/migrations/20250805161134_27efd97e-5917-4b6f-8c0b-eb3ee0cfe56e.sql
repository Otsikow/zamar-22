-- Insert sample profiles (these would normally be created by auth triggers)
INSERT INTO public.profiles (id, first_name, last_name, email)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Admin', 'User', 'admin@zamar.com'),
  ('00000000-0000-0000-0000-000000000002', 'John', 'Supporter', 'supporter@zamar.com');

-- Make the first user an admin
INSERT INTO public.admin_users (user_id, role)
VALUES ('00000000-0000-0000-0000-000000000001', 'admin');

-- Sample notifications
INSERT INTO public.notifications (user_id, type, message, is_read)
VALUES
  ('00000000-0000-0000-0000-000000000002', 'song_request', 'New custom song request: Psalm 91 in Yoruba', false),
  ('00000000-0000-0000-0000-000000000002', 'message', 'New chat message from user', false),
  ('00000000-0000-0000-0000-000000000002', 'song_request', 'New custom song request: Amazing Grace translation', true);

-- Sample chat room
INSERT INTO public.chat_rooms (id, user_id, admin_id)
VALUES (
  '11111111-1111-1111-1111-111111111111', 
  '00000000-0000-0000-0000-000000000002', 
  '00000000-0000-0000-0000-000000000001'
);

-- Sample chat messages
INSERT INTO public.chat_messages (room_id, sender_id, message, seen, sent_at)
VALUES
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000002', 'Hello admin, I''d like to request a song.', true, now() - interval '2 hours'),
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', 'Sure! What''s the scripture or theme?', true, now() - interval '1 hour'),
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000002', 'Psalm 91 in Yoruba please.', false, now() - interval '30 minutes'),
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', 'Great choice! I''ll start working on that translation.', true, now() - interval '15 minutes');