-- Fix the remaining function search path security vulnerability
-- The extract_single_ip function needs a search path setting

ALTER FUNCTION public.extract_single_ip(ip_input text)
SET search_path = '';

-- Add comment explaining the security fix
COMMENT ON FUNCTION public.extract_single_ip IS 'Extracts single IP from input string. Uses empty search path to prevent function injection attacks';