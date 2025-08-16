-- Replace fragile auth.users trigger with bulletproof profiles trigger approach

-- 1) Add holding column for referral handoff
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS pending_ref_code TEXT;

-- 2) Keep the helper function but update it to use the new schema
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
    RETURN; 
  END IF;

  -- Set convenience pointer
  UPDATE public.profiles SET referred_by = referrer
   WHERE id = new_user AND referred_by IS NULL;

  -- Create the referrals row
  INSERT INTO public.referrals (referrer_id, referred_user_id, level, amount_pence, status)
  VALUES (referrer, new_user, 1, 0, 'pending')
  ON CONFLICT (referred_user_id) DO NOTHING;
END;
$$;

-- 3) Create profiles trigger function (this WILL fire because we control profiles)
CREATE OR REPLACE FUNCTION public.trg_profiles_apply_referral()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.pending_ref_code IS NOT NULL THEN
    PERFORM public.apply_referral(NEW.id, NEW.pending_ref_code);
    NEW.pending_ref_code := NULL; -- consume it
  END IF;
  RETURN NEW;
END;
$$;

-- 4) Create the trigger on profiles (not auth.users)
DROP TRIGGER IF EXISTS profiles_apply_referral ON public.profiles;
CREATE TRIGGER profiles_apply_referral
BEFORE INSERT OR UPDATE OF pending_ref_code ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.trg_profiles_apply_referral();

-- 5) Remove the old auth.users trigger (if it exists)
DROP TRIGGER IF EXISTS trg_on_auth_user_created ON auth.users;

-- 6) Update the handle_new_user function to be simpler (no referral logic)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, email)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data ->> 'first_name', 
    NEW.raw_user_meta_data ->> 'last_name',
    NEW.email
  )
  ON CONFLICT (id) DO UPDATE SET
    first_name = COALESCE(EXCLUDED.first_name, profiles.first_name),
    last_name = COALESCE(EXCLUDED.last_name, profiles.last_name),
    email = COALESCE(EXCLUDED.email, profiles.email);
  
  -- Ensure ref code exists
  PERFORM public.ensure_ref_code_for(NEW.id);
  
  RETURN NEW;
END;
$$;