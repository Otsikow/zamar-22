import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Megaphone, CalendarClock, ShieldCheck } from "lucide-react";
import Footer from "@/components/sections/Footer";
import AdCheckoutButton from "@/components/ads/AdCheckoutButton";
import { AD_PRICING_GBP, formatGBP, AdPlacement, AdDuration } from "@/lib/adPricing";

const setMeta = (title: string, description: string) => {
  document.title = title;
  let existing = document.querySelector('meta[name="description"]');
  if (!existing) {
    const m = document.createElement("meta");
    m.setAttribute("name", "description");
    document.head.appendChild(m);
    existing = m;
  }
  existing.setAttribute("content", description);

  // Canonical tag
  const canonicalHref = `${window.location.origin}/advertise`;
  let canonical = document.querySelector('link[rel="canonical"]');
  if (!canonical) {
    const l = document.createElement("link");
    l.setAttribute("rel", "canonical");
    document.head.appendChild(l);
    canonical = l;
  }
  canonical.setAttribute("href", canonicalHref);
};

const placements: { key: AdPlacement; label: string; blurb: string; example: string }[] = [
  { key: "hero", label: "Home Hero Banner", blurb: "Top placement on the homepage, maximum visibility.", example: "Appears under the hero on Home" },
  { key: "player", label: "Player Banner", blurb: "Displays near the audio player for high engagement.", example: "Appears in the player view" },
  { key: "sidebar", label: "Sidebar Ad", blurb: "Great value placement across key pages.", example: "Appears in sidebars" },
];

const durationLabels: Record<AdDuration, string> = {
  "7d": "7 days",
  "30d": "30 days",
};

export default function Advertise() {
  useEffect(() => {
    setMeta(
      "Advertise on Zamar | Ad Pricing & Workflow",
      "See ad placements, pricing, and a simple 3-step workflow to advertise on Zamar."
    );

    // Structured data (JSON-LD)
    const items = placements.flatMap((p) =>
      (["7d", "30d"] as AdDuration[]).map((d) => ({
        "@type": "Product",
        name: `Zamar Ad - ${p.label} (${durationLabels[d]})`,
        category: "Online Advertising",
        description: p.blurb,
        brand: { "@type": "Brand", name: "Zamar" },
        offers: {
          "@type": "Offer",
          priceCurrency: "GBP",
          price: (AD_PRICING_GBP[p.key][d] / 100).toFixed(2),
          availability: "https://schema.org/InStock",
          url: `${window.location.origin}/advertise`,
        },
      }))
    );

    const ld = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      itemListElement: items,
    } as const;

    const existing = document.getElementById("ld-json-advertise");
    if (existing) existing.remove();
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "ld-json-advertise";
    script.text = JSON.stringify(ld);
    document.head.appendChild(script);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <header className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-playfair font-bold text-foreground mb-4">
              Choose Your <span className="text-transparent bg-gradient-primary bg-clip-text">Perfect Placement</span>
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Select the ad package that best fits your reach and budget.
            </p>
          </header>

          <section aria-labelledby="pricing" className="max-w-6xl mx-auto mb-14">
            <h2 id="pricing" className="sr-only">Ad Pricing</h2>
            <div className="grid gap-6 md:grid-cols-3 items-stretch auto-rows-fr">
              {placements.map((p) => (
                <Card key={p.key} className={`relative bg-gradient-card border-border hover:border-primary/30 transition-all duration-300 h-full flex flex-col ${p.key === "player" ? "ring-2 ring-primary/20 shadow-gold" : ""}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-primary/10 text-primary"><Megaphone className="w-5 h-5" /></div>
                        <CardTitle className="font-playfair text-foreground">{p.label}</CardTitle>
                      </div>
                      {p.key === "player" && (
                        <Badge variant="secondary">Most Popular</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">{p.blurb}</p>
                    <Badge variant="outline" className="mt-3">{p.example}</Badge>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <ul className="space-y-2 mb-5">
                      <li className="flex items-center gap-2 text-sm text-muted-foreground"><Check className="w-4 h-4 text-primary" /> Professionally reviewed creatives</li>
                      <li className="flex items-center gap-2 text-sm text-muted-foreground"><Check className="w-4 h-4 text-primary" /> Impression & click tracking</li>
                      <li className="flex items-center gap-2 text-sm text-muted-foreground"><Check className="w-4 h-4 text-primary" /> Family-friendly policy compliance</li>
                    </ul>

                    <div className="grid grid-cols-2 gap-3 items-stretch mt-auto">
                      {(["7d", "30d"] as AdDuration[]).map((d) => (
                        <Card key={d} className="p-3 border-dashed h-full flex flex-col justify-between">
                          <div className="text-xs text-muted-foreground">{durationLabels[d]}</div>
                          <div className="text-lg font-semibold text-primary">{formatGBP(AD_PRICING_GBP[p.key][d])}</div>
                          <AdCheckoutButton
                            placement={p.key}
                            duration={d}
                            label={`Buy ${durationLabels[d]}`}
                            className="mt-2 w-full"
                          />
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <section aria-labelledby="workflow" className="max-w-5xl mx-auto">
            <h2 id="workflow" className="text-2xl font-semibold font-playfair text-foreground mb-6 text-center">
              How it works
            </h2>
            <div className="grid md:grid-cols-3 gap-6 items-stretch">
              <Card className="h-full flex flex-col">
                <CardHeader>
                  <div className="p-2 rounded-full bg-primary/10 text-primary w-fit"><Megaphone className="w-5 h-5" /></div>
                  <CardTitle>Select placement</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground text-sm flex-1">
                  Choose a placement and duration that fits your goals. Pay securely via Stripe.
                </CardContent>
              </Card>
              <Card className="h-full flex flex-col">
                <CardHeader>
                  <div className="p-2 rounded-full bg-primary/10 text-primary w-fit"><CalendarClock className="w-5 h-5" /></div>
                  <CardTitle>Submit creative</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground text-sm flex-1">
                  After checkout you’ll receive instructions to provide your banner (PNG/JPG, recommended 728×90 or 300×250 depending on placement).
                </CardContent>
              </Card>
              <Card className="h-full flex flex-col">
                <CardHeader>
                  <div className="p-2 rounded-full bg-primary/10 text-primary w-fit"><ShieldCheck className="w-5 h-5" /></div>
                  <CardTitle>Review & go live</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground text-sm flex-1">
                  We review within 24 hours for faith-friendly compliance. Your ad then goes live for the selected period.
                </CardContent>
              </Card>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
