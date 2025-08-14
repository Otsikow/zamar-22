-- Fix security vulnerabilities in user data access

-- Remove the conflicting "Limited public profile access" policy from profiles table
-- This policy was allowing broader access that could expose user data
DROP POLICY IF EXISTS "Limited public profile access" ON public.profiles;

-- The remaining policies on profiles table are secure:
-- - "Users can view own profile only" - allows users to see only their own profile
-- - "Admins can view all profiles" - allows admins to manage users
-- - "Users can insert own profile only" and "Users can update own profile data" - secure self-management

-- Since public_profiles is a view based on profiles table, 
-- it inherits the security from the underlying table's RLS policies.
-- With the problematic policy removed, access is now properly restricted.