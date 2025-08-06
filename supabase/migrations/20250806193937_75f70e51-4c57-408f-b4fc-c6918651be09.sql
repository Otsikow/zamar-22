
-- Create a view for donation analytics to make querying easier
CREATE OR REPLACE VIEW donation_analytics AS
SELECT 
  d.*,
  p.first_name,
  p.last_name,
  p.email,
  EXTRACT(YEAR FROM d.created_at) as year,
  EXTRACT(MONTH FROM d.created_at) as month,
  DATE_TRUNC('month', d.created_at) as month_year
FROM donations d
LEFT JOIN profiles p ON d.user_id = p.id;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_donations_created_at ON donations(created_at);
CREATE INDEX IF NOT EXISTS idx_donations_campaign ON donations(campaign);
CREATE INDEX IF NOT EXISTS idx_donations_type ON donations(type);
CREATE INDEX IF NOT EXISTS idx_donations_status ON donations(status);

-- Create function to get donation statistics
CREATE OR REPLACE FUNCTION get_donation_stats()
RETURNS TABLE(
  total_donations NUMERIC,
  monthly_donors BIGINT,
  one_time_donations BIGINT,
  total_amount NUMERIC
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END), 0) as total_donations,
    COUNT(DISTINCT CASE WHEN type = 'monthly' AND status = 'completed' THEN user_id END) as monthly_donors,
    COUNT(CASE WHEN type = 'one-time' AND status = 'completed' THEN 1 END) as one_time_donations,
    COALESCE(SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END), 0) as total_amount
  FROM donations;
END;
$$;

-- Create function to get donations by campaign
CREATE OR REPLACE FUNCTION get_donations_by_campaign()
RETURNS TABLE(
  campaign_name TEXT,
  total_amount NUMERIC,
  donation_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(campaign, 'General Fund') as campaign_name,
    SUM(amount) as total_amount,
    COUNT(*) as donation_count
  FROM donations 
  WHERE status = 'completed'
  GROUP BY campaign
  ORDER BY total_amount DESC;
END;
$$;

-- Create function to get recent donations
CREATE OR REPLACE FUNCTION get_recent_donations(limit_count INTEGER DEFAULT 10)
RETURNS TABLE(
  id UUID,
  amount NUMERIC,
  donor_name TEXT,
  donor_email TEXT,
  campaign TEXT,
  type TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
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
  FROM donations d
  LEFT JOIN profiles p ON d.user_id = p.id
  WHERE d.status = 'completed'
  ORDER BY d.created_at DESC
  LIMIT limit_count;
END;
$$;

-- Update RLS policies for the new functions
CREATE POLICY "Admins can use donation functions" ON donations
FOR SELECT USING (is_admin());
