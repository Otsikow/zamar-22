import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/contexts/TranslationContext";

export type HeroStat = { icon: string; text: string };

type Props = {
  titleTop?: string;
  titleBottom?: string;
  blurb?: string;
  stats?: HeroStat[];
  ctaHref?: string;
  ctaLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  bgImageUrl?: string; // optional
};

export default function HeroSection({
  titleTop = "Your Story, Your Song",
  titleBottom = "Crafted with Purpose",
  blurb =
    "Zamar creates custom songs for every occasion – weddings, birthdays, churches, businesses – combining faith and technology to deliver powerful music that speaks.",
  stats,
  ctaHref = "/request-song",
  ctaLabel = "Create Your Song",
  secondaryHref = "/about",
  secondaryLabel = "How it works",
  bgImageUrl,
}: Props) {
  const { t } = useTranslation();

  // Default stats with translations
  const defaultStats = [
    { icon: "⭐", text: t('hero.stat_clients', '500+ Happy Clients') },
    { icon: "⏱️", text: t('hero.stat_delivery', '24–48hr Delivery') },
    { icon: "🙏", text: t('hero.stat_faith', 'Faith‑Based Platform') },
  ];

  const heroStats = stats || defaultStats;

  return (
    <section className="relative overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 bg-gradient-to-b from-primary/10 via-background to-background dark:from-primary/15 dark:via-background dark:to-background"
        aria-hidden
      />
      {bgImageUrl && (
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url(${bgImageUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
          aria-hidden
        />
      )}

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 pb-12 sm:pt-20 sm:pb-16">
        {/* Content */}
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="font-extrabold tracking-tight">
            <span className="block text-4xl sm:text-5xl md:text-6xl leading-tight text-foreground">
              {t('hero.title_top', titleTop)}
            </span>
            <span className="mt-2 block text-3xl sm:text-4xl md:text-5xl leading-tight text-primary">
              {t('hero.title_bottom', titleBottom)}
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg md:text-xl leading-relaxed text-muted-foreground">
            {t('hero.description', blurb)}
          </p>

          {/* CTA */}
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg">
              <Link to={ctaHref}>
                {t('hero.cta_primary', ctaLabel)}
                <span className="ml-2">→</span>
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to={secondaryHref}>{t('hero.cta_secondary', secondaryLabel)}</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/radio">{t('hero.radio_button', 'Radio')}</Link>
            </Button>
          </div>

          {/* Badges */}
          <ul className="mt-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {heroStats.map((s, i) => (
              <li
                key={i}
                className="flex items-center gap-3 rounded-xl border border-border bg-card/70 backdrop-blur px-4 py-3 shadow-sm"
              >
                <span className="text-xl">{s.icon}</span>
                <span className="text-sm font-medium text-foreground">{s.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
