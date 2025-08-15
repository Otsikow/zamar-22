-- Create referral tables and functions for bulletproof referral system

-- Table for tracking referral clicks
CREATE TABLE IF NOT EXISTS public.referral_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ref_code TEXT NOT NULL,
  referrer_id UUID REFERENCES auth.users(id),
  clicked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip TEXT,
  ua TEXT
);

-- Update existing referrals table to match new schema
ALTER TABLE public.referrals 
ADD COLUMN IF NOT EXISTS level INT NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS amount_pence INT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending';

-- Ensure profiles table has required columns
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES auth.users(id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON public.referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON public.referrals(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_referral_clicks_ref_code ON public.referral_clicks(ref_code);

-- Function to ensure every user has a ref code
CREATE OR REPLACE FUNCTION public.ensure_ref_code_for(user_id UUID)
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.profiles
    SET referral_code = COALESCE(referral_code, encode(sha256(user_id::text::bytea), 'hex')::text::substring(1, 8))
  WHERE id = user_id;
END; $$;

-- Core function to apply referral attribution
CREATE OR REPLACE FUNCTION public.apply_referral(new_user UUID, raw_ref TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  referrer UUID;
BEGIN
  IF raw_ref IS NULL OR length(raw_ref) < 4 THEN
    RETURN;
  END IF;

  SELECT p.id INTO referrer FROM public.profiles p WHERE p.referral_code = raw_ref LIMIT 1;
  IF referrer IS NULL OR referrer = new_user THEN
    RETURN; -- invalid or self-referral
  END IF;

  -- Set convenience pointer
  UPDATE public.profiles SET referred_by = referrer WHERE id = new_user AND referred_by IS NULL;

  -- Create the referrals row if it doesn't exist yet
  INSERT INTO public.referrals (referrer_id, referred_user_id, generation, amount_pence, status)
  VALUES (referrer, new_user, 1, 0, 'pending')
  ON CONFLICT (referred_user_id) DO NOTHING;
END; $$;

-- Enhanced trigger function for user creation
CREATE OR REPLACE FUNCTION public.on_auth_user_created()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Insert or update profile
  INSERT INTO public.profiles (id, first_name, last_name, email, referral_code)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.email,
    NULL
  )
  ON CONFLICT (id) DO UPDATE SET
    first_name = COALESCE(EXCLUDED.first_name, profiles.first_name),
    last_name = COALESCE(EXCLUDED.last_name, profiles.last_name),
    email = COALESCE(EXCLUDED.email, profiles.email);

  -- Ensure ref code exists
  PERFORM public.ensure_ref_code_for(NEW.id);

  -- Apply referral if ref_code was passed during signup
  PERFORM public.apply_referral(NEW.id, NEW.raw_user_meta_data->>'ref_code');
  
  RETURN NEW;
END; $$;

-- Drop and recreate trigger to ensure it uses the new function
DROP TRIGGER IF EXISTS trg_on_auth_user_created ON auth.users;
CREATE TRIGGER trg_on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.on_auth_user_created();

-- Enable RLS on new tables
ALTER TABLE public.referral_clicks ENABLE ROW LEVEL SECURITY;

-- RLS policies for referral_clicks
CREATE POLICY "Anyone can insert referral clicks" ON public.referral_clicks
FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view referral clicks" ON public.referral_clicks
FOR SELECT USING (is_admin());

-- Grant permissions for service role
GRANT ALL ON public.referral_clicks TO service_role;

-- Create view for dashboard totals
CREATE OR REPLACE VIEW public.v_my_referral_totals AS
SELECT
  auth.uid() AS me,
  (SELECT COUNT(*) FROM public.referrals r WHERE r.referrer_id = auth.uid()) AS total_referrals,
  (SELECT COALESCE(SUM(amount_pence), 0) FROM public.referrals r WHERE r.referrer_id = auth.uid() AND r.status IN ('approved', 'paid')) AS total_earned_pence,
  (SELECT COALESCE(SUM(amount_pence), 0) FROM public.referrals r WHERE r.referrer_id = auth.uid() AND r.status = 'paid') AS paid_out_pence,
  (SELECT COALESCE(SUM(amount_pence), 0) FROM public.referrals r WHERE r.referrer_id = auth.uid() AND r.status = 'approved') AS pending_payout_pence;

-- Function to approve referral commission
CREATE OR REPLACE FUNCTION public.approve_referral_for(referred UUID, order_total_pence INT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.referrals
    SET amount_pence = (order_total_pence * 15) / 100,
        status = 'approved'
  WHERE referred_user_id = referred
    AND status = 'pending';
END; $$;

-- Grant access to view for authenticated users
GRANT SELECT ON public.v_my_referral_totals TO authenticated;