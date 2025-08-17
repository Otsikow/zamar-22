-- Fix security warning by setting proper search_path for the function
CREATE OR REPLACE FUNCTION public.update_custom_song_orders_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;