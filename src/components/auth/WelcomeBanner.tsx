import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/contexts/TranslationContext";
import { Card } from "@/components/ui/card";

const WelcomeBanner = () => {
  const { user, loading } = useAuth();
  const { t } = useTranslation();

  const firstName = useMemo(() => {
    const meta = (user?.user_metadata || {}) as Record<string, unknown>;
    const rawName = (meta["full_name"] as string) || (meta["name"] as string) || (meta["first_name"] as string) || user?.email || "there";
    return (rawName || "there").toString().split(" ")[0];
  }, [user]);

  if (loading || !user) return null;

  return (
    <section aria-label="Personalized welcome" className="container mx-auto px-4 mt-6">
      <Card className="bg-gradient-to-r from-primary/5 via-background to-background border-primary/10">
        <div className="flex flex-col gap-2 px-4 py-6 sm:px-6 sm:py-8">
          <p className="text-xs sm:text-sm text-muted-foreground font-medium tracking-wide uppercase">{t('welcome.personalized', 'Personalized for you')}</p>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-foreground leading-tight">{t('welcome.welcome_back', 'Welcome back')}, {firstName}</h2>
        </div>
      </Card>
    </section>
  );
};

export default WelcomeBanner;
