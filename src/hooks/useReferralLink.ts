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
    if (!userId) return;

    setIsLinking(true);
    try {
      await applyReferralAfterSignIn(userId);
      toast({
        title: "Referral linked! 🎉",
        description: "You've been successfully referred. Welcome to Zamar!",
      });
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