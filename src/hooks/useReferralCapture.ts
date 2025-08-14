import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Hook to capture referral codes from URL parameters and store them in localStorage
 * This runs on every page load to capture ?ref=<code> parameters
 */
export const useReferralCapture = () => {
  const location = useLocation();

  useEffect(() => {
    // Check for referral code in URL
    const urlParams = new URLSearchParams(location.search);
    const refCode = urlParams.get('ref');

    if (refCode && refCode.trim()) {
      try {
        // Store the referral code in localStorage
        localStorage.setItem('refCode', refCode.trim().toUpperCase());
        console.log('Referral code captured:', refCode);
      } catch (error) {
        console.error('Failed to store referral code:', error);
      }
    }
  }, [location.search]);
};