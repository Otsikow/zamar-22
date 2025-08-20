-- Backfill profiles table with email data from auth.users for existing users
UPDATE public.profiles 
SET email = au.email,
    full_name = COALESCE(
        profiles.full_name,
        CASE 
            WHEN profiles.first_name IS NOT NULL AND profiles.last_name IS NOT NULL 
            THEN profiles.first_name || ' ' || profiles.last_name
            WHEN profiles.first_name IS NOT NULL THEN profiles.first_name
            WHEN profiles.last_name IS NOT NULL THEN profiles.last_name
            ELSE SPLIT_PART(au.email, '@', 1)
        END
    )
FROM auth.users au
WHERE profiles.id = au.id
  AND (profiles.email IS NULL OR profiles.email != au.email);