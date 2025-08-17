-- Fix active_sessions table schema issues and RLS
ALTER TABLE public.active_sessions ALTER COLUMN session_id DROP NOT NULL;

-- Fix donations table schema issues  
ALTER TABLE public.donations ALTER COLUMN type SET DEFAULT 'one-time';

-- Ensure proper RLS policies for donations from webhooks
DROP POLICY IF EXISTS "webhook_insert_donations" ON public.donations;
CREATE POLICY "webhook_insert_donations" ON public.donations
FOR INSERT 
WITH CHECK (true);

-- Fix payments table to allow service role insertions
DROP POLICY IF EXISTS "Service role can insert payments" ON public.payments;
CREATE POLICY "Service role can insert payments" ON public.payments
FOR INSERT 
WITH CHECK (true);

-- Fix referrals generation default
ALTER TABLE public.referrals ALTER COLUMN generation SET DEFAULT 1;

-- Add missing indexes for performance
CREATE INDEX IF NOT EXISTS idx_donations_stripe_session ON public.donations(stripe_checkout_session);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_session ON public.payments(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_active_sessions_last_ping ON public.active_sessions(last_ping);

-- Clean up any orphaned sessions older than 24 hours
DELETE FROM public.active_sessions WHERE last_ping < NOW() - INTERVAL '24 hours';