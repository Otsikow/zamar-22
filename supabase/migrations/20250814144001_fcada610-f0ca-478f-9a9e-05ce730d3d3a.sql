-- Create referral_config table for managing referral rates
CREATE TABLE IF NOT EXISTS public.referral_config (
  id INT PRIMARY KEY DEFAULT 1,
  level1_rate NUMERIC(5,2) NOT NULL DEFAULT 15.00, -- 15%
  level2_rate NUMERIC(5,2) NOT NULL DEFAULT 10.00, -- 10%
  min_purchase_cents INT NOT NULL DEFAULT 2500     -- £25.00
);

-- Insert default config
INSERT INTO public.referral_config (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- Update to ensure 15% rate is set
UPDATE public.referral_config SET level1_rate = 15.00 WHERE id = 1;

-- Add referral_code to profiles if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'referral_code') THEN
    ALTER TABLE public.profiles ADD COLUMN referral_code TEXT UNIQUE;
  END IF;
END $$;

-- Add referred_by to profiles if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'referred_by') THEN
    ALTER TABLE public.profiles ADD COLUMN referred_by UUID REFERENCES public.profiles(id);
  END IF;
END $$;

-- Function to generate unique referral codes
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists_check INTEGER;
BEGIN
  LOOP
    -- Generate 8-character alphanumeric code
    code := upper(substring(md5(random()::text) from 1 for 8));
    
    -- Check if it already exists
    SELECT COUNT(*) INTO exists_check FROM public.profiles WHERE referral_code = code;
    
    -- If unique, return it
    IF exists_check = 0 THEN
      RETURN code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to link a referral
CREATE OR REPLACE FUNCTION public.link_referral(p_referral_code TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  referrer_id UUID;
  current_user_id UUID;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Find the referrer by code
  SELECT id INTO referrer_id 
  FROM public.profiles 
  WHERE referral_code = UPPER(p_referral_code) AND id != current_user_id;
  
  IF referrer_id IS NOT NULL THEN
    -- Update the current user's referred_by field
    UPDATE public.profiles 
    SET referred_by = referrer_id 
    WHERE id = current_user_id AND referred_by IS NULL;
    
    -- Create referral record
    INSERT INTO public.referrals (referrer_id, referred_user_id)
    VALUES (referrer_id, current_user_id)
    ON CONFLICT (referred_user_id) DO NOTHING;
    
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-generate referral codes for new profiles
CREATE OR REPLACE FUNCTION public.auto_generate_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  -- Generate referral code if not provided
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := public.generate_referral_code();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for referral code generation
DROP TRIGGER IF EXISTS trg_auto_referral_code ON public.profiles;
CREATE TRIGGER trg_auto_referral_code
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_generate_referral_code();

-- Enable RLS on referral_config
ALTER TABLE public.referral_config ENABLE ROW LEVEL SECURITY;

-- Drop and recreate RLS policies for referral_config
DROP POLICY IF EXISTS "Anyone can read referral config" ON public.referral_config;
DROP POLICY IF EXISTS "Only admins can modify referral config" ON public.referral_config;

CREATE POLICY "Anyone can read referral config" ON public.referral_config
  FOR SELECT USING (true);

CREATE POLICY "Only admins can modify referral config" ON public.referral_config
  FOR ALL USING (is_admin());