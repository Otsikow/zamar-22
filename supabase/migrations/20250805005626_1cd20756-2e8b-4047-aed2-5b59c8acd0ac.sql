-- Create database functions for referral analytics to bypass TypeScript type issues

-- Function to get top referrers
CREATE OR REPLACE FUNCTION get_top_referrers()
RETURNS TABLE (
  user_id UUID,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  total_earned NUMERIC,
  reward_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    rr.user_id,
    p.first_name,
    p.last_name,
    p.email,
    SUM(rr.reward_amount) as total_earned,
    COUNT(*)::BIGINT as reward_count
  FROM referral_rewards rr
  LEFT JOIN profiles p ON p.id = rr.user_id
  WHERE rr.user_id IS NOT NULL
  GROUP BY rr.user_id, p.first_name, p.last_name, p.email
  ORDER BY total_earned DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all referral rewards with profile details
CREATE OR REPLACE FUNCTION get_all_referral_rewards()
RETURNS TABLE (
  id UUID,
  user_id UUID,
  referred_user_id UUID,
  payment_amount NUMERIC,
  reward_amount NUMERIC,
  level INTEGER,
  reward_type TEXT,
  created_at TIMESTAMPTZ,
  referrer_first_name TEXT,
  referrer_last_name TEXT,
  referrer_email TEXT,
  referred_first_name TEXT,
  referred_last_name TEXT,
  referred_email TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    rr.id,
    rr.user_id,
    rr.referred_user_id,
    rr.payment_amount,
    rr.reward_amount,
    rr.level,
    rr.reward_type,
    rr.created_at,
    p1.first_name as referrer_first_name,
    p1.last_name as referrer_last_name,
    p1.email as referrer_email,
    p2.first_name as referred_first_name,
    p2.last_name as referred_last_name,
    p2.email as referred_email
  FROM referral_rewards rr
  LEFT JOIN profiles p1 ON p1.id = rr.user_id
  LEFT JOIN profiles p2 ON p2.id = rr.referred_user_id
  ORDER BY rr.created_at DESC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get referral totals
CREATE OR REPLACE FUNCTION get_referral_totals()
RETURNS TABLE (total NUMERIC) AS $$
BEGIN
  RETURN QUERY
  SELECT COALESCE(SUM(reward_amount), 0) as total
  FROM referral_rewards;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get referral count
CREATE OR REPLACE FUNCTION get_referral_count()
RETURNS TABLE (count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT COUNT(*)::BIGINT as count
  FROM referrals;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get monthly referral stats
CREATE OR REPLACE FUNCTION get_monthly_referral_stats()
RETURNS TABLE (total NUMERIC) AS $$
BEGIN
  RETURN QUERY
  SELECT COALESCE(SUM(reward_amount), 0) as total
  FROM referral_rewards
  WHERE created_at >= date_trunc('month', CURRENT_DATE)
    AND created_at < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add manual referral reward
CREATE OR REPLACE FUNCTION add_manual_referral_reward(
  p_user_id UUID,
  p_referred_user_id UUID,
  p_payment_amount NUMERIC,
  p_reward_amount NUMERIC,
  p_level INTEGER
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO referral_rewards (
    user_id,
    referred_user_id,
    payment_amount,
    reward_amount,
    level,
    reward_type
  ) VALUES (
    p_user_id,
    p_referred_user_id,
    p_payment_amount,
    p_reward_amount,
    p_level,
    'manual_adjustment'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;