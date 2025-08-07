-- Create the role_change_logs audit table
CREATE TABLE role_change_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,                                  -- user whose role was changed
  changed_by uuid,                              -- admin who made the change
  old_role text,
  new_role text,
  changed_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on the audit table
ALTER TABLE role_change_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view role change logs
CREATE POLICY "Admins can view role change logs"
ON role_change_logs
FOR SELECT
USING (is_admin());

-- System can insert logs (for triggers)
CREATE POLICY "System can insert role change logs"
ON role_change_logs
FOR INSERT
WITH CHECK (true);

-- Create the trigger function
CREATE OR REPLACE FUNCTION log_role_change()
RETURNS trigger AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach the trigger to admin_users
CREATE TRIGGER after_role_update
AFTER UPDATE ON admin_users
FOR EACH ROW
EXECUTE FUNCTION log_role_change();