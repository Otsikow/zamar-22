-- Test the referral system by creating a sample referral
-- This will help verify the dashboard shows proper data

DO $$
DECLARE
  referrer_id uuid;
  referred_user_id uuid;
  test_ref_code text;
BEGIN
  -- Get an existing user to act as referrer
  SELECT id, referral_code INTO referrer_id, test_ref_code
  FROM profiles 
  WHERE referral_code IS NOT NULL 
  LIMIT 1;
  
  IF referrer_id IS NOT NULL THEN
    -- Get another user to act as referred user (or create a mock one)
    SELECT id INTO referred_user_id
    FROM profiles 
    WHERE id != referrer_id 
    LIMIT 1;
    
    IF referred_user_id IS NOT NULL THEN
      -- Create a test referral manually to verify the dashboard
      INSERT INTO referrals (referrer_id, referred_user_id, generation, amount_pence, status)
      VALUES (referrer_id, referred_user_id, 1, 0, 'pending')
      ON CONFLICT (referred_user_id) DO NOTHING;
      
      -- Create some test earnings to show in dashboard
      INSERT INTO referral_earnings (user_id, referred_user_id, generation, amount, status)
      VALUES 
        (referrer_id, referred_user_id, 1, 25.00, 'pending'),
        (referrer_id, referred_user_id, 1, 15.00, 'paid')
      ON CONFLICT DO NOTHING;
      
      -- Update the referred user to show they were referred
      UPDATE profiles 
      SET referred_by = referrer_id
      WHERE id = referred_user_id;
      
      RAISE NOTICE 'Test referral created: referrer=%, referred=%, ref_code=%', referrer_id, referred_user_id, test_ref_code;
    END IF;
  END IF;
END $$;

-- Verify the test data was created
SELECT 
  'Test Results' as status,
  (SELECT COUNT(*) FROM referrals) as total_referrals,
  (SELECT COUNT(*) FROM referral_earnings) as total_earnings,
  (SELECT SUM(amount) FROM referral_earnings WHERE status = 'pending') as pending_amount,
  (SELECT SUM(amount) FROM referral_earnings WHERE status = 'paid') as paid_amount;