-- Create donations table to track confirmed donations
CREATE TABLE IF NOT EXISTS public.donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_payment_intent TEXT,
  stripe_checkout_session TEXT,
  amount_pennies INTEGER NOT NULL,
  currency TEXT DEFAULT 'gbp',
  campaign_id TEXT DEFAULT 'general',
  donor_name TEXT,
  donor_email TEXT,
  status TEXT CHECK (status IN ('succeeded','refunded','failed')) DEFAULT 'succeeded',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

-- Create policy for admins to manage all donations
CREATE POLICY "admins_manage_donations" ON public.donations
FOR ALL
USING (is_admin());

-- Create policy for webhooks to insert donations
CREATE POLICY "webhook_insert_donations" ON public.donations
FOR INSERT
WITH CHECK (true);