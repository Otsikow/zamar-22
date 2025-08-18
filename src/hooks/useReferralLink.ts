import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { applyReferralAfterSignIn } from '@/lib/referral';

/**
 * Hook to handle referral linking after user signup/login
 */
export const useReferralLink = (userId: string | null) => {
  const { toast } = useToast();
  const [isLinking, setIsLinking] = useState(false);

  const linkReferral = async () => {
    if (!userId) {
      console.log('linkReferral called but no userId provided');
      return;
    }

    console.log('linkReferral starting for userId:', userId);
    setIsLinking(true);
    try {
      await applyReferralAfterSignIn(userId);
      console.log('Referral linking completed successfully');
      toast({
        title: "Referral linked! 🎉",
        description: "You've been successfully referred. Welcome to Zamar!",
      });
    } catch (error) {
      console.error('Failed to link referral:', error);
      toast({
        title: "Referral linking failed",
        description: "There was an issue linking your referral. Please contact support.",
        variant: "destructive"
      });
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