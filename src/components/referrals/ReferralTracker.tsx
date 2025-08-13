import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const ReferralTracker = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const referralCode = searchParams.get('ref');
    
    if (referralCode) {
      // Store the referral code in session storage for later use during signup
      sessionStorage.setItem('referralCode', referralCode);
      
      toast({
        title: "Referral Link Detected",
        description: "You'll earn your referrer a commission when you become a supporter!",
      });
    }
  }, [searchParams, toast]);

  return null; // This is a tracking component with no UI
};

// Function to handle referral tracking during user signup
export const handleReferralSignup = async (newUserId: string) => {
  const referralCode = sessionStorage.getItem('referralCode');
  
  if (referralCode) {
    try {
      // Extract the referrer ID from the referral code (handle both formats)
      const codeId = referralCode.replace('ZAMAR_', '').toLowerCase();
      
      // Find the referrer user by matching the end of their user ID with the code
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id')
        .ilike('id', `%${codeId}`);

      if (profiles && profiles.length > 0) {
        const referrerId = profiles[0].id;
        
        // Insert into referrals table for 1st generation
        const { error: referralError } = await supabase
          .from('referrals')
          .insert({
            referred_user_id: newUserId,
            referrer_id: referrerId,
            generation: 1
          });

        if (referralError) {
          console.error('Error inserting referral:', referralError);
        } else {
          console.log('Referral tracked successfully:', {
            referrer: referrerId,
            referred: newUserId,
            generation: 1
          });
        }

        // Check if the referrer was also referred (2nd generation)
        const { data: parentReferral } = await supabase
          .from('referrals')
          .select('referrer_id')
          .eq('referred_user_id', referrerId)
          .eq('generation', 1)
          .single();

        if (parentReferral) {
          // Insert 2nd generation referral
          const { error: secondGenError } = await supabase
            .from('referrals')
            .insert({
              referred_user_id: newUserId,
              referrer_id: parentReferral.referrer_id,
              generation: 2
            });

          if (!secondGenError) {
            console.log('2nd generation referral tracked:', {
              referrer: parentReferral.referrer_id,
              referred: newUserId,
              generation: 2
            });
          }
        }
        
        // Clear the referral code from session storage
        sessionStorage.removeItem('referralCode');
      }
    } catch (error) {
      console.error('Error processing referral signup:', error);
    }
  }
};