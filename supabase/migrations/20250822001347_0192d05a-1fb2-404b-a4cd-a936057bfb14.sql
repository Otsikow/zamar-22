-- Drop and recreate the admin_user_details view to properly show admin roles
DROP VIEW IF EXISTS admin_user_details;

CREATE VIEW admin_user_details AS
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
    AND (p.soft_deleted_at IS NULL OR p.soft_deleted_at IS NULL);