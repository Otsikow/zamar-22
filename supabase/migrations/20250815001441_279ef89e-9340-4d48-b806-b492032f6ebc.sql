-- Fix the admin notification function for new custom song requests
CREATE OR REPLACE FUNCTION public.notify_admins_new_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  admin_user_id uuid;
  requester_name text;
  requester_email text;
BEGIN
  -- Get requester information
  SELECT COALESCE(first_name || ' ' || last_name, email, 'Anonymous') as name, email
  INTO requester_name, requester_email
  FROM public.profiles 
  WHERE id = NEW.user_id;

  -- Notify all admins about the new request
  FOR admin_user_id IN 
    SELECT user_id FROM public.admin_users
  LOOP
    INSERT INTO public.notifications (
      user_id, 
      type, 
      title,
      message, 
      link,
      metadata
    ) VALUES (
      admin_user_id,
      'custom_song_request',
      'New Custom Song Request',
      'New request from ' || COALESCE(requester_name, 'Anonymous') || ': ' || COALESCE(LEFT(NEW.key_message, 100), 'No message'),
      '/admin/custom-requests/' || NEW.id::text,
      jsonb_build_object(
        'request_id', NEW.id,
        'requester_id', NEW.user_id,
        'requester_email', requester_email,
        'occasion', NEW.occasion,
        'tier', NEW.tier
      )
    );
  END LOOP;

  RETURN NEW;
END;
$$;

-- Create trigger for new custom song requests
DROP TRIGGER IF EXISTS trigger_notify_admins_new_request ON public.custom_song_requests;

CREATE TRIGGER trigger_notify_admins_new_request
  AFTER INSERT ON public.custom_song_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admins_new_request();

-- Also create a function to notify admins when request status changes to important states
CREATE OR REPLACE FUNCTION public.notify_admins_request_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  admin_user_id uuid;
  requester_name text;
  status_message text;
BEGIN
  -- Only notify on specific status changes
  IF NEW.status = OLD.status THEN
    RETURN NEW;
  END IF;

  -- Define which status changes to notify about
  IF NEW.status NOT IN ('awaiting_payment', 'draft_shared', 'delivered', 'cancelled') THEN
    RETURN NEW;
  END IF;

  -- Get requester information
  SELECT COALESCE(first_name || ' ' || last_name, email, 'Anonymous') as name
  INTO requester_name
  FROM public.profiles 
  WHERE id = NEW.user_id;

  -- Create appropriate message based on status
  CASE NEW.status
    WHEN 'awaiting_payment' THEN
      status_message := 'Payment required for request from ' || COALESCE(requester_name, 'Anonymous');
    WHEN 'draft_shared' THEN
      status_message := 'Draft shared for review with ' || COALESCE(requester_name, 'Anonymous');
    WHEN 'delivered' THEN
      status_message := 'Custom song delivered to ' || COALESCE(requester_name, 'Anonymous');
    WHEN 'cancelled' THEN
      status_message := 'Request cancelled by ' || COALESCE(requester_name, 'Anonymous');
    ELSE
      status_message := 'Status updated to ' || NEW.status || ' for ' || COALESCE(requester_name, 'Anonymous');
  END CASE;

  -- Notify all admins about the status change
  FOR admin_user_id IN 
    SELECT user_id FROM public.admin_users
  LOOP
    INSERT INTO public.notifications (
      user_id, 
      type, 
      title,
      message, 
      link,
      metadata
    ) VALUES (
      admin_user_id,
      'custom_song_status',
      'Custom Song Status Update',
      status_message,
      '/admin/custom-requests/' || NEW.id::text,
      jsonb_build_object(
        'request_id', NEW.id,
        'old_status', OLD.status,
        'new_status', NEW.status,
        'requester_id', NEW.user_id
      )
    );
  END LOOP;

  RETURN NEW;
END;
$$;

-- Create trigger for status changes
DROP TRIGGER IF EXISTS trigger_notify_admins_status_change ON public.custom_song_requests;

CREATE TRIGGER trigger_notify_admins_status_change
  AFTER UPDATE ON public.custom_song_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admins_request_status_change();