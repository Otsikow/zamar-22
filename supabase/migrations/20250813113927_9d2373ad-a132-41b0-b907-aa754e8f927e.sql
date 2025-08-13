-- Fix Active Sessions RLS Policies (Critical Security Fix)
-- Remove broken policies that are causing session creation failures
DROP POLICY IF EXISTS "Allow session creation" ON public.active_sessions;
DROP POLICY IF EXISTS "Allow session updates" ON public.active_sessions;
DROP POLICY IF EXISTS "Allow session cleanup" ON public.active_sessions;
DROP POLICY IF EXISTS "Restrict session data access" ON public.active_sessions;

-- Create proper RLS policies for active sessions
CREATE POLICY "Enable session insertion for all users" 
ON public.active_sessions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Enable session updates for all users" 
ON public.active_sessions 
FOR UPDATE 
USING (true);

CREATE POLICY "Enable session deletion for cleanup" 
ON public.active_sessions 
FOR DELETE 
USING (true);

CREATE POLICY "Restrict session data viewing to admins only" 
ON public.active_sessions 
FOR SELECT 
USING (is_admin());

-- Fix Admin Creation Race Condition (Critical Security Fix)
-- Add unique constraint to prevent multiple admins from being created simultaneously
ALTER TABLE public.admin_users 
ADD CONSTRAINT unique_first_admin 
EXCLUDE (role WITH =) 
WHERE (role = 'admin') 
DEFERRABLE INITIALLY DEFERRED;

-- Create audit log for admin creation attempts
CREATE TABLE IF NOT EXISTS public.admin_creation_attempts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    attempted_by uuid REFERENCES auth.users(id),
    success boolean NOT NULL,
    attempted_at timestamp with time zone DEFAULT now(),
    ip_address inet,
    user_agent text
);

-- Enable RLS on audit log
ALTER TABLE public.admin_creation_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view admin creation attempts" 
ON public.admin_creation_attempts 
FOR SELECT 
USING (is_admin());

CREATE POLICY "System can insert admin creation attempts" 
ON public.admin_creation_attempts 
FOR INSERT 
WITH CHECK (true);

-- Fix IP Address Data Handling (High Priority Security Fix)  
-- Create function to safely extract single IP from potential IP list
CREATE OR REPLACE FUNCTION public.extract_single_ip(ip_input text)
RETURNS inet
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
    -- Handle comma-separated IPs (take first one)
    IF ip_input LIKE '%,%' THEN
        ip_input := split_part(ip_input, ',', 1);
    END IF;
    
    -- Clean whitespace
    ip_input := trim(ip_input);
    
    -- Validate and return as inet
    BEGIN
        RETURN ip_input::inet;
    EXCEPTION WHEN OTHERS THEN
        -- Return null for invalid IPs instead of causing errors
        RETURN NULL;
    END;
END;
$$;

-- Update existing ad_logs to fix corrupted IP data
UPDATE public.ad_logs 
SET ip = public.extract_single_ip(ip::text) 
WHERE ip IS NOT NULL;

-- Create better constraints for ad logging
ALTER TABLE public.ad_logs 
ADD CONSTRAINT valid_ad_type 
CHECK (type IN ('impression', 'click', 'view'));

ALTER TABLE public.ad_logs 
ADD CONSTRAINT valid_placement 
CHECK (placement IN ('hero', 'sidebar', 'footer', 'between_songs', 'banner') OR placement IS NULL);

-- Add index for better ad analytics performance
CREATE INDEX IF NOT EXISTS idx_ad_logs_performance 
ON public.ad_logs (ad_id, type, created_at);

-- Enhance Security: Create function to log sensitive operations
CREATE OR REPLACE FUNCTION public.log_admin_operation(
    operation_type text,
    target_table text,
    target_id uuid DEFAULT NULL,
    additional_info jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Only log if user is admin
    IF is_admin() THEN
        INSERT INTO public.notifications (
            type,
            message,
            user_id,
            metadata
        ) VALUES (
            'admin_operation',
            format('Admin performed %s on %s', operation_type, target_table),
            auth.uid(),
            jsonb_build_object(
                'operation', operation_type,
                'table', target_table,
                'target_id', target_id,
                'timestamp', now(),
                'additional_info', additional_info
            )
        );
    END IF;
END;
$$;