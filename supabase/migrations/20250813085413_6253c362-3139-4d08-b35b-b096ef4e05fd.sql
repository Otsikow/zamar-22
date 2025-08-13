-- Identify security definer functions with corrected SQL

-- Check for any functions that are security definer
SELECT 
    routine_name,
    routine_type,
    security_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND security_type = 'DEFINER';

-- Also check pg_proc for detailed security definer functions
SELECT 
    proname as function_name,
    prosecdef as is_security_definer,
    pg_get_function_result(oid) as return_type
FROM pg_proc 
WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  AND prosecdef = true;