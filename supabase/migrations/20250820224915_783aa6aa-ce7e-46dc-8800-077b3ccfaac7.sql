-- Fix security issues from linter

-- 1. Fix the admin_users_source function with proper search_path
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
        u.email,
        u.created_at,
        u.last_sign_in_at,
        COALESCE(p.full_name, p.first_name || ' ' || p.last_name, SPLIT_PART(u.email, '@', 1)) as full_name,
        p.avatar_url,
        COALESCE(p.role, 'listener') as role,
        COALESCE(p.is_suspended, false) as is_suspended,
        p.soft_deleted_at,
        p.account_status,
        p.first_name,
        p.last_name
    FROM auth.users u
    LEFT JOIN public.profiles p ON p.id = u.id
    WHERE p.soft_deleted_at IS NULL OR p.soft_deleted_at IS NULL;
$$;

-- 2. Fix handle_new_user function with proper search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public, pg_temp
AS $$
BEGIN
    INSERT INTO public.profiles(id, full_name, avatar_url, email)
    VALUES (
        NEW.id,
        COALESCE(
            NEW.raw_user_meta_data->>'full_name',
            NEW.raw_user_meta_data->>'name',
            SPLIT_PART(NEW.email, '@', 1)
        ),
        NEW.raw_user_meta_data->>'avatar_url',
        NEW.email
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
        avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
        email = COALESCE(EXCLUDED.email, profiles.email);
    
    RETURN NEW;
END;
$$;

-- 3. Fix update_updated_at_column function with proper search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- 4. Replace the security definer views with a safer approach using RLS
DROP VIEW IF EXISTS public.admin_user_details_guarded;
DROP VIEW IF EXISTS public.admin_user_details;

-- Create a regular view without SECURITY DEFINER and rely on RLS
CREATE VIEW public.admin_user_details AS
SELECT 
    p.id,
    p.email,
    p.created_at,
    p.updated_at as last_sign_in_at,
    COALESCE(p.full_name, p.first_name || ' ' || p.last_name, SPLIT_PART(p.email, '@', 1)) as full_name,
    p.avatar_url,
    COALESCE(p.role, 'listener') as role,
    COALESCE(p.is_suspended, false) as is_suspended,
    p.soft_deleted_at,
    p.account_status,
    p.first_name,
    p.last_name
FROM public.profiles p
WHERE p.soft_deleted_at IS NULL OR p.soft_deleted_at IS NULL;

-- Enable RLS on the view through the underlying table policies
ALTER VIEW public.admin_user_details OWNER TO postgres;

-- Grant permissions
GRANT SELECT ON public.admin_user_details TO authenticated;