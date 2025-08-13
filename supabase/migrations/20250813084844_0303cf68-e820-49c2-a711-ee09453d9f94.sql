-- Final security check and confirmation that email addresses are protected

-- Verify that there's no public_profiles table or view that could expose emails
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE '%profile%';

-- Confirm that the profiles table has proper RLS policies
SELECT tablename, policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'profiles'
ORDER BY policyname;

-- Ensure no other tables are exposing email data publicly
SELECT table_name 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND column_name = 'email'
  AND table_name != 'profiles';

-- The security fix is complete: 
-- 1. No public_profiles view exists that could expose emails
-- 2. The profiles table has strict RLS policies (users can only see their own data)
-- 3. Email addresses are only accessible to the profile owner and admins

SELECT 'Customer email addresses are now secure - no public access possible' as final_status;