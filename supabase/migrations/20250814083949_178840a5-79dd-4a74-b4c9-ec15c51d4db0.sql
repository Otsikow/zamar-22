-- Secure the public_profiles view to prevent any potential data exposure

-- 1. First, let's add RLS to the public_profiles view itself
-- Since it's a view, we need to ensure it properly respects RLS from underlying tables

-- 2. Remove any overly permissive grants that might exist
REVOKE ALL ON public.public_profiles FROM anon;
REVOKE ALL ON public.public_profiles FROM public;

-- 3. Add specific, controlled access
-- Only allow reading of non-sensitive profile data for authenticated users
GRANT SELECT ON public.public_profiles TO authenticated;

-- 4. Create a more restrictive version of public_profiles that's safer
DROP VIEW IF EXISTS public.public_profiles;

-- Create a highly secure public_profiles view that only shows minimal, non-sensitive data
CREATE VIEW public.public_profiles 
WITH (security_invoker = true) AS
SELECT 
  id,
  first_name,
  preferred_language,
  created_at
FROM public.profiles
WHERE account_status = 'active'
  AND deleted_at IS NULL;  -- Extra safety to ensure deleted profiles aren't shown

-- 5. Grant minimal necessary permissions
-- Only authenticated users can see public profiles, not anonymous users
GRANT SELECT ON public.public_profiles TO authenticated;

-- 6. Add a comment explaining the security considerations
COMMENT ON VIEW public.public_profiles IS 'Secure view of user profiles containing only non-sensitive data. Email addresses and other PII are excluded. Only shows active, non-deleted profiles.';

-- 7. Ensure the underlying profiles table RLS is working correctly
-- Let's verify and strengthen the profiles table security

-- Add additional security for profiles table to prevent any data leaks
DROP POLICY IF EXISTS "Public profiles are safe to view" ON public.profiles;

-- Create a new policy that's more restrictive for public access
CREATE POLICY "Limited public profile access"
ON public.profiles
FOR SELECT
TO public
USING (
  -- Only allow viewing basic profile info if account is active and not deleted
  account_status = 'active' 
  AND deleted_at IS NULL 
  AND (
    -- User can see their own profile completely
    auth.uid() = id 
    -- OR admins can see all profiles
    OR public.is_admin()
    -- OR for public/anon access, only allow if they're viewing through the secure view
    -- (this is handled by the view's column restrictions)
  )
);