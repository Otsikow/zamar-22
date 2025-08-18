import { supabase } from '@/integrations/supabase/client';

export function storeRefFromURL() {
  const url = new URL(window.location.href);
  const ref = url.searchParams.get('ref');
  console.log('storeRefFromURL called, URL:', url.href, 'ref param:', ref);
  
  if (!ref) {
    console.log('No ref parameter found in URL');
    return null;
  }
  
  console.log('Storing referral code:', ref);
  localStorage.setItem('ref_code', ref);
  document.cookie = `ref_code=${ref};path=/;max-age=${60*60*24*90}`;
  
  console.log('Stored ref code in localStorage and cookie');
  return ref;
}

export function getStoredRefCode(): string | null {
  // Try localStorage first, then cookie
  const fromStorage = localStorage.getItem('ref_code');
  console.log('getStoredRefCode - from localStorage:', fromStorage);
  
  if (fromStorage) {
    console.log('Found ref code in localStorage:', fromStorage);
    return fromStorage;
  }
  
  const cookieMatch = document.cookie.match(/ref_code=([^;]+)/);
  const fromCookie = cookieMatch ? cookieMatch[1] : null;
  console.log('getStoredRefCode - from cookie:', fromCookie);
  
  return fromCookie;
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
  console.log('applyReferralAfterSignIn called for user:', userId);
  
  // Try the new referral capture system first
  const referrerId = localStorage.getItem('referrer_id') || getCookieValue('referrer_id');
  const referralCode = localStorage.getItem('referral_code') || getCookieValue('referral_code');
  
  // Fallback to old system
  const oldRefCode = getStoredRefCode();
  
  console.log('Referral data found:', { 
    referrerId, 
    referralCode, 
    oldRefCode,
    localStorage_referrer_id: localStorage.getItem('referrer_id'),
    localStorage_referral_code: localStorage.getItem('referral_code')
  });
  
  let refToUse = referralCode || oldRefCode;
  
  if (!refToUse && !referrerId) {
    console.log('No referral data found, skipping referral application');
    return;
  }
  
  try {
    console.log('Calling apply_referral RPC with:', { new_user: userId, raw_ref: refToUse });
    
    const { data, error } = await supabase.rpc('apply_referral', { 
      new_user: userId, 
      raw_ref: refToUse 
    });
    
    console.log('apply_referral RPC result:', { data, error });
    
    if (error) {
      console.error('RPC apply_referral error:', error);
    } else {
      console.log('Referral application successful, clearing stored data');
      // Clear all stored referral data
      clearStoredRefCode();
      localStorage.removeItem('referrer_id');
      localStorage.removeItem('referral_code');
      document.cookie = 'referrer_id=; Max-Age=0; path=/';
      document.cookie = 'referral_code=; Max-Age=0; path=/';
    }
  } catch (error) {
    console.error('Failed to apply referral:', error);
  }
}

function getCookieValue(name: string): string | null {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : null;
}