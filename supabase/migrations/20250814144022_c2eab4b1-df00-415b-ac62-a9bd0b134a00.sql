-- Fix security warnings by setting search_path for functions
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public', 'pg_temp';

-- Fix link_referral function
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public', 'pg_temp';

-- Fix auto_generate_referral_code function
CREATE OR REPLACE FUNCTION public.auto_generate_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  -- Generate referral code if not provided
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := public.generate_referral_code();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public', 'pg_temp';