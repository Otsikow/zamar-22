import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Listens for Supabase SIGNED_IN events and shows a one-time welcome toast
const WelcomeOnSignIn = () => {
  const { toast } = useToast();
  const hasWelcomedRef = useRef(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user && !hasWelcomedRef.current) {
        hasWelcomedRef.current = true;
        const meta = (session.user.user_metadata || {}) as Record<string, unknown>;
        const rawName = (meta["full_name"] as string) || (meta["name"] as string) || (meta["first_name"] as string) || session.user.email || "there";
        const firstName = (rawName || "").toString().split(" ")[0];
        toast({
          title: `Welcome back, ${firstName}!`,
          description: "Glad to see you again.",
        });
      }
    });

    return () => subscription.unsubscribe();
  }, [toast]);

  return null;
};

export default WelcomeOnSignIn;
