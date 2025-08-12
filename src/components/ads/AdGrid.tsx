import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

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

export type AdGridProps = {
  placement: string;
  limit?: number;
  className?: string;
  title?: string;
};

const withinWindow = (ad: Ad) => {
  const today = new Date().toISOString().slice(0, 10);
  const afterStart = !ad.start_date || ad.start_date <= today;
  const beforeEnd = !ad.end_date || ad.end_date >= today;
  return afterStart && beforeEnd;
};

const loggedImpressions = new Set<string>();

function AdCard({ ad, placement }: { ad: Ad; placement: string }) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Track impressions when the card enters the viewport
  useEffect(() => {
    if (!ad) return;
    const key = `${ad.id}-${placement}`;
    if (loggedImpressions.has(key)) return;

    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !loggedImpressions.has(key)) {
            loggedImpressions.add(key);
            supabase.functions
              .invoke("ad-track", {
                body: { type: "impression", adId: ad.id, placement },
              })
              .catch(() => {});
            observer.disconnect();
          }
        }
      },
      { threshold: 0.4 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [ad, placement]);

  if (!ad.media_url) return null;

  const redirectUrl = `https://wtnebvhrjnpygkftjreo.supabase.co/functions/v1/ad-redirect?ad_id=${encodeURIComponent(
    ad.id
  )}`;

  return (
    <article ref={containerRef} className="group" aria-label={`sponsored item: ${ad.title}`}>
      <a
        href={redirectUrl}
        target="_blank"
        rel="noopener nofollow sponsored"
        aria-label={`Sponsored: ${ad.title}`}
        className="block h-full"
      >
        <Card className="overflow-hidden p-0 transition-shadow duration-200 hover:shadow-card/80">
          <div className={cn("w-full bg-muted/40 border-b border-border/60")}
               aria-hidden="true">
            <img
              src={ad.media_url}
              alt={`Sponsored banner: ${ad.title}`}
              className="w-full h-28 sm:h-32 object-contain"
              loading="lazy"
            />
          </div>
          <div className="p-2 sm:p-3">
            <h3 className="text-sm font-medium line-clamp-2 text-foreground/90">
              {ad.title}
            </h3>
          </div>
        </Card>
      </a>
    </article>
  );
}

export default function AdGrid({ placement, limit = 4, className, title }: AdGridProps) {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("ads")
        .select(
          "id,title,ad_type,target_url,media_url,placement,start_date,end_date"
        )
        .eq("is_active", true)
        .ilike("ad_type", "banner")
        .eq("placement", placement)
        .order("created_at", { ascending: false })
        .limit(limit);
      setAds((data as Ad[]) || []);
      setLoading(false);
    };
    load();
  }, [placement, limit]);

  const visibleAds = useMemo(() => {
    const inWindow = ads.filter(withinWindow);
    return inWindow.length > 0 ? inWindow.slice(0, limit) : ads.slice(0, limit);
  }, [ads, limit]);

  if (loading || visibleAds.length === 0) return null;

  return (
    <section className={cn("container mx-auto", className)} aria-label="sponsored ads">
      {title ? (
        <h2 className="sr-only">{title}</h2>
      ) : (
        <h2 className="sr-only">Sponsored ads</h2>
      )}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {visibleAds.map((ad) => (
          <AdCard key={ad.id} ad={ad} placement={placement} />
        ))}
      </div>
    </section>
  );
}
