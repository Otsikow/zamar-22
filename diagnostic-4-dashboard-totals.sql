-- DIAGNOSTIC QUERY 4: Check dashboard totals (what the view should return)
-- Run this to verify the totals that should appear on your dashboard

SELECT 
  auth.uid() as me,
  (SELECT COUNT(*) FROM referrals r WHERE r.referrer_id = auth.uid()) as total_referrals,
  (SELECT COALESCE(SUM(amount_pence), 0) FROM referrals r WHERE r.referrer_id = auth.uid() AND r.status IN ('approved', 'paid')) as total_earned_pence,
  (SELECT COALESCE(SUM(amount_pence), 0) FROM referrals r WHERE r.referrer_id = auth.uid() AND r.status = 'paid') as paid_out_pence,
  (SELECT COALESCE(SUM(amount_pence), 0) FROM referrals r WHERE r.referrer_id = auth.uid() AND r.status = 'approved') as pending_payout_pence;

-- Expected: Shows the actual counts that should appear on your dashboard
-- If this shows correct numbers but dashboard shows 0s, it's a display/RLS issue