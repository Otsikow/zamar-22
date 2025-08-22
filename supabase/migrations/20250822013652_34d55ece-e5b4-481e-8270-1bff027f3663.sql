-- Grant permissions to all is_admin function overloads for anonymous users
DO $$
DECLARE
    func_record RECORD;
BEGIN
    -- Grant execute on all is_admin functions to anon and authenticated roles
    FOR func_record IN 
        SELECT proname, pg_get_function_identity_arguments(oid) as args
        FROM pg_proc 
        WHERE proname = 'is_admin' 
        AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    LOOP
        EXECUTE format('GRANT EXECUTE ON FUNCTION public.%I(%s) TO anon, authenticated', 
                       func_record.proname, func_record.args);
    END LOOP;
END $$;

-- Fix public_testimonies access by granting select on the underlying view
GRANT SELECT ON public.public_testimonies TO anon, authenticated;

-- Test that get_active_session_count works for anonymous users
GRANT EXECUTE ON FUNCTION public.get_active_session_count(integer) TO anon, authenticated;