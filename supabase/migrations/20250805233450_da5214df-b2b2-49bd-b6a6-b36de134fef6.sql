-- Update the notify_admin_new_message function to include user's name
CREATE OR REPLACE FUNCTION public.notify_admin_new_message()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  room_user_id uuid;
  user_first_name text;
  user_last_name text;
  user_display_name text;
BEGIN
  -- Get the user_id from the chat room
  SELECT user_id INTO room_user_id 
  FROM public.chat_rooms 
  WHERE id = NEW.room_id;
  
  -- Only notify if message is from user (not admin)
  IF NEW.sender_id = room_user_id THEN
    -- Get user's name from profiles table
    SELECT first_name, last_name INTO user_first_name, user_last_name
    FROM public.profiles 
    WHERE id = room_user_id;
    
    -- Create display name
    IF user_first_name IS NOT NULL OR user_last_name IS NOT NULL THEN
      user_display_name := TRIM(COALESCE(user_first_name, '') || ' ' || COALESCE(user_last_name, ''));
    ELSE
      -- Fallback to email if no name available
      SELECT email INTO user_display_name
      FROM public.profiles 
      WHERE id = room_user_id;
      
      -- If still no name, use generic text
      IF user_display_name IS NULL THEN
        user_display_name := 'Anonymous User';
      END IF;
    END IF;
    
    -- Insert notification with user's name
    INSERT INTO public.notifications (type, message, user_id, metadata)
    VALUES (
      'message',
      'New chat message from ' || user_display_name,
      NEW.sender_id,
      jsonb_build_object('sender_user_id', NEW.sender_id, 'room_id', NEW.room_id)
    );
  END IF;
  
  RETURN NEW;
END;
$function$