-- Step 1: Ensure profiles table has the necessary columns
-- Add missing columns to existing profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS full_name text,
ADD COLUMN IF NOT EXISTS avatar_url text,
ADD COLUMN IF NOT EXISTS role text DEFAULT 'listener',
ADD COLUMN IF NOT EXISTS is_suspended boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS soft_deleted_at timestamptz;

-- Add constraint for role if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_role_check') THEN
        ALTER TABLE public.profiles 
        ADD CONSTRAINT profiles_role_check CHECK (role IN ('listener','supporter','admin'));
    END IF;
END $$;

-- Step 2: Create trigger for updated_at if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Step 3: Update RLS policies for admin access
DROP POLICY IF EXISTS "profiles: admin read all" ON public.profiles;
CREATE POLICY "profiles: admin read all"
ON public.profiles FOR SELECT
TO authenticated
USING (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
) OR EXISTS (
    SELECT 1 FROM public.admin_users a
    WHERE a.user_id = auth.uid() AND a.role = 'admin'
));

DROP POLICY IF EXISTS "profiles: admin update" ON public.profiles;
CREATE POLICY "profiles: admin update"
ON public.profiles FOR UPDATE
TO authenticated
USING (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
) OR EXISTS (
    SELECT 1 FROM public.admin_users a
    WHERE a.user_id = auth.uid() AND a.role = 'admin'
))
WITH CHECK (true);

-- Step 4: Create/update the signup trigger to populate profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 5: Create admin view with email access
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
SET search_path = public, auth
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

DROP VIEW IF EXISTS public.admin_user_details_guarded;
DROP VIEW IF EXISTS public.admin_user_details;

CREATE VIEW public.admin_user_details AS
SELECT * FROM public.admin_users_source();

CREATE VIEW public.admin_user_details_guarded AS
SELECT *
FROM public.admin_user_details
WHERE EXISTS (
    SELECT 1 FROM public.profiles me
    WHERE me.id = auth.uid() AND me.role = 'admin'
) OR EXISTS (
    SELECT 1 FROM public.admin_users a
    WHERE a.user_id = auth.uid() AND a.role = 'admin'
);

-- Grant permissions
GRANT SELECT ON public.admin_user_details TO authenticated;
GRANT SELECT ON public.admin_user_details_guarded TO authenticated;

-- Step 6: Backfill existing users
INSERT INTO public.profiles (id, full_name, email, role)
SELECT 
    u.id,
    COALESCE(
        u.raw_user_meta_data->>'full_name',
        u.raw_user_meta_data->>'name',
        SPLIT_PART(u.email, '@', 1)
    ) as full_name,
    u.email,
    'listener'
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL
ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    email = COALESCE(EXCLUDED.email, profiles.email);