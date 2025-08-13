-- Identify all security definer views that need to be fixed

-- Find all views with security_definer option
SELECT 
    schemaname,
    viewname,
    definition,
    viewowner
FROM pg_views 
WHERE schemaname = 'public';

-- Check for any functions that might be flagged as security definer views
SELECT 
    routinename,
    routine_type,
    security_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND security_type = 'DEFINER';

-- Check pg_proc for security definer functions that might be causing the issue
SELECT 
    proname as function_name,
    prosecdef as is_security_definer,
    pg_get_function_result(oid) as return_type,
    pg_get_functiondef(oid) as definition
FROM pg_proc 
WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  AND prosecdef = true;