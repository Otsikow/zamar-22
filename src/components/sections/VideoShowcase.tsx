import { Button } from "@/components/ui/button";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Link } from "react-router-dom";
import { useTranslation } from "@/contexts/TranslationContext";

const howItWorksUrl = "https://www.youtube.com/embed/GG34m4WIEys";
const testimonials = [
  "https://www.youtube.com/embed/Oh_d3zvQG6U",
  // "https://www.youtube.com/embed/VIDEO_ID_3", // Hidden until real video ID provided
  // "https://www.youtube.com/embed/VIDEO_ID_4", // Hidden until real video ID provided
].filter(url => !url.includes('VIDEO_ID_'));

const VideoShowcase = () => {
  const { t } = useTranslation();
  return (
    <section
      aria-labelledby="video-showcase-title"
      className="w-full bg-background border-t border-border/50"
    >
      <div className="container mx-auto px-4 py-8 md:py-10 lg:py-12">
        {/* Heading + Two Column Intro */}
        <header className="mb-6 md:mb-8">
          <h2
            id="video-showcase-title"
            className="font-playfair font-bold text-primary text-xl md:text-2xl"
          >
            {t('video.how_zamar_works', 'How Zamar Works')}
          </h2>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-start">
          {/* Left: Main video */}
          <div className="w-full">
            <AspectRatio ratio={16 / 9}>
              <iframe
                title={t('video.how_zamar_works', 'How Zamar Works')}
                src={howItWorksUrl}
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="w-full h-full rounded-xl overflow-hidden border border-border/50"
              />
            </AspectRatio>
          </div>

          {/* Right: Description + CTA */}
          <article className="space-y-4">
            <p className="text-foreground/90">
              {t('video.description', 'Discover how Zamar curates, streams, and inspires. This short overview walks through our radio experience, playlists, and the heart behind the music.')}
            </p>
            <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Link to="/about">{t('video.learn_more', 'Learn More About Zamar')}</Link>
            </Button>
          </article>
        </div>

        {/* Testimonials */}
        <div className="mt-10 md:mt-12">
          <h3 className="font-playfair font-semibold text-primary mb-4 md:mb-6 text-lg md:text-xl">
            {t('video.testimonials_title', 'What People Are Saying')}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {testimonials.map((url, i) => (
              <div
                key={i}
                className="rounded-xl border border-border/50 shadow-sm hover:shadow-md transition-shadow hover:scale-[1.01] duration-200 will-change-transform bg-card/40"
              >
                <AspectRatio ratio={16 / 9}>
                  <iframe
                    title={`Testimonial video ${i + 1}`}
                    src={url}
                    loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="w-full h-full rounded-xl overflow-hidden"
                  />
                </AspectRatio>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default VideoShowcase;
