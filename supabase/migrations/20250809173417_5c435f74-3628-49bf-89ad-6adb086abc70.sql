-- Create account status enum
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'account_status') THEN
    CREATE TYPE public.account_status AS ENUM ('active', 'suspended', 'deleted');
  END IF;
END $$;

-- Add status columns to profiles if they don't exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'account_status'
  ) THEN
    ALTER TABLE public.profiles 
      ADD COLUMN account_status public.account_status NOT NULL DEFAULT 'active';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'suspended_at'
  ) THEN
    ALTER TABLE public.profiles 
      ADD COLUMN suspended_at TIMESTAMPTZ;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE public.profiles 
      ADD COLUMN deleted_at TIMESTAMPTZ;
  END IF;
END $$;

-- Admin actions as security definer functions (bypass RLS safely)
CREATE OR REPLACE FUNCTION public.admin_suspend_user(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- require admin
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  UPDATE public.profiles
  SET account_status = 'suspended', suspended_at = now()
  WHERE id = target_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_unsuspend_user(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  UPDATE public.profiles
  SET account_status = 'active', suspended_at = NULL
  WHERE id = target_user_id AND account_status = 'suspended';
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_soft_delete_user(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  UPDATE public.profiles
  SET account_status = 'deleted', deleted_at = now()
  WHERE id = target_user_id;
END;
$$;

-- Optional: allow admins to manually update status via UPDATE too (not required because of functions)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Admins can update account status'
  ) THEN
    CREATE POLICY "Admins can update account status"
    ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());
  END IF;
END $$;
