-- Update existing products with real Stripe price IDs and correct pricing
UPDATE public.products SET 
    description = 'Zamar Songs Pay-Per-Download – 10-Song Bundle',
    stripe_price_id = 'price_1RwgZpPZvYhtttKcR7coXc3V',
    price_cents = 999
WHERE name = 'Pay-Per-Download – 10-Song Bundle';

UPDATE public.products SET 
    description = 'Zamar Songs Pay-Per-Download – Album', 
    stripe_price_id = 'price_1RwgYvPZvYhtttKcIIGR4snz',
    price_cents = 499
WHERE name = 'Pay-Per-Download – Album';

UPDATE public.products SET 
    description = 'Zamar Songs Pay-Per-Download – Single Song',
    stripe_price_id = 'price_1RwgXvPZvYhtttKcgcLoK0Xp'
WHERE name = 'Pay-Per-Download – Single Song';

UPDATE public.products SET 
    description = 'Zamar Songs Advertiser – Combo Ads (Monthly)',
    stripe_price_id = 'price_1RwgWmPZvYhtttKcC3a9gygn'
WHERE name = 'Advertiser – Combo Ads';

UPDATE public.products SET 
    description = 'Zamar Songs Advertiser – Audio Ads (Monthly)',
    stripe_price_id = 'price_1RwgUlPZvYhtttKcygu7qx67'
WHERE name = 'Advertiser – Audio Ads';

UPDATE public.products SET 
    description = 'Zamar Songs Advertiser – Banner Ads (Monthly)',
    stripe_price_id = 'price_1RwgTpPZvYhtttKcmcAYOjvg'
WHERE name = 'Advertiser – Banner Ads';

UPDATE public.products SET 
    description = 'Zamar Songs Subscription – Family Monthly',
    stripe_price_id = 'price_1RwgS9PZvYhtttKc8xB7eM6o'
WHERE name = 'Subscription – Family Monthly';

UPDATE public.products SET 
    description = 'Zamar Songs Subscription – Family Yearly',
    stripe_price_id = 'price_1RwgRDPZvYhtttKcxuiTh5fc'
WHERE name = 'Subscription – Family Yearly';

UPDATE public.products SET 
    description = 'Zamar Songs Subscription – Standard Yearly',
    stripe_price_id = 'price_1RwgPAPZvYhtttKcT3RItl86'
WHERE name = 'Subscription – Standard Yearly';

UPDATE public.products SET 
    description = 'Zamar Songs Subscription – Standard Monthly',
    stripe_price_id = 'price_1RwgMoPZvYhtttKc5yOs3xYh'
WHERE name = 'Subscription – Standard Monthly';

UPDATE public.products SET 
    description = 'Supporter Lifetime for Zamar Songs- Upgrade',
    stripe_price_id = 'price_1RwgLTPZvYhtttKcHWXiRwnZ'
WHERE name = 'Supporter Lifetime Upgrade';

UPDATE public.products SET 
    description = 'Custom Song from Zamar Songs – Premier',
    stripe_price_id = 'price_1RwgKPPZvYhtttKcTBSwGdBV'
WHERE name = 'Custom Song – Premier';

UPDATE public.products SET 
    description = 'Custom Song from Zamar Songs – Signature',
    stripe_price_id = 'price_1RwgJEPZvYhtttKcETAbG2jl'
WHERE name = 'Custom Song – Signature';

UPDATE public.products SET 
    description = 'Custom Song from Zamar Songs- Essentials',
    stripe_price_id = 'price_1RwgHjPZvYhtttKci1W6uLQ4'
WHERE name = 'Custom Song – Essentials';

-- Add the donation product
INSERT INTO public.products (name, description, stripe_product_id, stripe_price_id, price_cents, category, billing_interval) 
VALUES (
    'Donate to Our Mission',
    'Support our mission to create and share music. This helps us produce more music and reach more people.',
    'prod_donation',
    'price_1RwhfCPZvYhtttKceXN3txRB',
    0,
    'donation',
    'one_time'
);