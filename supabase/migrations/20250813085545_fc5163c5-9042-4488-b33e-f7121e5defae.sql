-- Address the remaining security definer view issue
-- The linter seems to be flagging something specific

-- Let's check if there are any views that might be related to security definer
SELECT viewname, definition 
FROM pg_views 
WHERE schemaname = 'public'
  AND (definition ILIKE '%security%' OR definition ILIKE '%definer%');

-- Check if there are any materialized views
SELECT schemaname, matviewname 
FROM pg_matviews 
WHERE schemaname = 'public';

-- Let's also check what specific functions might be causing the issue
-- Since many functions legitimately need SECURITY DEFINER, let's see if we can identify problematic ones
SELECT proname, prokind, prosecdef 
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND prosecdef = true
  AND prokind != 't'  -- Exclude triggers
ORDER BY proname;