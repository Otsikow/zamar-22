import { supabase } from '@/integrations/supabase/client';

/**
 * Single source of truth for building referral links
 * Uses canonical base URL and permanent ref_code from profiles
 */
export async function getReferralLink(userId: string): Promise<string> {
  // 1) Get base URL from environment or fallback to current origin
  const envUrl = import.meta.env.VITE_APP_BASE_URL || 'https://www.zamarsongs.com';
  const baseUrl = envUrl.trim() || (typeof window !== 'undefined' ? window.location.origin : '');

  // 2) Get user's permanent ref_code from profiles
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('ref_code')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching ref_code:', error);
    throw new Error('Failed to get referral code');
  }

  const code = profile?.ref_code || '';
  
  if (!code) {
    throw new Error('No referral code found. Please try refreshing.');
  }

  // 3) Assemble canonical link
  return `${baseUrl}/?ref=${code}`;
}

/**
 * Rotate user's referral code and return new link
 */
export async function rotateReferralCode(userId: string): Promise<string> {
  const { data: newCode, error } = await supabase
    .rpc('rotate_ref_code', { uid: userId });

  if (error) {
    console.error('Error rotating ref_code:', error);
    throw new Error('Failed to rotate referral code');
  }

  // Return new link with rotated code
  const envUrl = import.meta.env.VITE_APP_BASE_URL || 'https://www.zamarsongs.com';
  const baseUrl = envUrl.trim() || (typeof window !== 'undefined' ? window.location.origin : '');
  
  return `${baseUrl}/?ref=${newCode}`;
}