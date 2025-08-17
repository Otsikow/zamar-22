import { useMemo, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type Tier = "basic" | "pro" | "premium";

const AMOUNTS: Record<Tier, number> = { 
  basic: 2500,    // £25
  pro: 6000,      // £60  
  premium: 12900  // £129
};

const LABELS: Record<Tier, string> = { 
  basic: "Basic (£25)", 
  pro: "Pro (£60)", 
  premium: "Premium (£129)" 
};

interface UpgradeSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  currentTier: Tier;
}

export function UpgradeSheet({ open, onOpenChange, orderId, currentTier }: UpgradeSheetProps) {
  const [target, setTarget] = useState<Tier | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const options = useMemo(() => {
    const order = ["basic", "pro", "premium"] as Tier[];
    const idx = order.indexOf(currentTier);
    return order.slice(idx + 1);
  }, [currentTier]);

  const delta = useMemo(() => 
    target ? Math.max(0, AMOUNTS[target] - AMOUNTS[currentTier]) : 0, 
    [target, currentTier]
  );

  async function handleUpgrade() {
    if (!target) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-upgrade-session', {
        body: { order_id: orderId, target_tier: target }
      });

      if (error) throw error;
      
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Upgrade error:', error);
      toast({
        title: "Upgrade Failed",
        description: "Failed to start upgrade process. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="max-w-md">
        <SheetHeader>
          <SheetTitle>Upgrade your package</SheetTitle>
        </SheetHeader>

        <div className="grid gap-3 mt-4">
          {options.map(tier => {
            const delta = AMOUNTS[tier] - AMOUNTS[currentTier];
            return (
              <button 
                key={tier}
                onClick={() => setTarget(tier)}
                className={cn(
                  "w-full text-left rounded-2xl border p-4 hover:border-primary transition-colors",
                  target === tier 
                    ? "border-primary ring-2 ring-primary/30 bg-primary/5" 
                    : "border-border"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="text-lg font-semibold">
                    {LABELS[tier].split(" ")[0]} Upgrade
                  </div>
                  <div className="text-lg font-bold text-primary">
                    £{(delta / 100).toFixed(2)}
                  </div>
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Pay the difference and unlock {LABELS[tier]} features.
                </div>
              </button>
            );
          })}
          
          {options.length === 0 && (
            <div className="text-sm text-muted-foreground text-center py-8">
              You're already on the Premium tier.
            </div>
          )}
        </div>

        <SheetFooter className="mt-6">
          <Button 
            disabled={!target || delta <= 0 || loading} 
            onClick={handleUpgrade}
            className="w-full"
          >
            {loading ? "Redirecting..." : `Upgrade for £${(delta / 100).toFixed(2)}`}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}