-- Create referrals table to track who referred whom
CREATE TABLE public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referred_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  generation SMALLINT NOT NULL CHECK (generation IN (1, 2)),
  referred_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create referral_earnings table to track exact amounts earned
CREATE TABLE public.referral_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- the referrer
  referred_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- who triggered the payment
  generation SMALLINT NOT NULL CHECK (generation IN (1, 2)),
  amount NUMERIC(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create payouts table for tracking manual/automatic payouts
CREATE TABLE public.payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  paid_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  method TEXT, -- e.g., 'Stripe', 'Bank Transfer', 'PayPal'
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create helper function to process referral earnings
CREATE OR REPLACE FUNCTION public.process_referral_earnings(new_user UUID, payment_amount NUMERIC)
RETURNS VOID AS $$
DECLARE
  first_gen UUID;
  second_gen UUID;
BEGIN
  -- Find 1st Generation referrer
  SELECT referrer_id INTO first_gen FROM public.referrals 
  WHERE referred_user_id = new_user AND generation = 1;

  -- Process 1st generation earning (15%)
  IF first_gen IS NOT NULL THEN
    INSERT INTO public.referral_earnings (user_id, referred_user_id, generation, amount)
    VALUES (first_gen, new_user, 1, ROUND(payment_amount * 0.15, 2));
  END IF;

  -- Find 2nd Generation referrer
  SELECT referrer_id INTO second_gen FROM public.referrals 
  WHERE referred_user_id = first_gen AND generation = 1;

  -- Process 2nd generation earning (10%)
  IF second_gen IS NOT NULL THEN
    INSERT INTO public.referral_earnings (user_id, referred_user_id, generation, amount)
    VALUES (second_gen, new_user, 2, ROUND(payment_amount * 0.10, 2));
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable Row Level Security
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for referrals table
CREATE POLICY "Users can view their own referrals" ON public.referrals
  FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_user_id);

CREATE POLICY "System can insert referrals" ON public.referrals
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all referrals" ON public.referrals
  FOR ALL USING (is_admin());

-- RLS Policies for referral_earnings table
CREATE POLICY "Users can view their own earnings" ON public.referral_earnings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert earnings" ON public.referral_earnings
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can manage all earnings" ON public.referral_earnings
  FOR ALL USING (is_admin());

-- RLS Policies for payouts table
CREATE POLICY "Users can view their own payouts" ON public.payouts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all payouts" ON public.payouts
  FOR ALL USING (is_admin());

-- Create indexes for better performance
CREATE INDEX idx_referrals_referred_user ON public.referrals(referred_user_id);
CREATE INDEX idx_referrals_referrer ON public.referrals(referrer_id);
CREATE INDEX idx_referral_earnings_user ON public.referral_earnings(user_id);
CREATE INDEX idx_referral_earnings_referred_user ON public.referral_earnings(referred_user_id);
CREATE INDEX idx_payouts_user ON public.payouts(user_id);

-- Create triggers for updated_at columns
CREATE TRIGGER update_referrals_updated_at
  BEFORE UPDATE ON public.referrals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_referral_earnings_updated_at
  BEFORE UPDATE ON public.referral_earnings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payouts_updated_at
  BEFORE UPDATE ON public.payouts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to get referral statistics for a user
CREATE OR REPLACE FUNCTION public.get_user_referral_stats(target_user_id UUID)
RETURNS TABLE(
  total_referrals BIGINT,
  active_referrals BIGINT,
  inactive_referrals BIGINT,
  total_earned NUMERIC,
  paid_earnings NUMERIC,
  pending_earnings NUMERIC
) AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;