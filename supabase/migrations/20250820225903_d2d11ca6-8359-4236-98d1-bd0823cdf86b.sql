-- Fix the admin_users_source function to properly fetch email from auth.users
CREATE OR REPLACE FUNCTION public.admin_users_source()
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
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
    SELECT
        u.id,
        u.email,                    -- Get email from auth.users
        u.created_at,
        u.last_sign_in_at,
        COALESCE(
            p.full_name, 
            CASE 
                WHEN p.first_name IS NOT NULL AND p.last_name IS NOT NULL 
                THEN p.first_name || ' ' || p.last_name
                WHEN p.first_name IS NOT NULL THEN p.first_name
                WHEN p.last_name IS NOT NULL THEN p.last_name
                ELSE SPLIT_PART(u.email, '@', 1)
            END
        ) as full_name,
        p.avatar_url,
        COALESCE(
            (SELECT au.role FROM public.admin_users au WHERE au.user_id = u.id), 
            p.role, 
            'listener'
        ) as role,
        COALESCE(p.is_suspended, false) as is_suspended,
        p.soft_deleted_at,
        p.account_status,
        p.first_name,
        p.last_name
    FROM auth.users u
    LEFT JOIN public.profiles p ON p.id = u.id
    WHERE (p.soft_deleted_at IS NULL OR p.soft_deleted_at IS NULL)
    AND u.email IS NOT NULL;  -- Only include users with emails
$$;