-- First, let's check and update the existing RLS policies for admin_users
-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Admins can read user roles" ON admin_users;
DROP POLICY IF EXISTS "Admins can update user roles" ON admin_users;
DROP POLICY IF EXISTS "Admins cannot change their own role" ON admin_users;

-- Policy 1: Only admins can read all user roles
CREATE POLICY "Admins can read all user roles"
ON admin_users
FOR SELECT
USING (is_admin());

-- Policy 2: Only admins can update user roles (but not their own)
CREATE POLICY "Admins can update other user roles"
ON admin_users
FOR UPDATE
USING (
  is_admin() 
  AND user_id != auth.uid()
)
WITH CHECK (
  is_admin() 
  AND user_id != auth.uid()
);

-- Policy 3: Only admins can insert new admin users
CREATE POLICY "Admins can create admin users"
ON admin_users
FOR INSERT
WITH CHECK (is_admin());

-- Policy 4: Prevent deletion of admin users for safety
CREATE POLICY "Prevent admin user deletion"
ON admin_users
FOR DELETE
USING (false);  -- No one can delete admin users for security

-- Ensure RLS is enabled
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Add constraint to ensure valid roles
ALTER TABLE admin_users 
ADD CONSTRAINT valid_roles 
CHECK (role IN ('listener', 'supporter', 'admin'));