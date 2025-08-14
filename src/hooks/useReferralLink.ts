import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook to handle referral linking after user signup/login
 */
export const useReferralLink = (userId: string | null) => {
  const { toast } = useToast();
  const [isLinking, setIsLinking] = useState(false);

  const linkReferral = async () => {
    if (!userId) return;

    setIsLinking(true);
    try {
      // Get the stored referral code
      const refCode = localStorage.getItem('refCode');
      
      if (refCode) {
        console.log('Attempting to link referral with code:', refCode);
        
        // Call the link_referral function
        const { data, error } = await supabase.rpc('link_referral', {
          p_referral_code: refCode
        });

        if (error) {
          console.error('Error linking referral:', error);
        } else if (data) {
          console.log('Referral linked successfully');
          localStorage.removeItem('refCode');
          toast({
            title: "Referral linked! 🎉",
            description: "You've been successfully referred. Welcome to Zamar!",
          });
        } else {
          console.log('Referral code not found or already used');
          localStorage.removeItem('refCode');
        }
      }
    } catch (error) {
      console.error('Failed to link referral:', error);
    } finally {
      setIsLinking(false);
    }
  };

  useEffect(() => {
    if (userId) {
      // Small delay to ensure profile is created first
      const timer = setTimeout(() => {
        linkReferral();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [userId]);

  return { isLinking, linkReferral };
};