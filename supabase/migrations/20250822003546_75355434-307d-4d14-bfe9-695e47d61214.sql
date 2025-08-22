-- Fix search path issue for existing functions
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    CASE 
      WHEN EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = $1 AND role = 'admin') THEN 'admin'
      ELSE 'user'
    END;
$$;