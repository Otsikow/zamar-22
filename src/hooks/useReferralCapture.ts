import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Enhanced hook to capture referral codes from URL parameters and store them safely
 * Supports both referral codes and direct user IDs in ?ref= parameter
 */
export const useReferralCapture = () => {
  const location = useLocation();

  useEffect(() => {
    const captureReferral = async () => {
      console.log('Referral capture - URL params:', location.search);
      const urlParams = new URLSearchParams(location.search);
      const refParam = urlParams.get('ref');
      console.log('Referral capture - ref param found:', refParam);
      
      if (!refParam) {
        console.log('No ref parameter in URL, skipping capture');
        return;
      }

      try {
        console.log('Looking up referrer by code or ID:', refParam);
        // Try to find user by new ref_code or legacy referral_code
        const { data: referrer, error } = await supabase
          .from('profiles')
          .select('id, ref_code, referral_code, first_name, last_name')
          .or(`ref_code.eq.${refParam},referral_code.eq.${refParam},id.eq.${refParam}`)
          .single();

        console.log('Referrer lookup result:', { referrer, error });

        if (error || !referrer) {
          console.warn('Invalid referral code:', refParam, error);
          // Clean up any existing referral data
          localStorage.removeItem('referrer_id');
          localStorage.removeItem('referral_code');
          toast.info("Referral link looks invalid. Continuing without a ref.");
          return;
        }

        console.log('Valid referrer found, storing data:', referrer);
        // Store referral code for signup conversion (new system)
        const finalRefCode = referrer.ref_code || referrer.referral_code || '';
        
        // Use single cookie for signup conversion
        document.cookie = `zamar_ref=${finalRefCode}; Max-Age=2592000; Path=/; SameSite=Lax; Secure`;
        localStorage.setItem('zamar_ref', finalRefCode);
        
        // Legacy storage for backward compatibility
        localStorage.setItem('referrer_id', referrer.id);
        localStorage.setItem('referral_code', finalRefCode);

        // Show success message with referrer name
        const referrerName = [referrer.first_name, referrer.last_name]
          .filter(Boolean)
          .join(' ') || 'a creator';
        
        toast.success(`🎉 Referral applied! You're supporting ${referrerName}.`);

        // Log the referral click for analytics
        supabase.functions.invoke('log-referral-click', {
          body: { ref: refParam }
        }).catch(console.warn);

      } catch (error) {
        console.error('Error capturing referral:', error);
      }
    };

    captureReferral();
  }, [location.search]);
};

/**
 * Helper functions to get and clear stored referral data
 */
export const getStoredReferralData = () => {
  // New system: try zamar_ref first
  const newRefMatch = document.cookie.match(/zamar_ref=([^;]+)/);
  const newRef = newRefMatch ? newRefMatch[1] : localStorage.getItem('zamar_ref');
  
  if (newRef) {
    return { referrerId: null, referralCode: newRef };
  }
  
  // Legacy system fallback
  let referrerId = localStorage.getItem('referrer_id');
  let referralCode = localStorage.getItem('referral_code');

  if (!referrerId) {
    const cookieMatch = document.cookie.match(/referrer_id=([^;]+)/);
    referrerId = cookieMatch ? cookieMatch[1] : null;
  }

  if (!referralCode) {
    const cookieMatch = document.cookie.match(/referral_code=([^;]+)/);
    referralCode = cookieMatch ? cookieMatch[1] : null;
  }

  return { referrerId, referralCode };
};

export const clearStoredReferralData = () => {
  // Clear new system
  document.cookie = 'zamar_ref=; Max-Age=0; Path=/';
  localStorage.removeItem('zamar_ref');
  
  // Clear legacy system
  localStorage.removeItem('referrer_id');
  localStorage.removeItem('referral_code');
  document.cookie = 'referrer_id=; Max-Age=0; path=/';
  document.cookie = 'referral_code=; Max-Age=0; path=/';
};