-- Fix security vulnerabilities in user data access

-- First, let's fix the profiles table RLS policies
-- Remove the conflicting "Limited public profile access" policy that could expose user data
DROP POLICY IF EXISTS "Limited public profile access" ON public.profiles;

-- Ensure only users can access their own profiles (keep existing secure policies)
-- The existing policies "Users can view own profile only" and "Admins can view all profiles" are sufficient

-- Second, fix the public_profiles table by adding proper RLS
-- Enable RLS on public_profiles table
ALTER TABLE public.public_profiles ENABLE ROW LEVEL SECURITY;

-- Add policies to restrict access to public_profiles
CREATE POLICY "Users can view own public profile" 
ON public.public_profiles 
FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Admins can view all public profiles" 
ON public.public_profiles 
FOR SELECT 
USING (is_admin());

-- Add policy for users to insert their own public profile
CREATE POLICY "Users can insert own public profile" 
ON public.public_profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Add policy for users to update their own public profile
CREATE POLICY "Users can update own public profile" 
ON public.public_profiles 
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);