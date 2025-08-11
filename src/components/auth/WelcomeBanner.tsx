import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";

const WelcomeBanner = () => {
  const { user, loading } = useAuth();

  const firstName = useMemo(() => {
    const meta = (user?.user_metadata || {}) as Record<string, unknown>;
    const rawName = (meta["full_name"] as string) || (meta["name"] as string) || (meta["first_name"] as string) || user?.email || "there";
    return (rawName || "there").toString().split(" ")[0];
  }, [user]);

  if (loading || !user) return null;

  return (
    <section aria-label="Personalized welcome" className="container mx-auto px-4 mt-6">
      <Card className="bg-gradient-to-r from-primary/5 via-background to-background border-primary/10">
        <div className="p-4 md:p-6">
          <p className="text-sm text-muted-foreground">Personalized for you</p>
          <h2 className="text-2xl md:text-3xl font-semibold text-foreground">Welcome back, {firstName}</h2>
        </div>
      </Card>
    </section>
  );
};

export default WelcomeBanner;
