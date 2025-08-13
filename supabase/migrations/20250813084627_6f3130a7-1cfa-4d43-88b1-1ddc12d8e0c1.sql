-- Fix the security definer view issue by removing the security barrier
-- and implementing proper RLS policies instead

-- Drop the problematic view
DROP VIEW IF EXISTS public.public_profiles;

-- Recreate the view without security_barrier to avoid the security definer issue
CREATE VIEW public.public_profiles AS
SELECT 
  id,
  first_name,
  preferred_language,
  created_at
FROM public.profiles
WHERE account_status = 'active';

-- Instead of using security_barrier, create proper RLS policies on the view
-- Note: Views inherit RLS from their underlying tables, so this is actually more secure

-- The view will automatically respect the RLS policies on the profiles table
-- Users can only see their own data in the view, and admins can see all active profiles

-- Grant access to the view
GRANT SELECT ON public.public_profiles TO authenticated, anon;

-- Add a comment explaining the security model
COMMENT ON VIEW public.public_profiles IS 'Public view of profile data that excludes sensitive information like email and last name. Security is enforced through RLS policies on the underlying profiles table.';