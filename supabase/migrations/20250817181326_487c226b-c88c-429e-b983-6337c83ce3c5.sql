-- Drop the existing function first
DROP FUNCTION IF EXISTS admin_list_orders(text, text);

-- Create a proper admin orders function with admin access control
CREATE OR REPLACE FUNCTION admin_list_orders(p_q text DEFAULT NULL, p_status text DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  user_email text,
  tier text,
  amount integer,
  status text,
  created_at timestamptz,
  updated_at timestamptz,
  user_id uuid
)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  -- Check if user is admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  RETURN QUERY
  SELECT
    o.id,
    p.email as user_email,
    o.tier,
    o.amount,
    o.status,
    o.created_at,
    o.updated_at,
    o.user_id
  FROM custom_song_orders o
  LEFT JOIN profiles p ON p.id = o.user_id
  WHERE (p_status IS NULL OR o.status = p_status)
    AND (p_q IS NULL
         OR o.id::text ILIKE '%'||p_q||'%'
         OR COALESCE(p.email,'') ILIKE '%'||p_q||'%')
  ORDER BY o.created_at DESC
  LIMIT 500;
END;
$$;