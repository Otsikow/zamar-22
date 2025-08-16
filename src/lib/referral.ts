import { supabase } from '@/integrations/supabase/client';

export function storeRefFromURL() {
  const url = new URL(window.location.href);
  const ref = url.searchParams.get('ref');
  if (!ref) return null;
  
  localStorage.setItem('ref_code', ref);
  document.cookie = `ref_code=${ref};path=/;max-age=${60*60*24*90}`;
  
  return ref;
}

export function getStoredRefCode(): string | null {
  // Try localStorage first, then cookie
  const fromStorage = localStorage.getItem('ref_code');
  if (fromStorage) return fromStorage;
  
  const cookieMatch = document.cookie.match(/ref_code=([^;]+)/);
  return cookieMatch ? cookieMatch[1] : null;
}

export function clearStoredRefCode() {
  localStorage.removeItem('ref_code');
  document.cookie = 'ref_code=; Max-Age=0; path=/';
}

export async function logReferralClick(ref: string) {
  try {
    await supabase.functions.invoke('log-referral-click', {
      body: { ref }
    });
  } catch (error) {
    console.error('Failed to log referral click:', error);
  }
}

export async function applyReferralAfterSignIn(userId: string) {
  const ref = getStoredRefCode();
  if (!ref) return;
  
  try {
    await supabase.rpc('apply_referral', { 
      new_user: userId, 
      raw_ref: ref 
    });
    clearStoredRefCode();
  } catch (error) {
    console.error('Failed to apply referral:', error);
  }
}