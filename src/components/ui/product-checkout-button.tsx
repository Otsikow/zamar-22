import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface ProductCheckoutButtonProps {
  productId: string;
  label?: string;
  className?: string;
  variant?: "default" | "solid" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "hero" | "premium";
  size?: "default" | "sm" | "lg" | "icon";
  disabled?: boolean;
}

export function ProductCheckoutButton({ 
  productId, 
  label = "Purchase", 
  className, 
  variant = "solid", 
  size = "default",
  disabled = false
}: ProductCheckoutButtonProps) {
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
      
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { product_id: productId },
      });

      if (error) throw error;
      if (!data?.url) throw new Error("No checkout URL returned");

      // Open Stripe checkout in a new tab
      window.open(data.url as string, "_blank");
    } catch (e: any) {
      console.error("Checkout error:", e);
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

export default ProductCheckoutButton;