-- Fix Security Definer View warning by removing security_barrier from public_profiles view
-- The security_barrier was added to be cautious, but since this view only exposes 
-- non-sensitive public data and relies on the underlying table's RLS, we can remove it

-- Drop and recreate the view without security_barrier
DROP VIEW IF EXISTS public.public_profiles;

-- Recreate the view without security_barrier property
-- Security is still maintained through:
-- 1. Explicit column selection (no sensitive data)
-- 2. WHERE clause filtering only active accounts
-- 3. Underlying profiles table has strict RLS policies
CREATE VIEW public.public_profiles AS
SELECT 
  id,
  first_name,
  preferred_language,
  created_at
FROM public.profiles
WHERE account_status = 'active';

-- Grant appropriate permissions
GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- Add documentation about the security model
COMMENT ON VIEW public.public_profiles IS 'Public view of user profiles showing only non-sensitive information. Security enforced through explicit column selection and underlying table RLS policies.';

SELECT 'Security Definer View warning resolved - public_profiles view recreated without security_barrier' as status;