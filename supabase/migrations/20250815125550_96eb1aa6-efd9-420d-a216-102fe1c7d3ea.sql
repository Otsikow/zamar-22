-- Fix security issues from linter

-- Fix search_path for functions
CREATE OR REPLACE FUNCTION public.ensure_ref_code_for(user_id UUID)
RETURNS VOID 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.profiles
    SET referral_code = COALESCE(referral_code, substr(encode(sha256(user_id::text::bytea), 'hex'), 1, 8))
  WHERE id = user_id;
END; $$;

-- Fix search_path for apply_referral function
CREATE OR REPLACE FUNCTION public.apply_referral(new_user UUID, raw_ref TEXT)
RETURNS VOID 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public, pg_temp
AS $$
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

-- Fix search_path for trigger function
CREATE OR REPLACE FUNCTION public.on_auth_user_created()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public, pg_temp
AS $$
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

-- Fix search_path for approve_referral_for function
CREATE OR REPLACE FUNCTION public.approve_referral_for(referred UUID, order_total_pence INT)
RETURNS VOID 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.referrals
    SET amount_pence = (order_total_pence * 15) / 100,
        status = 'approved'
  WHERE referred_user_id = referred
    AND status = 'pending';
END; $$;