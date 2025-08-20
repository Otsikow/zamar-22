-- Add ref_code column to profiles table as single source of truth
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ref_code text UNIQUE;

-- Create function to generate 12-character safe referral codes
CREATE OR REPLACE FUNCTION gen_ref_code()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.ref_code IS NULL OR LENGTH(NEW.ref_code) = 0 THEN
    NEW.ref_code := LOWER(ENCODE(gen_random_bytes(6), 'hex')); -- 12-char safe id
  END IF;
  RETURN NEW;
END $$;

-- Drop existing trigger if exists and create new one
DROP TRIGGER IF EXISTS trg_profiles_ref_code ON profiles;
CREATE TRIGGER trg_profiles_ref_code
  BEFORE INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION gen_ref_code();

-- Backfill existing users with ref_codes
UPDATE profiles 
SET ref_code = LOWER(ENCODE(gen_random_bytes(6), 'hex'))
WHERE ref_code IS NULL OR LENGTH(ref_code) = 0;

-- Create function to rotate ref_code with audit trail
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ref_code_rotated_at timestamptz;

CREATE OR REPLACE FUNCTION rotate_ref_code(uid uuid)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE 
  new_code text;
BEGIN
  new_code := LOWER(ENCODE(gen_random_bytes(6), 'hex'));
  UPDATE profiles 
  SET ref_code = new_code, ref_code_rotated_at = now()
  WHERE id = uid;
  RETURN new_code;
END $$;