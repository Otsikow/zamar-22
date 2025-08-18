-- Ensure all users have referral codes
-- First, generate referral codes for users who don't have them
UPDATE public.profiles 
SET referral_code = public.generate_referral_code()
WHERE referral_code IS NULL OR referral_code = '';

-- Create a trigger to auto-generate referral codes for new users
CREATE OR REPLACE FUNCTION public.auto_generate_referral_code()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  -- Generate referral code if not provided
  IF NEW.referral_code IS NULL OR NEW.referral_code = '' THEN
    NEW.referral_code := public.generate_referral_code();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trg_auto_generate_referral_code ON public.profiles;

-- Create new trigger
CREATE TRIGGER trg_auto_generate_referral_code
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_referral_code();