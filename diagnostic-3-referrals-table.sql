-- DIAGNOSTIC QUERY 3: Check if referrals table gets populated
-- Run this to verify referral rows are being created

SELECT 
  r.referrer_id,
  r.referred_user_id,
  r.level,
  r.amount_pence,
  r.status,
  r.created_at,
  p1.first_name as referrer_name,
  p1.email as referrer_email,
  p2.first_name as referred_name,
  p2.email as referred_email
FROM referrals r
LEFT JOIN profiles p1 ON r.referrer_id = p1.id
LEFT JOIN profiles p2 ON r.referred_user_id = p2.id
ORDER BY r.created_at DESC 
LIMIT 10;

-- Expected: One row per referred user with proper referrer/referred mapping