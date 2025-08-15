-- DIAGNOSTIC QUERY 1: Check if we have referral codes and referrers
-- Run this to verify referral codes are being generated

SELECT 
  id as referrer_id, 
  referral_code as ref_code,
  first_name,
  last_name,
  email,
  created_at
FROM profiles
WHERE referral_code IS NOT NULL
ORDER BY created_at DESC 
LIMIT 10;

-- Expected: You should see your profile with a referral_code like '1a2b3c4d'