import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Ad {
  id: string;
  title: string;
  ad_type: string;
  target_url: string | null;
  media_url: string | null;
  placement: string | null;
  start_date: string | null;
  end_date: string | null;
}

type AdSlotProps = {
  placement: "home_hero" | "sidebar_300x250" | "player_728x90" | string;
  className?: string;
};

const withinWindow = (ad: Ad) => {
  const today = new Date().toISOString().slice(0, 10);
  const afterStart = !ad.start_date || ad.start_date <= today;
  const beforeEnd = !ad.end_date || ad.end_date >= today;
  return afterStart && beforeEnd;
};

const loggedImpressions = new Set<string>();

export default function AdSlot({ placement, className }: AdSlotProps) {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("advertisements")
        .select("id,title,ad_type,target_url,media_url,placement,start_date,end_date")
        .eq("is_active", true)
        .ilike("ad_type", "banner")
        .eq("placement", placement)
        .order("created_at", { ascending: false });
      setAds((data as Ad[]) || []);
      setLoading(false);
    };
    load();
  }, [placement]);

  const ad = useMemo(() => ads.find(withinWindow) || ads[0], [ads]);

  // Impression tracking once in view
  useEffect(() => {
    if (!ad) return;
    const key = `${ad.id}-${placement}`;
    if (loggedImpressions.has(key)) return;

    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting && !loggedImpressions.has(key)) {
          loggedImpressions.add(key);
          supabase.functions.invoke("ad-track", {
            body: { type: "impression", adId: ad.id, placement },
          }).catch(() => {});
          observer.disconnect();
        }
      }
    }, { threshold: 0.4 });

    observer.observe(el);
    return () => observer.disconnect();
  }, [ad, placement]);

  if (loading || !ad) return null;
  if (!ad.media_url) return null;

  const redirectUrl = `https://wtnebvhrjnpygkftjreo.supabase.co/functions/v1/ad-redirect?ad_id=${encodeURIComponent(ad.id)}`;

  return (
    <aside ref={containerRef} className={className} aria-label="sponsored banner">
      <a href={redirectUrl} target="_blank" rel="noopener nofollow sponsored" aria-label={`Sponsored: ${ad.title}`}>
        <img
          src={ad.media_url}
          alt={`Sponsored banner: ${ad.title}`}
          className="w-full h-auto rounded-md border border-border object-contain"
          loading="lazy"
        />
      </a>
    </aside>
  );
}
