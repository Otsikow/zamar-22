-- Add missing fields to align with the referral system requirements

-- Add provider_id to purchases table for Stripe integration
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS provider_id TEXT;

-- Add missing fields to referral_earnings table
ALTER TABLE referral_earnings ADD COLUMN IF NOT EXISTS purchase_id UUID;
ALTER TABLE referral_earnings ADD COLUMN IF NOT EXISTS referral_id UUID;

-- Add referrer_id to profiles table (maps to referred_by but clearer naming)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referrer_id UUID;

-- Create unique constraints to prevent duplicates
DROP INDEX IF EXISTS uq_ref_earnings;
CREATE UNIQUE INDEX uq_ref_earnings 
  ON referral_earnings (user_id, referred_user_id, purchase_id) 
  WHERE purchase_id IS NOT NULL;

-- Create unique index on purchases provider_id
DROP INDEX IF EXISTS uq_purchases_provider;
CREATE UNIQUE INDEX uq_purchases_provider 
  ON purchases (provider_id) 
  WHERE provider_id IS NOT NULL;

-- Update referrer_id from existing referred_by data
UPDATE profiles 
SET referrer_id = referred_by 
WHERE referred_by IS NOT NULL AND referrer_id IS NULL;

-- Add self-referral prevention check (PostgreSQL compatible)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage 
    WHERE constraint_name = 'no_self_ref' AND table_name = 'profiles'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT no_self_ref 
    CHECK (referrer_id IS NULL OR referrer_id <> id);
  END IF;
END $$;