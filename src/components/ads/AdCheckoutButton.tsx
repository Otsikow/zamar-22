import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import type { AdPlacement, AdDuration } from "@/lib/adPricing";
import { toast } from "sonner";

interface AdCheckoutButtonProps {
  placement: AdPlacement;
  duration: AdDuration;
  label?: string;
  className?: string;
}

export function AdCheckoutButton({ placement, duration, label = "Checkout with Stripe", className }: AdCheckoutButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke("create-ad-checkout", {
        body: { placement, duration },
      });

      if (error) throw error;
      if (!data?.url) throw new Error("No checkout URL returned");

      // Open Stripe checkout in a new tab
      window.open(data.url as string, "_blank");
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message ?? "Failed to start checkout");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleClick} disabled={loading} className={className} aria-label="Start ad checkout">
      {loading ? "Redirecting…" : label}
    </Button>
  );
}

export default AdCheckoutButton;
