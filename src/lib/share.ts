type SharePayload = {
  id: string;                      // testimony id/slug
  body: string;                    // full testimony text
  author?: string;                 // e.g. "Pastor James W."
  location?: string;               // e.g. "Charlotte, NC, USA"
  baseUrl?: string;                // default your prod URL
  utm?: Record<string,string>;     // optional tracking
  toast?: (msg: string, t?: "success"|"error"|"info") => void;
};

const safeTruncate = (s: string, max = 220) => {
  // Grapheme‑aware truncate (prevents cutting emoji/accents)
  const it = s[Symbol.iterator](); 
  let out = ""; 
  let n = 0;
  for (let ch of it) { 
    n += new TextEncoder().encode(ch).length; 
    if (n > max) break; 
    out += ch; 
  }
  return out.replace(/\s+$/,"");
};

const buildUrl = (id: string, baseUrl = "https://www.zamarsongs.com") => {
  // Prefer pretty route; fall back to querystring route if needed
  const pretty = `${baseUrl.replace(/\/$/,"")}/testimony/${encodeURIComponent(id)}`;
  return pretty;
};

const withUtm = (url: string, utm?: Record<string,string>) => {
  if (!utm) return url;
  const u = new URL(url); 
  Object.entries(utm).forEach(([k,v])=>u.searchParams.set(k,v));
  return u.toString();
};

const copyFallback = async (text: string) => {
  // Works even when navigator.clipboard is unavailable (iOS Safari / cross‑origin)
  const ta = document.createElement("textarea");
  ta.value = text; 
  ta.setAttribute("readonly",""); 
  ta.style.position = "fixed"; 
  ta.style.opacity = "0";
  document.body.appendChild(ta); 
  ta.select(); 
  ta.setSelectionRange(0, 99999);
  const ok = document.execCommand("copy"); 
  document.body.removeChild(ta);
  if (!ok) throw new Error("copy failed");
};

export async function shareTestimony(p: SharePayload) {
  const url = withUtm(buildUrl(p.id, p.baseUrl), p.utm);
  const header = [p.author, p.location].filter(Boolean).join(" — ");
  const snippet = safeTruncate(p.body, 220);
  const text = header ? `${header}\n\n${snippet}\n\n` : `${snippet}\n\n`;
  const shareText = `${text}${url}`;

  try {
    // Must be called from a user gesture (onClick)
    const canNative = typeof navigator !== "undefined" && "share" in navigator;
    if (canNative) {
      // Some browsers require https and top‑level context
      const data: ShareData = { title: "Zamar Testimony", text, url };
      // @ts-ignore canShare optional
      if (!navigator.canShare || (navigator as any).canShare?.(data)) {
        await (navigator as any).share(data);
        p.toast?.("Shared!", "success");
        return;
      }
    }

    // Clipboard path (desktop and unsupported mobiles)
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(shareText);
    } else {
      await copyFallback(shareText);
    }
    p.toast?.("Link copied to clipboard.", "success");
  } catch (err) {
    // Final fallback: open Twitter intent with encoded snippet
    const tweet = `${snippet} ${url}`;
    const intent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweet)}`;
    window.open(intent, "_blank", "noopener,noreferrer");
    p.toast?.("Opening Twitter to share…", "info");
  }
}