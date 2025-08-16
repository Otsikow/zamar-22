-- DIAGNOSTIC QUERY 2: Check if signups carry pending_ref_code and get processed
-- Run this IMMEDIATELY after signing up a test user via your referral link

SELECT 
  id,
  first_name,
  last_name, 
  email,
  pending_ref_code,
  referred_by,
  created_at
FROM profiles
ORDER BY created_at DESC 
LIMIT 10;

-- Expected: 
-- - New user should have pending_ref_code = NULL (consumed by trigger)
-- - New user should have referred_by = referrer's ID
-- - If pending_ref_code is still filled, the trigger didn't fire