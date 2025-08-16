import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { storeRefFromURL, logReferralClick } from '@/lib/referral';

/**
 * Hook to capture referral codes from URL parameters and store them persistently
 * This runs on every page load to capture ?ref=<code> parameters
 */
export const useReferralCapture = () => {
  const location = useLocation();

  useEffect(() => {
    const ref = storeRefFromURL();
    if (ref) {
      console.log('Referral code captured:', ref);
      logReferralClick(ref);
    }
  }, [location.search]);
};