-- Drop the problematic view that exposes auth.users
DROP VIEW IF EXISTS admin_user_details;

-- Create a secure function instead that only admins can access
CREATE OR REPLACE FUNCTION public.get_admin_user_details()
RETURNS TABLE (
    id uuid,
    email text,
    created_at timestamptz,
    last_sign_in_at timestamptz,
    full_name text,
    avatar_url text,
    role text,
    is_suspended boolean,
    soft_deleted_at timestamptz,
    account_status account_status,
    first_name text,
    last_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth', 'pg_temp'
AS $$
BEGIN
    -- Check if the caller is admin
    IF NOT is_admin() THEN
        RAISE EXCEPTION 'Access denied. Admin privileges required.';
    END IF;
    
    RETURN QUERY
    SELECT 
        u.id,
        u.email,
        u.created_at,
        u.last_sign_in_at,
        p.full_name,
        p.avatar_url,
        COALESCE(au.role, p.role, 'listener') as role,
        COALESCE(p.is_suspended, false) as is_suspended,
        p.soft_deleted_at,
        p.account_status,
        p.first_name,
        p.last_name
    FROM auth.users u
    LEFT JOIN public.profiles p ON p.id = u.id
    LEFT JOIN public.admin_users au ON au.user_id = u.id
    WHERE u.email IS NOT NULL
        AND (p.soft_deleted_at IS NULL OR p.soft_deleted_at IS NULL)
    ORDER BY u.created_at DESC;
END;
$$;