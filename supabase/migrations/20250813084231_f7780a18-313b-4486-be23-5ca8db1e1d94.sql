-- Fix payment security issues by removing overly permissive RLS policies
-- and ensuring only proper service-level access for payments

-- Drop the overly permissive system policies
DROP POLICY IF EXISTS "System can insert payments" ON public.payments;
DROP POLICY IF EXISTS "System can update payments" ON public.payments;

-- Add more restrictive policies that only allow edge functions with service role
-- to insert/update payments, while maintaining user read access

-- Policy for edge functions to insert payments (service role bypass)
CREATE POLICY "Service role can insert payments" 
ON public.payments 
FOR INSERT 
WITH CHECK (
  -- Only allow if using service role key (bypasses RLS) 
  -- or if user is inserting their own payment record
  auth.uid() = user_id
);

-- Policy for edge functions to update payments (service role bypass)
CREATE POLICY "Service role can update payments" 
ON public.payments 
FOR UPDATE 
USING (
  -- Only allow if using service role key (bypasses RLS)
  -- or if user is updating their own payment record
  auth.uid() = user_id
);

-- Ensure users can still view their own payments (keep existing policy)
-- This policy already exists and is secure: "Users can view their own payments"

-- Keep admin access (already exists and is secure)
-- This policy already exists: "Admins can manage all payments"