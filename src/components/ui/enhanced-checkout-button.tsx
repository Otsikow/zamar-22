import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface EnhancedCheckoutButtonProps {
  // Option A: Single product
  priceId?: string;
  quantity?: number;
  
  // Option B: Multiple line items
  lineItems?: Array<{ price: string; quantity?: number }>;
  
  // Checkout configuration
  mode?: "payment" | "subscription";
  successUrl?: string;
  cancelUrl?: string;
  
  // Metadata overrides
  metadata?: Record<string, string>;
  
  // Button props
  label?: string;
  className?: string;
  variant?: "default" | "solid" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "hero" | "premium";
  size?: "default" | "sm" | "lg" | "icon";
  disabled?: boolean;
}

export function EnhancedCheckoutButton({ 
  priceId,
  quantity = 1,
  lineItems,
  mode = "payment",
  successUrl,
  cancelUrl,
  metadata,
  label = "Purchase", 
  className, 
  variant = "solid", 
  size = "default",
  disabled = false
}: EnhancedCheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const handleClick = async () => {
    // Check if user is authenticated
    if (!user) {
      toast.error("Please sign in to make a purchase", {
        description: "You need to be logged in to complete your purchase."
      });
      return;
    }

    try {
      setLoading(true);
      
      // Prepare payload for the enhanced checkout session
      const payload: any = {
        user_id: user.id,
        mode,
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata
      };

      // Add either price_id or line_items
      if (priceId) {
        payload.price_id = priceId;
        payload.quantity = quantity;
      } else if (lineItems && lineItems.length > 0) {
        payload.line_items = lineItems;
      } else {
        throw new Error("Either priceId or lineItems must be provided");
      }

      const { data, error } = await supabase.functions.invoke("create-checkout-session", {
        body: payload,
      });

      if (error) throw error;
      if (!data?.url) throw new Error("No checkout URL returned");

      // Open Stripe checkout in a new tab
      window.open(data.url as string, "_blank");
      
      toast.success("Redirecting to checkout...", {
        description: "Opening Stripe checkout in a new tab."
      });

    } catch (e: any) {
      console.error("Enhanced checkout error:", e);
      toast.error(e?.message ?? "Failed to start checkout");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleClick} 
      disabled={loading || disabled} 
      className={className} 
      variant={variant} 
      size={size}
      aria-label={`Purchase: ${label}`}
    >
      {loading ? "Redirecting…" : label}
    </Button>
  );
}

export default EnhancedCheckoutButton;