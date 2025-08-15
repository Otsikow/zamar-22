-- Fix RLS policies for referral visibility

-- Grant access to the view for authenticated users
GRANT SELECT ON public.v_my_referral_totals TO authenticated, anon;

-- Update RLS policies for better referral data access
DROP POLICY IF EXISTS "Users can view their own referrals" ON public.referrals;
CREATE POLICY "Users can view their own referrals" ON public.referrals
FOR SELECT USING (
  auth.uid() = referrer_id OR 
  auth.uid() = referred_user_id OR 
  auth.uid() IN (
    SELECT id FROM public.profiles WHERE referral_code IS NOT NULL
  )
);

-- Update referral earnings policy
DROP POLICY IF EXISTS "Users can view their own earnings" ON public.referral_earnings;
CREATE POLICY "Users can view their own earnings" ON public.referral_earnings
FOR SELECT USING (auth.uid() = user_id);

-- Ensure profiles can be read for referral code generation
DROP POLICY IF EXISTS "Users can view own profile only" ON public.profiles;
CREATE POLICY "Users can view own profile only" ON public.profiles
FOR SELECT USING (auth.uid() = id);

-- Allow users to update their own profile for referral code generation
DROP POLICY IF EXISTS "Users can update own profile data" ON public.profiles;
CREATE POLICY "Users can update own profile data" ON public.profiles
FOR UPDATE USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);