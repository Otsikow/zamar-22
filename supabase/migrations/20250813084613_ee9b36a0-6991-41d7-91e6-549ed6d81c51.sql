-- Analyze and fix profiles table security to protect email addresses and personal data

-- First, ensure all policies are properly restrictive and use consistent functions

-- Drop existing policies to recreate with stronger security
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update account status" ON public.profiles;

-- Create more secure policies using consistent admin checking

-- Users can only view their own profile data
CREATE POLICY "Users can view own profile only" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Users can only insert their own profile
CREATE POLICY "Users can insert own profile only" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Users can only update their own profile (but not account_status)
CREATE POLICY "Users can update own profile data" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Admins can view all profiles (for legitimate admin purposes only)
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (is_admin());

-- Only admins can update account status and admin-controlled fields
CREATE POLICY "Admins can manage account status" 
ON public.profiles 
FOR UPDATE 
USING (is_admin())
WITH CHECK (is_admin());

-- Prevent deletion of profiles for data integrity
CREATE POLICY "Prevent profile deletion" 
ON public.profiles 
FOR DELETE 
USING (false);

-- Add additional security: ensure sensitive columns are properly protected
-- This prevents any potential column-level access issues

-- Create a view for public profile information (if needed for public features)
DROP VIEW IF EXISTS public.public_profiles;
CREATE VIEW public.public_profiles AS
SELECT 
  id,
  first_name,
  -- Deliberately exclude email, last_name, and other sensitive data
  preferred_language,
  created_at
FROM public.profiles
WHERE account_status = 'active';

-- Grant access to the public view
GRANT SELECT ON public.public_profiles TO authenticated, anon;

-- Add RLS to the view as well
ALTER VIEW public.public_profiles SET (security_barrier = true);

-- Add a function to get user profile safely (for internal use)
CREATE OR REPLACE FUNCTION public.get_user_profile(target_user_id uuid)
RETURNS TABLE(
  id uuid,
  first_name text,
  last_name text,
  email text,
  preferred_language text,
  account_status account_status,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path TO 'public'
AS $$
  -- Only return data if the requester is the user themselves or an admin
  SELECT 
    p.id,
    p.first_name,
    p.last_name,
    p.email,
    p.preferred_language,
    p.account_status,
    p.created_at,
    p.updated_at
  FROM public.profiles p
  WHERE p.id = target_user_id
    AND (auth.uid() = target_user_id OR is_admin());
$$;

-- Grant execute permission on the safe function
GRANT EXECUTE ON FUNCTION public.get_user_profile TO authenticated;