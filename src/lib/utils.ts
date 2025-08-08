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

// Extract scripture reference and/or quote from lyrics text in flexible formats
// Supports:
// - "Scripture Inspiration: John 3:16 – For God so loved..."
// - "Scripture Reference: John 3:16 — For God so loved..."
// - "(Scripture: Psalm 23:1–3)"
export function extractScriptureFromLyrics(text?: string): { reference?: string; quote?: string } | null {
  if (!text) return null;

  // Pattern with reference and quote separated by dash variants
  const matchWithQuote = text.match(/Scripture(?:\s+Inspiration|\s*Reference)?\s*:\s*([^\n–—-]+)\s*[–—-]\s*[“”"']?([^"\n]+)[”"']?/i);
  if (matchWithQuote) {
    return { reference: matchWithQuote[1].trim(), quote: matchWithQuote[2].trim() };
  }

  // Pattern with reference only, possibly wrapped in parentheses
  const matchRefOnly = text.match(/\(?\s*Scripture\s*:\s*([^\)\n]+)\)?/i);
  if (matchRefOnly) {
    return { reference: matchRefOnly[1].trim() };
  }

  return null;
}

