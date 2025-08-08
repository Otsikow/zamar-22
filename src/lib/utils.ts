import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function addWWWToReferralLink(link: string): string {
  try {
    const url = new URL(link);
    if (!url.hostname.startsWith('www.')) {
      url.hostname = `www.${url.hostname}`;
    }
    return url.toString();
  } catch (e) {
    console.error('Invalid URL:', link, e);
    return link;
  }
}
