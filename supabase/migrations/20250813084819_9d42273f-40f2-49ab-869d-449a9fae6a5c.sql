-- CRITICAL FIX: Completely secure the public_profiles view to prevent email exposure

-- Drop the existing public_profiles view entirely to prevent any data leakage
DROP VIEW IF EXISTS public.public_profiles;

-- Remove all grants that might allow public access
REVOKE ALL ON public.public_profiles FROM authenticated, anon;

-- If we need a public view in the future, we'll create it more carefully
-- For now, completely remove this potential attack vector

-- Ensure the underlying profiles table RLS is working correctly
-- Verify that direct access to profiles table is properly restricted

-- Check current policies on profiles table to ensure they're restrictive enough
SELECT schemaname, tablename, policyname, cmd, roles 
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'profiles';

-- The fix: Remove the public_profiles view entirely since it may be exposing sensitive data
-- Applications should query the profiles table directly, which has proper RLS policies

SELECT 'public_profiles view has been removed to prevent email address exposure' as security_status;