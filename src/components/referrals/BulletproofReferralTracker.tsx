import { useReferralCapture } from '@/hooks/useReferralCapture';

/**
 * Bulletproof referral tracking component that captures and persists ref codes
 * This should be mounted at the app level to ensure all referrals are captured
 */
export const BulletproofReferralTracker = () => {
  // Use the enhanced referral capture hook
  useReferralCapture();

  return null; // This component has no UI
};

export default BulletproofReferralTracker;