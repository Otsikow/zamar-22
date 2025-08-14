-- Fix remaining security definer functions without search paths

CREATE OR REPLACE FUNCTION public.admin_suspend_user(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  -- require admin
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  UPDATE public.profiles
  SET account_status = 'suspended', suspended_at = now()
  WHERE id = target_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_unsuspend_user(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  UPDATE public.profiles
  SET account_status = 'active', suspended_at = NULL
  WHERE id = target_user_id AND account_status = 'suspended';
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_soft_delete_user(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  UPDATE public.profiles
  SET account_status = 'deleted', deleted_at = now()
  WHERE id = target_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.custom_after_delivery_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  r public.custom_song_requests;
BEGIN
  SELECT * INTO r FROM public.custom_song_requests WHERE id = NEW.request_id;

  INSERT INTO public.user_custom_library (user_id, request_id, title, final_audio_path, lyrics_pdf_path, cover_art_path)
  VALUES (r.user_id, r.id, COALESCE(r.title, 'Custom Song'), NEW.final_audio_path, NEW.lyrics_pdf_path, NEW.cover_art_path)
  ON CONFLICT (user_id, request_id) DO NOTHING;

  UPDATE public.custom_song_requests SET status='delivered' WHERE id = r.id;

  INSERT INTO public.notifications (user_id, type, title, message, link)
  VALUES (
    r.user_id,
    'custom_song_delivered',
    'Your custom song is ready!',
    'Tap to download your final files.',
    '/library'
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.custom_on_draft_asset_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  IF NEW.kind = 'draft_audio' THEN
    UPDATE public.custom_song_requests
      SET status='draft_shared'
      WHERE id = NEW.request_id AND status = 'in_production';

    INSERT INTO public.notifications (user_id, type, title, message, link)
    SELECT r.user_id, 'custom_song_draft', 'Draft ready for review', 'Please review and request changes.', '/library'
    FROM public.custom_song_requests r
    WHERE r.id = NEW.request_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_admin_new_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
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

CREATE OR REPLACE FUNCTION public.notify_custom_song_delivered()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  IF NEW.status = 'delivered' AND (OLD.status IS NULL OR OLD.status != 'delivered') THEN
    INSERT INTO public.notifications (user_id, type, title, message, link)
    VALUES (
      NEW.user_id,
      'custom_song_delivered',
      '🎁 Your custom song is ready!',
      'We''ve delivered your requested custom song: ' || NEW.song_title,
      '/library'
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_paid(request uuid, amount integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  UPDATE public.custom_song_requests
  SET status='in_production', price_cents = COALESCE(price_cents, amount)
  WHERE id = request AND status IN ('awaiting_payment','quoted');
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, email)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data ->> 'first_name', 
    NEW.raw_user_meta_data ->> 'last_name',
    NEW.email
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.log_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  -- Only log if the role was actually changed
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    INSERT INTO public.role_change_logs (user_id, changed_by, old_role, new_role)
    VALUES (
      NEW.user_id,
      auth.uid(),
      OLD.role,
      NEW.role
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_admin_new_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
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
$$;