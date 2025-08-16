-- Create products table for managing all Stripe products
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    stripe_product_id TEXT UNIQUE NOT NULL,
    stripe_price_id TEXT UNIQUE NOT NULL,
    price_cents INTEGER NOT NULL,
    currency TEXT NOT NULL DEFAULT 'GBP',
    billing_interval TEXT DEFAULT 'one_time', -- one_time | monthly | yearly
    category TEXT NOT NULL, -- custom_song | supporter | subscription | advertising | download
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Create policies for products
CREATE POLICY "Anyone can view active products" ON public.products
FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage all products" ON public.products
FOR ALL USING (is_admin());

-- Update existing purchases table to reference products
ALTER TABLE public.purchases 
ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES public.products(id),
ADD COLUMN IF NOT EXISTS stripe_session_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_payment_intent TEXT;

-- Create updated at trigger for products
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Insert the initial products from the pricing structure
INSERT INTO public.products (name, description, stripe_product_id, stripe_price_id, price_cents, category, billing_interval) VALUES
('Custom Song – Essentials', 'Essential custom song package', 'prod_essentials', 'price_essentials', 2500, 'custom_song', 'one_time'),
('Custom Song – Signature', 'Signature custom song package', 'prod_signature', 'price_signature', 6000, 'custom_song', 'one_time'),
('Custom Song – Premier', 'Premier custom song package', 'prod_premier', 'price_premier', 12900, 'custom_song', 'one_time'),
('Supporter Lifetime Upgrade', 'Lifetime supporter access', 'prod_supporter_lifetime', 'price_supporter_lifetime', 4900, 'supporter', 'one_time'),
('Subscription – Standard Monthly', 'Standard monthly subscription', 'prod_standard_monthly', 'price_standard_monthly', 600, 'subscription', 'monthly'),
('Subscription – Standard Yearly', 'Standard yearly subscription', 'prod_standard_yearly', 'price_standard_yearly', 6000, 'subscription', 'yearly'),
('Subscription – Family Monthly', 'Family monthly subscription', 'prod_family_monthly', 'price_family_monthly', 1200, 'subscription', 'monthly'),
('Subscription – Family Yearly', 'Family yearly subscription', 'prod_family_yearly', 'price_family_yearly', 12000, 'subscription', 'yearly'),
('Advertiser – Banner Ads', 'Monthly banner advertising', 'prod_ads_banner', 'price_ads_banner', 15000, 'advertising', 'monthly'),
('Advertiser – Audio Ads', 'Monthly audio advertising', 'prod_ads_audio', 'price_ads_audio', 30000, 'advertising', 'monthly'),
('Advertiser – Combo Ads', 'Monthly combo advertising', 'prod_ads_combo', 'price_ads_combo', 40000, 'advertising', 'monthly'),
('Pay-Per-Download – Single Song', 'Single song download', 'prod_song_download', 'price_song_download', 129, 'download', 'one_time'),
('Pay-Per-Download – Album', 'Album download', 'prod_album_download', 'price_album_download', 499, 'download', 'one_time'),
('Pay-Per-Download – 10-Song Bundle', '10-song bundle download', 'prod_bundle_10', 'price_bundle_10', 999, 'download', 'one_time');