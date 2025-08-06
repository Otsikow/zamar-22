-- Fix security warnings by setting search_path on functions
CREATE OR REPLACE FUNCTION public.notify_admin_new_request()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.notifications (type, message, user_id)
  VALUES (
    'song_request',
    'New custom song request: ' || NEW.key_message,
    NEW.user_id
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_admin_new_message()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = ''
AS $$
DECLARE
  room_user_id uuid;
BEGIN
  -- Get the user_id from the chat room
  SELECT user_id INTO room_user_id 
  FROM public.chat_rooms 
  WHERE id = NEW.room_id;
  
  -- Only notify if message is from user (not admin)
  IF NEW.sender_id = room_user_id THEN
    INSERT INTO public.notifications (type, message, user_id)
    VALUES (
      'message',
      'New chat message from user',
      NEW.sender_id
    );
  END IF;
  
  RETURN NEW;
END;
$$;