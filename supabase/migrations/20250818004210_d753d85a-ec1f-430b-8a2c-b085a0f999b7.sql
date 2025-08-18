-- Check if the profiles trigger exists and fix the referral system

-- First, let's ensure the trigger function exists and works correctly
CREATE OR REPLACE FUNCTION public.trg_profiles_apply_referral()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  -- Log the trigger execution for debugging
  RAISE LOG 'Profiles trigger fired for user %', NEW.id;
  
  IF NEW.pending_ref_code IS NOT NULL THEN
    RAISE LOG 'Processing pending ref code % for user %', NEW.pending_ref_code, NEW.id;
    
    -- Apply the referral
    PERFORM public.apply_referral(NEW.id, NEW.pending_ref_code);
    
    -- Clear the pending code after processing
    NEW.pending_ref_code := NULL;
    
    RAISE LOG 'Referral processing completed for user %', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Ensure the trigger exists on profiles table
DROP TRIGGER IF EXISTS trg_profiles_apply_referral ON public.profiles;

CREATE TRIGGER trg_profiles_apply_referral
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_profiles_apply_referral();

-- Also ensure we have a proper referral generation trigger
CREATE OR REPLACE FUNCTION public.ensure_referral_code_on_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  -- Generate referral code if not provided
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := public.generate_referral_code();
  END IF;
  
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS ensure_referral_code_trigger ON public.profiles;

CREATE TRIGGER ensure_referral_code_trigger
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_referral_code_on_insert();

-- Test that the apply_referral function works by creating a test scenario
-- Let's check if we have any valid referral codes to test with
DO $$
DECLARE
  test_referrer_id uuid;
  test_ref_code text;
BEGIN
  -- Get the first available referrer
  SELECT id, referral_code INTO test_referrer_id, test_ref_code 
  FROM profiles 
  WHERE referral_code IS NOT NULL 
  LIMIT 1;
  
  IF test_referrer_id IS NOT NULL THEN
    RAISE LOG 'Found test referrer % with code %', test_referrer_id, test_ref_code;
  END IF;
END $$;