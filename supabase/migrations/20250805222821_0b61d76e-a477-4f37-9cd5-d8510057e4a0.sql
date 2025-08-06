-- Create enhanced function to insert referral earnings after payment
CREATE OR REPLACE FUNCTION public.insert_referral_earnings_after_payment(payer_id UUID, payment_amount NUMERIC)
RETURNS VOID AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Create trigger function for donations table
CREATE OR REPLACE FUNCTION public.on_donation_insert_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process successful donations/payments
  IF NEW.status = 'completed' AND NEW.amount >= 25.00 THEN
    PERFORM public.insert_referral_earnings_after_payment(NEW.user_id, NEW.amount);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Create trigger function for when donation status is updated to completed
CREATE OR REPLACE FUNCTION public.on_donation_update_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process when status changes to completed and meets minimum amount
  IF OLD.status != 'completed' AND NEW.status = 'completed' AND NEW.amount >= 25.00 THEN
    PERFORM public.insert_referral_earnings_after_payment(NEW.user_id, NEW.amount);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Create the actual triggers on donations table
CREATE TRIGGER handle_referral_on_donation_insert
  AFTER INSERT ON public.donations
  FOR EACH ROW
  EXECUTE FUNCTION public.on_donation_insert_trigger();

CREATE TRIGGER handle_referral_on_donation_update
  AFTER UPDATE ON public.donations
  FOR EACH ROW
  EXECUTE FUNCTION public.on_donation_update_trigger();

-- Create a payments table for more specific payment tracking (optional)
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT DEFAULT 'gbp',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed', 'cancelled')),
  stripe_payment_intent_id TEXT,
  stripe_session_id TEXT,
  payment_type TEXT, -- 'subscription', 'one_time', 'donation'
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on payments table
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payments
CREATE POLICY "Users can view their own payments" ON public.payments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert payments" ON public.payments
  FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update payments" ON public.payments
  FOR UPDATE USING (true);

CREATE POLICY "Admins can manage all payments" ON public.payments
  FOR ALL USING (is_admin());

-- Create trigger function for payments table
CREATE OR REPLACE FUNCTION public.on_payment_insert_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process successful payments that meet minimum threshold
  IF NEW.status = 'succeeded' AND NEW.amount >= 25.00 THEN
    PERFORM public.insert_referral_earnings_after_payment(NEW.user_id, NEW.amount);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION public.on_payment_update_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process when status changes to succeeded and meets minimum amount
  IF OLD.status != 'succeeded' AND NEW.status = 'succeeded' AND NEW.amount >= 25.00 THEN
    PERFORM public.insert_referral_earnings_after_payment(NEW.user_id, NEW.amount);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Create triggers on payments table
CREATE TRIGGER handle_referral_on_payment_insert
  AFTER INSERT ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.on_payment_insert_trigger();

CREATE TRIGGER handle_referral_on_payment_update
  AFTER UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.on_payment_update_trigger();

-- Create indexes for better performance
CREATE INDEX idx_payments_user_id ON public.payments(user_id);
CREATE INDEX idx_payments_status ON public.payments(status);
CREATE INDEX idx_payments_stripe_payment_intent ON public.payments(stripe_payment_intent_id);
CREATE INDEX idx_payments_stripe_session ON public.payments(stripe_session_id);

-- Create trigger for updated_at on payments
CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Expose the function for RPC calls (for webhook integration)
GRANT EXECUTE ON FUNCTION public.insert_referral_earnings_after_payment(UUID, NUMERIC) TO anon;
GRANT EXECUTE ON FUNCTION public.insert_referral_earnings_after_payment(UUID, NUMERIC) TO authenticated;