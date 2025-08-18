-- Fix invalid referral clicks by updating them to the correct referrer
-- The code 661C44B7 should map to Eric Arthur (c27d4fcf-81d4-48c9-9120-21c7e831339d) who has code 3791B82D
UPDATE referral_clicks 
SET 
  ref_code = '3791B82D',
  referrer_id = 'c27d4fcf-81d4-48c9-9120-21c7e831339d'
WHERE ref_code = '661C44B7' AND referrer_id IS NULL;

-- Also add logging trigger to prevent future issues
CREATE OR REPLACE FUNCTION public.log_referral_click_debug()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  -- Log all referral clicks for debugging
  RAISE LOG 'Referral click: code=%, referrer_id=%, ip=%', NEW.ref_code, NEW.referrer_id, NEW.ip;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_referral_click_debug ON referral_clicks;
CREATE TRIGGER trg_log_referral_click_debug
  BEFORE INSERT ON referral_clicks
  FOR EACH ROW
  EXECUTE FUNCTION log_referral_click_debug();