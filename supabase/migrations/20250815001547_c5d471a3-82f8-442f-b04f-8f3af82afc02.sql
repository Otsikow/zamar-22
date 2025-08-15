-- Test notification by creating a sample for debugging (you can delete this later)
-- First, let's see if there are any security definer views
SELECT viewname, definition 
FROM pg_views 
WHERE schemaname = 'public' 
AND definition ILIKE '%security%definer%';

-- Let's also check what the public_testimonies view looks like
\d+ public_testimonies