-- Update trigger to include message preview and sender email in notifications metadata
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
  user_email text;
BEGIN
  -- Get the user_id from the chat room
  SELECT user_id INTO room_user_id 
  FROM public.chat_rooms 
  WHERE id = NEW.room_id;
  
  -- Only notify if message is from user (not admin)
  IF NEW.sender_id = room_user_id THEN
    -- Get user's name and email from profiles table
    SELECT first_name, last_name, email INTO user_first_name, user_last_name, user_email
    FROM public.profiles 
    WHERE id = room_user_id;
    
    -- Create display name
    IF user_first_name IS NOT NULL OR user_last_name IS NOT NULL THEN
      user_display_name := TRIM(COALESCE(user_first_name, '') || ' ' || COALESCE(user_last_name, ''));
    ELSE
      -- Fallback to email if no name available
      user_display_name := COALESCE(user_email, 'Anonymous User');
    END IF;
    
    -- Insert notification with user's name and message preview
    INSERT INTO public.notifications (type, message, user_id, metadata)
    VALUES (
      'message',
      'New chat message from ' || user_display_name,
      NEW.sender_id,
      jsonb_build_object(
        'sender_user_id', NEW.sender_id,
        'sender_email', user_email,
        'room_id', NEW.room_id,
        'message_preview', NEW.message,
        'sent_at', NEW.sent_at
      )
    );
  END IF;
  
  RETURN NEW;
END;
$function$;