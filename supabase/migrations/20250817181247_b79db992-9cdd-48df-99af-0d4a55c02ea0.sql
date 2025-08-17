-- Drop the function first to avoid dependency issues
DROP FUNCTION IF EXISTS admin_list_orders(text, text);

-- Drop and recreate the view without SECURITY DEFINER
DROP VIEW IF EXISTS admin_orders CASCADE;

-- Create admin orders view without SECURITY DEFINER
CREATE OR REPLACE VIEW admin_orders AS
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
LEFT JOIN profiles p ON p.id = o.user_id;

-- Enable RLS on the view
ALTER VIEW admin_orders ENABLE ROW LEVEL SECURITY;

-- Create policy to allow only admins to view the admin orders
CREATE POLICY "Admins can view admin orders"
ON admin_orders
FOR SELECT
USING (is_admin());

-- Recreate the RPC function
CREATE OR REPLACE FUNCTION admin_list_orders(p_q text DEFAULT NULL, p_status text DEFAULT NULL)
RETURNS SETOF admin_orders
LANGUAGE sql STABLE
SET search_path TO 'public', 'pg_temp'
AS $$
  SELECT * FROM admin_orders
  WHERE (p_status IS NULL OR status = p_status)
    AND (p_q IS NULL
         OR id::text ILIKE '%'||p_q||'%'
         OR COALESCE(user_email,'') ILIKE '%'||p_q||'%')
  ORDER BY created_at DESC
  LIMIT 500;
$$;