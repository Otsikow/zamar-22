-- Create donations table for tracking donations
CREATE TABLE IF NOT EXISTS public.donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  amount_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'GBP',
  campaign TEXT NULL,
  type TEXT DEFAULT 'one_time',
  stripe_payment_intent TEXT NULL,
  stripe_checkout_session TEXT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own donations" ON public.donations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own donations" ON public.donations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all donations" ON public.donations
  FOR ALL USING (is_admin());

CREATE POLICY "System can insert donations" ON public.donations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update donations" ON public.donations
  FOR UPDATE USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_donations_updated_at
  BEFORE UPDATE ON public.donations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();