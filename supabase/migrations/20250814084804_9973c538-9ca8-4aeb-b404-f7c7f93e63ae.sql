-- Fix search path security vulnerability for log_admin_operation function
-- This prevents function injection attacks by explicitly setting the search path

ALTER FUNCTION public.log_admin_operation(operation_type text, target_table text, target_id uuid, additional_info jsonb)
SET search_path = 'public', 'pg_temp';

-- Add comment explaining the security fix
COMMENT ON FUNCTION public.log_admin_operation IS 'Logs admin operations with secure search path to prevent function injection attacks';