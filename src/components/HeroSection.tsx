import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/contexts/TranslationContext";
import { Sparkles, Lightbulb, Radio } from "lucide-react";


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
  onSuggestClick?: () => void;
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
  onSuggestClick,
}: Props) {
  const { t } = useTranslation();
  

  // Default stats with translations
  const defaultStats = [
    { icon: "⭐", text: t('hero.stat1', '500+ Happy Clients') },
    { icon: "⏱️", text: t('hero.stat2', '24–48hr Delivery') },
    { icon: "🙏", text: t('hero.stat3', 'Faith-Based Platform') },
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
              {t('hero.title_line1', titleTop)}
            </span>
            <span className="mt-2 block text-3xl sm:text-4xl md:text-5xl leading-tight text-primary">
              {t('hero.title_line2', titleBottom)}
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg md:text-xl leading-relaxed text-muted-foreground">
            {t('hero.subtitle', blurb)}
          </p>

          {/* CTA */}
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg">
              <Link to={ctaHref}>
                <Sparkles className="h-5 w-5 mr-2" />
                {t('hero.create_song', ctaLabel)}
                <span className="ml-2">→</span>
              </Link>
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              onClick={onSuggestClick}
            >
              <Lightbulb className="h-5 w-5 mr-2" />
              {t('hero.suggest_song', 'Suggest a Song')}
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/radio">
                <Radio className="h-5 w-5 mr-2" />
                {t('hero.radio', 'Radio')}
              </Link>
            </Button>
          </div>

        </div>
      </div>
    </section>
  );
}
