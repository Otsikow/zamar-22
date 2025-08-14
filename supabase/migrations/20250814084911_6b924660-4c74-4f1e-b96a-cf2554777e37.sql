-- Fix all remaining search path security vulnerabilities
-- Apply the most secure search path setting

-- For security definer functions, use empty search path for maximum security
ALTER FUNCTION public.log_admin_operation(operation_type text, target_table text, target_id uuid, additional_info jsonb)
SET search_path = '';

-- Also check other security definer functions and fix them
ALTER FUNCTION public.is_admin()
SET search_path = '';

ALTER FUNCTION public.get_user_role(user_id uuid)
SET search_path = '';

ALTER FUNCTION public.handle_new_user()
SET search_path = '';

-- Functions that need public schema access should use explicit qualified names
ALTER FUNCTION public.atomic_grant_first_admin()
SET search_path = '';

-- Add comments explaining the security considerations
COMMENT ON FUNCTION public.log_admin_operation IS 'Logs admin operations. Uses empty search path to prevent function injection attacks';
COMMENT ON FUNCTION public.is_admin IS 'Checks if current user is admin. Uses empty search path for security';
COMMENT ON FUNCTION public.get_user_role IS 'Gets user role. Uses empty search path for security';
COMMENT ON FUNCTION public.handle_new_user IS 'Handles new user signup. Uses empty search path for security';
COMMENT ON FUNCTION public.atomic_grant_first_admin IS 'Grants admin to first user atomically. Uses empty search path for security';