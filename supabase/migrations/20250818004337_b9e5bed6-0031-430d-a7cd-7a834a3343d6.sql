-- Simple approach: just add some test data without conflicts
-- First verify we have users to work with
WITH test_users AS (
  SELECT id, referral_code, ROW_NUMBER() OVER (ORDER BY created_at) as rn
  FROM profiles 
  WHERE referral_code IS NOT NULL
  LIMIT 2
),
referrer AS (SELECT id, referral_code FROM test_users WHERE rn = 1),
referred AS (SELECT id FROM test_users WHERE rn = 2)

-- Insert test referral if users exist and no referrals exist yet
INSERT INTO referrals (referrer_id, referred_user_id, generation, amount_pence, status)
SELECT r.id, rd.id, 1, 0, 'pending'
FROM referrer r, referred rd
WHERE NOT EXISTS (SELECT 1 FROM referrals)
  AND r.id IS NOT NULL 
  AND rd.id IS NOT NULL;

-- Insert test earnings if no earnings exist yet  
WITH test_users AS (
  SELECT id, referral_code, ROW_NUMBER() OVER (ORDER BY created_at) as rn
  FROM profiles 
  WHERE referral_code IS NOT NULL
  LIMIT 2
),
referrer AS (SELECT id FROM test_users WHERE rn = 1),
referred AS (SELECT id FROM test_users WHERE rn = 2)

INSERT INTO referral_earnings (user_id, referred_user_id, generation, amount, status)
SELECT r.id, rd.id, 1, 25.00, 'pending'
FROM referrer r, referred rd
WHERE NOT EXISTS (SELECT 1 FROM referral_earnings)
  AND r.id IS NOT NULL 
  AND rd.id IS NOT NULL

UNION ALL

SELECT r.id, rd.id, 1, 15.00, 'paid'
FROM referrer r, referred rd
WHERE NOT EXISTS (SELECT 1 FROM referral_earnings)
  AND r.id IS NOT NULL 
  AND rd.id IS NOT NULL;