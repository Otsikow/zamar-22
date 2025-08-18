import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getStoredReferralData, clearStoredReferralData } from './useReferralCapture';
import { toast } from 'sonner';

/**
 * Hook to handle referral processing during signup/login
 */
export const useReferralSignup = () => {
  
  const processReferralAfterAuth = useCallback(async (userId: string) => {
    try {
      console.log('Processing referral for user:', userId);
      
      const { referrerId } = getStoredReferralData();
      
      if (!referrerId || referrerId === userId) {
        console.log('No valid referrer found or self-referral, skipping');
        clearStoredReferralData();
        return;
      }

      // Ensure user has a referral code
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('referral_code')
        .eq('id', userId)
        .single();

      if (!userProfile?.referral_code) {
        // Generate referral code for new user
        const newCode = generateReferralCode();
        await supabase
          .from('profiles')
          .update({ referral_code: newCode })
          .eq('id', userId);
      }

      // Set referrer relationship
      await supabase
        .from('profiles')
        .update({ 
          referrer_id: referrerId,
          referred_by: referrerId // Keep backward compatibility
        })
        .eq('id', userId);

      // Create referral record
      const { error: referralError } = await supabase
        .from('referrals')
        .insert({
          referrer_id: referrerId,
          referred_user_id: userId,
          generation: 1
        });

      if (referralError && !referralError.message.includes('duplicate')) {
        throw referralError;
      }

      toast.success("Referral saved. Your signup supports the person who invited you.");
      console.log('Referral processing completed successfully');

    } catch (error) {
      console.error('Error processing referral:', error);
      toast.error("There was an issue processing your referral, but your account was created successfully.");
    } finally {
      // Always clear stored data after processing
      clearStoredReferralData();
    }
  }, []);

  return { processReferralAfterAuth };
};

// Helper function to generate referral codes
function generateReferralCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}