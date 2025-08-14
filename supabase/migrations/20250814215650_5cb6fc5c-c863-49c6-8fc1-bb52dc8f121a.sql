-- Fix security warnings by setting proper search paths

-- 1. Update touches_updated_at function
CREATE OR REPLACE FUNCTION public.touches_updated_at()
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN 
  NEW.updated_at = now(); 
  RETURN NEW; 
END $$;

-- 2. Update approve_testimony function
CREATE OR REPLACE FUNCTION public.approve_testimony(p_testimony_id uuid, p_admin uuid)
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  UPDATE public.testimonies
  SET status = 'approved',
      approved_by = p_admin,
      approved_at = now(),
      published_at = COALESCE(published_at, now())
  WHERE id = p_testimony_id;
END $$;

-- 3. Update reject_testimony function
CREATE OR REPLACE FUNCTION public.reject_testimony(p_testimony_id uuid, p_admin uuid, p_reason text)
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  UPDATE public.testimonies
  SET status = 'rejected',
      admin_notes = p_reason,
      approved_by = p_admin,
      approved_at = now(),
      published_at = NULL
  WHERE id = p_testimony_id;
END $$;