-- Fix search path security issues for the functions I created
CREATE OR REPLACE FUNCTION gen_ref_code()
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = 'public', 'pg_temp'
AS $$
BEGIN
  IF NEW.ref_code IS NULL OR LENGTH(NEW.ref_code) = 0 THEN
    NEW.ref_code := LOWER(ENCODE(gen_random_bytes(6), 'hex')); -- 12-char safe id
  END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION rotate_ref_code(uid uuid)
RETURNS text 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = 'public', 'pg_temp'
AS $$
DECLARE 
  new_code text;
BEGIN
  new_code := LOWER(ENCODE(gen_random_bytes(6), 'hex'));
  UPDATE profiles 
  SET ref_code = new_code, ref_code_rotated_at = now()
  WHERE id = uid;
  RETURN new_code;
END $$;