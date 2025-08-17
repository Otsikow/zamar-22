-- Add single song purchases to products table
INSERT INTO public.products (name, description, category, stripe_product_id, stripe_price_id, price_cents, currency, billing_interval, is_active)
VALUES 
  ('Single Song Download', 'Download any single song for offline listening', 'single_song', 'prod_single_song', 'price_single_song_129', 129, 'GBP', 'one_time', true)
ON CONFLICT DO NOTHING;