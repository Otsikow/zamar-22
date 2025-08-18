-- ===============================
-- COMMISSION RATES TABLE
-- ===============================
CREATE TABLE IF NOT EXISTS referral_commissions (
  level text primary key check (level in ('L1','L2')),
  rate numeric not null check (rate >= 0 and rate <= 1)
);

INSERT INTO referral_commissions(level, rate)
VALUES ('L1',0.15), ('L2',0.10)
ON CONFLICT (level) DO UPDATE SET rate=excluded.rate;

-- Add level to existing referral_earnings table
ALTER TABLE referral_earnings 
ADD COLUMN IF NOT EXISTS level text DEFAULT 'L1' CHECK (level IN ('L1','L2'));

-- Add locked_until for grace period before payouts
ALTER TABLE referral_earnings 
ADD COLUMN IF NOT EXISTS locked_until timestamptz;

-- Add payout tracking
ALTER TABLE referral_earnings 
ADD COLUMN IF NOT EXISTS paid_payout_id uuid;

-- Create referral_payouts table for batch payouts
CREATE TABLE IF NOT EXISTS referral_payouts (
  id uuid primary key default gen_random_uuid(),
  payee_id uuid not null references profiles(id) on delete cascade,
  total_cents bigint not null,
  currency text not null default 'GBP',
  method text default 'stripe',
  status text not null default 'queued' CHECK (status IN ('queued','processing','paid','failed')),
  notes text,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_ref_earnings_level ON referral_earnings(user_id, level, status);
CREATE INDEX IF NOT EXISTS idx_ref_payouts_payee ON referral_payouts(payee_id, status);

-- Enable RLS on new tables
ALTER TABLE referral_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_payouts ENABLE ROW LEVEL SECURITY;

-- RLS policies for commission rates (readable by all)
CREATE POLICY "Anyone can read commission rates" ON referral_commissions
FOR SELECT USING (true);

CREATE POLICY "Admins can manage commission rates" ON referral_commissions
FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- RLS policies for payouts
CREATE POLICY "Admins can manage payouts" ON referral_payouts
FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Users can view their own payouts" ON referral_payouts
FOR SELECT USING (payee_id = auth.uid());

-- ===============================
-- UPDATED PROCEDURE FOR L1/L2 LOGIC
-- ===============================

-- Call when a purchase is confirmed (Stripe webhook)
-- Creates L1 + (optional) L2 earnings at the current rates
CREATE OR REPLACE FUNCTION record_referral_purchase_v2(
  p_buyer_user uuid,
  p_order_id text,
  p_gross_amount_cents bigint,
  p_currency text default 'GBP',
  p_locked_days int default 7
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE 
  v_ref record;
  v_rate_l1 numeric; 
  v_rate_l2 numeric;
  v_l1_cents bigint; 
  v_l2_cents bigint;
  v_l2_referrer_id uuid;
BEGIN
  -- Find the referral row for this buyer (if none, do nothing)
  SELECT * INTO v_ref FROM referrals WHERE referred_user_id = p_buyer_user LIMIT 1;
  IF NOT FOUND THEN RETURN; END IF;

  -- Mark as purchased  
  UPDATE referrals SET status='approved', updated_at=now() WHERE id=v_ref.id;

  -- Get current commission rates
  SELECT rate INTO v_rate_l1 FROM referral_commissions WHERE level='L1';
  SELECT rate INTO v_rate_l2 FROM referral_commissions WHERE level='L2';

  -- Calculate commission amounts
  v_l1_cents := floor(p_gross_amount_cents * v_rate_l1 / 100);

  -- Find L2 referrer (the referrer's referrer)
  SELECT referrer_id INTO v_l2_referrer_id 
  FROM referrals 
  WHERE referred_user_id = v_ref.referrer_id 
  LIMIT 1;

  v_l2_cents := CASE 
    WHEN v_l2_referrer_id IS NOT NULL THEN floor(p_gross_amount_cents * v_rate_l2 / 100)
    ELSE 0 
  END;

  -- Create L1 earning
  INSERT INTO referral_earnings(
    user_id, referred_user_id, generation, level, 
    amount, status, locked_until
  ) VALUES (
    v_ref.referrer_id, v_ref.referred_user_id, 1, 'L1',
    v_l1_cents, 'pending', now() + make_interval(days => p_locked_days)
  );

  -- Create L2 earning if applicable
  IF v_l2_referrer_id IS NOT NULL AND v_l2_cents > 0 THEN
    INSERT INTO referral_earnings(
      user_id, referred_user_id, generation, level,
      amount, status, locked_until
    ) VALUES (
      v_l2_referrer_id, v_ref.referred_user_id, 2, 'L2',
      v_l2_cents, 'pending', now() + make_interval(days => p_locked_days)
    );
  END IF;
END $$;

-- Admin function to create payouts  
CREATE OR REPLACE FUNCTION admin_make_payout(
  p_payee uuid, 
  p_currency text default 'GBP', 
  p_notes text default null
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE 
  v_total bigint; 
  v_payout_id uuid;
BEGIN
  IF NOT is_admin() THEN 
    RAISE EXCEPTION 'Not authorized'; 
  END IF;

  -- Calculate total payable amount
  SELECT sum(amount) INTO v_total
  FROM referral_earnings
  WHERE user_id = p_payee
    AND status='pending'
    AND (locked_until IS NULL OR locked_until <= now());

  IF coalesce(v_total,0) <= 0 THEN
    RAISE EXCEPTION 'Nothing payable';
  END IF;

  -- Create payout record
  INSERT INTO referral_payouts(id, payee_id, total_cents, currency, status, notes)
  VALUES (gen_random_uuid(), p_payee, v_total, p_currency, 'processing', p_notes)
  RETURNING id INTO v_payout_id;

  -- Mark earnings as paid
  UPDATE referral_earnings
    SET status='paid', paid_payout_id=v_payout_id, updated_at=now()
  WHERE user_id = p_payee
    AND status='pending'
    AND (locked_until IS NULL OR locked_until <= now());

  -- Mark payout as completed
  UPDATE referral_payouts 
  SET status='paid', paid_at=now() 
  WHERE id=v_payout_id;

  RETURN v_payout_id;
END $$;