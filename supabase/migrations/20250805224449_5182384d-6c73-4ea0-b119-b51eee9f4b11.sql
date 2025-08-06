-- Fix security warning by setting search_path for the function
CREATE OR REPLACE FUNCTION mark_referral_earnings_as_paid(
  earnings_ids uuid[],
  payout_method text DEFAULT 'manual payout'
)
RETURNS void AS $$
DECLARE
  eid uuid;
  uid uuid;
  amt numeric(10,2);
BEGIN
  -- Loop through all provided earning IDs
  FOREACH eid IN ARRAY earnings_ids
  LOOP
    -- Get data before updating
    SELECT user_id, amount INTO uid, amt
    FROM referral_earnings
    WHERE id = eid AND status = 'pending';

    -- Only proceed if record exists and is pending
    IF FOUND THEN
      -- Update referral earnings
      UPDATE referral_earnings
      SET status = 'paid'
      WHERE id = eid;

      -- Log into payouts table for traceability
      INSERT INTO payouts (user_id, amount, method, notes)
      VALUES (uid, amt, payout_method, 'Auto-logged from admin bulk update');
    END IF;

  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';