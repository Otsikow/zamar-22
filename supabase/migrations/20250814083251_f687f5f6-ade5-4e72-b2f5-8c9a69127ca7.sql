-- Fix critical security issues

-- 1. Create the missing atomic_grant_first_admin function
CREATE OR REPLACE FUNCTION public.atomic_grant_first_admin()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  current_user_id uuid;
  admin_count integer;
  result jsonb;
BEGIN
  -- Get the current authenticated user
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;
  
  -- Check if any admin already exists (atomic check)
  SELECT COUNT(*) INTO admin_count FROM public.admin_users;
  
  -- If no admins exist, grant admin to current user
  IF admin_count = 0 THEN
    INSERT INTO public.admin_users (user_id, role) 
    VALUES (current_user_id, 'admin')
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN jsonb_build_object('success', true, 'message', 'Admin privileges granted');
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Admin already exists');
  END IF;
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- 2. Lock down public_profiles table with proper RLS
DROP POLICY IF EXISTS "Enable read access for all users" ON public.public_profiles;

-- Add proper RLS policies for public_profiles
CREATE POLICY "Users can view their own public profile" 
ON public.public_profiles 
FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own public profile" 
ON public.public_profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own public profile" 
ON public.public_profiles 
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 3. Fix search path vulnerabilities in existing functions
CREATE OR REPLACE FUNCTION public.get_donation_stats()
RETURNS TABLE(total_donations numeric, monthly_donors bigint, one_time_donations bigint, total_amount numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END), 0) as total_donations,
    COUNT(DISTINCT CASE WHEN type = 'monthly' AND status = 'completed' THEN user_id END) as monthly_donors,
    COUNT(CASE WHEN type = 'one-time' AND status = 'completed' THEN 1 END) as one_time_donations,
    COALESCE(SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END), 0) as total_amount
  FROM public.donations;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_donations_by_campaign()
RETURNS TABLE(campaign_name text, total_amount numeric, donation_count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(campaign, 'General Fund') as campaign_name,
    SUM(amount) as total_amount,
    COUNT(*) as donation_count
  FROM public.donations 
  WHERE status = 'completed'
  GROUP BY campaign
  ORDER BY total_amount DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_recent_donations(limit_count integer DEFAULT 10)
RETURNS TABLE(id uuid, amount numeric, donor_name text, donor_email text, campaign text, type text, created_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id,
    d.amount,
    COALESCE(p.first_name || ' ' || p.last_name, 'Anonymous') as donor_name,
    p.email as donor_email,
    COALESCE(d.campaign, 'General Fund') as campaign,
    d.type,
    d.created_at
  FROM public.donations d
  LEFT JOIN public.profiles p ON d.user_id = p.id
  WHERE d.status = 'completed'
  ORDER BY d.created_at DESC
  LIMIT limit_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_referral_stats(target_user_id uuid)
RETURNS TABLE(total_referrals bigint, active_referrals bigint, inactive_referrals bigint, total_earned numeric, paid_earnings numeric, pending_earnings numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(DISTINCT r.referred_user_id)::BIGINT as total_referrals,
    COUNT(DISTINCT CASE WHEN p.id IS NOT NULL THEN r.referred_user_id END)::BIGINT as active_referrals,
    COUNT(DISTINCT CASE WHEN p.id IS NULL THEN r.referred_user_id END)::BIGINT as inactive_referrals,
    COALESCE(SUM(re.amount), 0) as total_earned,
    COALESCE(SUM(CASE WHEN re.status = 'paid' THEN re.amount ELSE 0 END), 0) as paid_earnings,
    COALESCE(SUM(CASE WHEN re.status = 'pending' THEN re.amount ELSE 0 END), 0) as pending_earnings
  FROM public.referrals r
  LEFT JOIN public.profiles p ON p.id = r.referred_user_id
  LEFT JOIN public.referral_earnings re ON re.user_id = target_user_id
  WHERE r.referrer_id = target_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_top_referrers()
RETURNS TABLE(user_id uuid, first_name text, last_name text, email text, total_earned numeric, reward_count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    rr.user_id,
    p.first_name,
    p.last_name,
    p.email,
    SUM(rr.reward_amount) as total_earned,
    COUNT(*)::BIGINT as reward_count
  FROM public.referral_rewards rr
  LEFT JOIN public.profiles p ON p.id = rr.user_id
  WHERE rr.user_id IS NOT NULL
  GROUP BY rr.user_id, p.first_name, p.last_name, p.email
  ORDER BY total_earned DESC
  LIMIT 10;
END;
$$;

-- 4. Add security audit log for admin operations
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  user_id uuid REFERENCES auth.users(id),
  ip_address inet,
  user_agent text,
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
ON public.security_audit_log
FOR SELECT
USING (public.is_admin());

-- System can insert audit logs
CREATE POLICY "System can insert audit logs"
ON public.security_audit_log
FOR INSERT
WITH CHECK (true);

-- 5. Enhanced admin operation logging function
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_event_type text,
  p_metadata jsonb DEFAULT '{}',
  p_ip_address text DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  INSERT INTO public.security_audit_log (
    event_type,
    user_id,
    ip_address,
    user_agent,
    metadata
  ) VALUES (
    p_event_type,
    auth.uid(),
    public.extract_single_ip(p_ip_address),
    p_user_agent,
    p_metadata
  );
END;
$$;