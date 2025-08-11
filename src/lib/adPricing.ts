export type AdPlacement = "hero" | "player" | "sidebar";
export type AdDuration = "7d" | "30d";

// Amounts in pence (GBP)
export const AD_PRICING_GBP: Record<AdPlacement, Record<AdDuration, number>> = {
  hero: { "7d": 4400, "30d": 9600 },
  player: { "7d": 2800, "30d": 6400 },
  sidebar: { "7d": 2000, "30d": 4800 },
};

export const formatGBP = (pence: number) =>
  new Intl.NumberFormat(undefined, { style: "currency", currency: "GBP" }).format(pence / 100);
