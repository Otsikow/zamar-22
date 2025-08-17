-- Update products with correct categories based on their names
UPDATE public.products SET category = 'donation' WHERE name LIKE '%Donate%';
UPDATE public.products SET category = 'download' WHERE name LIKE 'Pay-Per-Download%';
UPDATE public.products SET category = 'custom_song' WHERE name LIKE 'Custom Song%';
UPDATE public.products SET category = 'supporter' WHERE name LIKE '%Lifetime%';
UPDATE public.products SET category = 'subscription' WHERE name LIKE 'Subscription%';
UPDATE public.products SET category = 'advertising' WHERE name LIKE 'Advertiser%';