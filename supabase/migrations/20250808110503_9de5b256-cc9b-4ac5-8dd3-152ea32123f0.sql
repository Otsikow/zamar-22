-- Harden function search_path per linter
CREATE OR REPLACE FUNCTION public.log_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Only log if the role was actually changed
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    INSERT INTO role_change_logs (user_id, changed_by, old_role, new_role)
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