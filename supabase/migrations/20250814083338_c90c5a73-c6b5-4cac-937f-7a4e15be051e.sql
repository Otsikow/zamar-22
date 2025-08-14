-- Fix critical security issues (corrected version)

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

-- 2. Fix search path vulnerabilities in existing functions
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

-- 3. Add security audit log for admin operations
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

-- 4. Enhanced admin operation logging function
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

-- 5. Fix additional vulnerable functions with proper search paths
CREATE OR REPLACE FUNCTION public.insert_referral_earnings_after_payment_v2(p_payment_id uuid, payer_id uuid, payment_amount numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  first_gen UUID;
  second_gen UUID;
BEGIN
  -- Only process if payment amount meets minimum threshold (£25)
  IF payment_amount < 25.00 THEN
    RETURN;
  END IF;

  -- Find 1st Generation referrer
  SELECT referrer_id INTO first_gen
  FROM public.referrals
  WHERE referred_user_id = payer_id AND generation = 1;

  -- Insert 1st generation earning (15%)
  IF first_gen IS NOT NULL THEN
    INSERT INTO public.referral_earnings (payment_id, user_id, referred_user_id, generation, amount, status)
    VALUES (p_payment_id, first_gen, payer_id, 1, ROUND(payment_amount * 0.15, 2), 'pending');
  END IF;

  -- Find 2nd Generation referrer (of the 1st Gen)
  SELECT referrer_id INTO second_gen
  FROM public.referrals
  WHERE referred_user_id = first_gen AND generation = 1;

  -- Insert 2nd generation earning (10%)
  IF second_gen IS NOT NULL THEN
    INSERT INTO public.referral_earnings (payment_id, user_id, referred_user_id, generation, amount, status)
    VALUES (p_payment_id, second_gen, payer_id, 2, ROUND(payment_amount * 0.10, 2), 'pending');
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.insert_referral_earnings_after_payment(payer_id uuid, payment_amount numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  first_gen UUID;
  second_gen UUID;
BEGIN
  -- Only process if payment amount meets minimum threshold (£25)
  IF payment_amount < 25.00 THEN
    RETURN;
  END IF;

  -- Find 1st Generation referrer
  SELECT referrer_id INTO first_gen
  FROM public.referrals
  WHERE referred_user_id = payer_id AND generation = 1;

  -- Insert 1st generation earning (15%)
  IF first_gen IS NOT NULL THEN
    INSERT INTO public.referral_earnings (user_id, referred_user_id, generation, amount, status)
    VALUES (first_gen, payer_id, 1, ROUND(payment_amount * 0.15, 2), 'pending');
  END IF;

  -- Find 2nd Generation referrer (of the 1st Gen)
  SELECT referrer_id INTO second_gen
  FROM public.referrals
  WHERE referred_user_id = first_gen AND generation = 1;

  -- Insert 2nd generation earning (10%)
  IF second_gen IS NOT NULL THEN
    INSERT INTO public.referral_earnings (user_id, referred_user_id, generation, amount, status)
    VALUES (second_gen, payer_id, 2, ROUND(payment_amount * 0.10, 2), 'pending');
  END IF;
END;
$$;