-- Create test referral data with proper syntax to avoid column ambiguity
DO $$
DECLARE
  test_referrer_id uuid;
  test_referred_id uuid;
  test_ref_code text;
BEGIN
  -- Get an existing user to act as referrer
  SELECT p.id, p.referral_code INTO test_referrer_id, test_ref_code
  FROM profiles p
  WHERE p.referral_code IS NOT NULL 
  LIMIT 1;
  
  IF test_referrer_id IS NOT NULL THEN
    -- Get another user to act as referred user
    SELECT p2.id INTO test_referred_id
    FROM profiles p2
    WHERE p2.id != test_referrer_id 
    LIMIT 1;
    
    IF test_referred_id IS NOT NULL THEN
      -- Create a test referral manually to verify the dashboard
      INSERT INTO referrals (referrer_id, referred_user_id, generation, amount_pence, status)
      VALUES (test_referrer_id, test_referred_id, 1, 0, 'pending')
      ON CONFLICT (referred_user_id) DO NOTHING;
      
      -- Create some test earnings to show in dashboard  
      INSERT INTO referral_earnings (user_id, referred_user_id, generation, amount, status)
      VALUES 
        (test_referrer_id, test_referred_id, 1, 25.00, 'pending'),
        (test_referrer_id, test_referred_id, 1, 15.00, 'paid')
      ON CONFLICT DO NOTHING;
      
      -- Update the referred user to show they were referred
      UPDATE profiles 
      SET referred_by = test_referrer_id
      WHERE id = test_referred_id;
      
      RAISE NOTICE 'Test referral created successfully';
    END IF;
  END IF;
END $$;