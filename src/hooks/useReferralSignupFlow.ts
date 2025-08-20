import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { clearStoredReferralData } from '@/hooks/useReferralCapture';

/**
 * Hook to handle referral attachment flow after user signup/login
 * Uses the new attach-referral edge function for consistent processing
 */
export const useReferralSignupFlow = () => {
  const { user } = useAuth();

  useEffect(() => {
    const attachReferral = async () => {
      if (!user?.id) return;
      
      // Check if user already has a referrer to avoid duplicate processing
      const { data: profile } = await supabase
        .from('profiles')
        .select('referred_by')
        .eq('id', user.id)
        .single();
        
      if (profile?.referred_by) {
        console.log('User already has referrer, skipping attachment');
        return;
      }

      try {
        console.log('Attempting to attach referral for user:', user.id);
        
        const { data, error } = await supabase.functions.invoke('attach-referral', {
          body: { user_id: user.id }
        });

        if (error) {
          console.error('Error calling attach-referral function:', error);
          return;
        }

        console.log('Attach referral response:', data);

        if (data?.success && data?.referrer) {
          // Clear stored referral data after successful attachment
          clearStoredReferralData();
          
          toast.success(`🎉 Welcome! You're now supporting ${data.referrer.name}`, {
            description: "You've been successfully linked to your referrer. Enjoy exclusive content!",
            duration: 6000
          });
        }
        
      } catch (error) {
        console.error('Failed to attach referral:', error);
        // Silent fail - don't interrupt user experience
      }
    };

    // Small delay to ensure profile is created first
    const timer = setTimeout(attachReferral, 2000);
    return () => clearTimeout(timer);
  }, [user?.id]);

  return null;
};