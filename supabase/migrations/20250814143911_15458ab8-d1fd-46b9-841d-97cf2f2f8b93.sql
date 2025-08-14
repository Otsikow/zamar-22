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

-- Create referrals table to track referral relationships
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(referred_user_id) -- Each user can only be referred once
);

-- Create purchases table to track all purchases
CREATE TABLE IF NOT EXISTS public.purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'GBP',
  status TEXT NOT NULL DEFAULT 'pending',
  metadata JSONB DEFAULT '{}',
  stripe_session_id TEXT,
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create commissions table to track referral earnings
CREATE TABLE IF NOT EXISTS public.commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  purchase_id UUID NOT NULL REFERENCES public.purchases(id) ON DELETE CASCADE,
  level INTEGER NOT NULL CHECK (level IN (1, 2)),
  amount_cents INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

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

-- Function to create commissions for a purchase
CREATE OR REPLACE FUNCTION public.create_commissions_for_purchase()
RETURNS TRIGGER AS $$
DECLARE
  config RECORD;
  level1_referrer UUID;
  level2_referrer UUID;
BEGIN
  -- Only process successful purchases above minimum amount
  IF NEW.status = 'succeeded' AND NEW.amount_cents >= (SELECT min_purchase_cents FROM public.referral_config WHERE id = 1) THEN
    
    -- Get current config
    SELECT * INTO config FROM public.referral_config WHERE id = 1;
    
    -- Find Level 1 referrer (direct referrer)
    SELECT referred_by INTO level1_referrer 
    FROM public.profiles 
    WHERE id = NEW.user_id AND referred_by IS NOT NULL;
    
    IF level1_referrer IS NOT NULL THEN
      -- Create Level 1 commission
      INSERT INTO public.commissions (referrer_id, referred_user_id, purchase_id, level, amount_cents)
      VALUES (
        level1_referrer,
        NEW.user_id,
        NEW.id,
        1,
        ROUND(NEW.amount_cents * config.level1_rate / 100.0)
      );
      
      -- Find Level 2 referrer (referrer of the referrer)
      SELECT referred_by INTO level2_referrer 
      FROM public.profiles 
      WHERE id = level1_referrer AND referred_by IS NOT NULL;
      
      IF level2_referrer IS NOT NULL THEN
        -- Create Level 2 commission
        INSERT INTO public.commissions (referrer_id, referred_user_id, purchase_id, level, amount_cents)
        VALUES (
          level2_referrer,
          NEW.user_id,
          NEW.id,
          2,
          ROUND(NEW.amount_cents * config.level2_rate / 100.0)
        );
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

-- Create trigger for commission creation
DROP TRIGGER IF EXISTS trg_commissions_on_purchase ON public.purchases;
CREATE TRIGGER trg_commissions_on_purchase
  AFTER INSERT OR UPDATE ON public.purchases
  FOR EACH ROW
  EXECUTE FUNCTION public.create_commissions_for_purchase();

-- Enable RLS on new tables
ALTER TABLE public.referral_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for referral_config (admin read, public read config)
CREATE POLICY "Anyone can read referral config" ON public.referral_config
  FOR SELECT USING (true);

CREATE POLICY "Only admins can modify referral config" ON public.referral_config
  FOR ALL USING (is_admin());

-- RLS Policies for referrals
CREATE POLICY "Users can view their referrals" ON public.referrals
  FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_user_id);

CREATE POLICY "System can insert referrals" ON public.referrals
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all referrals" ON public.referrals
  FOR ALL USING (is_admin());

-- RLS Policies for purchases
CREATE POLICY "Users can view their purchases" ON public.purchases
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert purchases" ON public.purchases
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can insert their purchases" ON public.purchases
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can update purchases" ON public.purchases
  FOR UPDATE USING (true);

CREATE POLICY "Admins can view all purchases" ON public.purchases
  FOR ALL USING (is_admin());

-- RLS Policies for commissions
CREATE POLICY "Users can view their commissions" ON public.commissions
  FOR SELECT USING (auth.uid() = referrer_id);

CREATE POLICY "System can insert commissions" ON public.commissions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can manage commissions" ON public.commissions
  FOR ALL USING (is_admin());

-- Create updated_at trigger for tables
CREATE TRIGGER update_purchases_updated_at
  BEFORE UPDATE ON public.purchases
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_commissions_updated_at
  BEFORE UPDATE ON public.commissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();