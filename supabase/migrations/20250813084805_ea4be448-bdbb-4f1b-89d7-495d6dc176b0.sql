-- Investigate and fix the public_profiles security issue
-- Check what columns are actually in the public_profiles view

-- First, let's see the exact definition of public_profiles
SELECT definition FROM pg_views WHERE viewname = 'public_profiles' AND schemaname = 'public';

-- Check what columns are actually exposed
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'public_profiles' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- If there's a table (not view) called public_profiles, we need to check that too
SELECT table_type 
FROM information_schema.tables 
WHERE table_name = 'public_profiles' 
  AND table_schema = 'public';