-- Create custom song orders table for package-aware tracking
CREATE TABLE IF NOT EXISTS public.custom_song_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  tier TEXT CHECK (tier IN ('basic','pro','premium')) NOT NULL,
  stripe_price_id TEXT NOT NULL,
  stripe_session_id TEXT UNIQUE,
  stripe_payment_intent TEXT,
  amount INTEGER NOT NULL, -- in pence
  currency TEXT NOT NULL DEFAULT 'gbp',
  status TEXT NOT NULL DEFAULT 'pending', -- pending, paid, failed, refunded
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_custom_song_orders_user_status ON public.custom_song_orders (user_id, status);

-- Enable RLS
ALTER TABLE public.custom_song_orders ENABLE ROW LEVEL SECURITY;

-- Policies for custom_song_orders
CREATE POLICY "Users can view their own orders" ON public.custom_song_orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own orders" ON public.custom_song_orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can update orders (webhooks)" ON public.custom_song_orders
  FOR UPDATE USING (true);

CREATE POLICY "Admins can manage all orders" ON public.custom_song_orders
  FOR ALL USING (is_admin());

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION public.update_custom_song_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_custom_song_orders_updated_at
  BEFORE UPDATE ON public.custom_song_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_custom_song_orders_updated_at();