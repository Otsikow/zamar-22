import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Check, Star, Zap, Crown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type Tier = "basic" | "pro" | "premium";

const TIERS: Record<Tier, { 
  name: string; 
  price: string; 
  priceValue: number;
  description: string;
  features: string[];
  icon: React.ComponentType<any>;
  gradient: string;
  popular?: boolean;
}> = {
  basic: { 
    name: "Basic", 
    price: "£25", 
    priceValue: 2500,
    description: "Perfect for simple requests",
    features: ["1 verse + hook", "1 revision", "48h delivery", "Basic arrangement"],
    icon: Check,
    gradient: "from-blue-400 to-blue-600"
  },
  pro: { 
    name: "Pro", 
    price: "£60", 
    priceValue: 6000,
    description: "Most popular choice",
    features: ["Full song structure", "2 revisions", "48h delivery", "Professional mix", "Lyrics PDF"],
    icon: Star,
    gradient: "from-amber-400 to-amber-600",
    popular: true
  },
  premium: { 
    name: "Premium", 
    price: "£129", 
    priceValue: 12900,
    description: "Complete production package",
    features: ["Full arrangement", "3 revisions", "Priority 24h delivery", "Commercial license", "Stems included", "Cover art"],
    icon: Crown,
    gradient: "from-purple-400 to-purple-600"
  },
};

interface PackagePickerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PackagePickerSheet({ open, onOpenChange }: PackagePickerSheetProps) {
  const [selected, setSelected] = useState<Tier | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  async function handleContinue() {
    if (!selected) return;
    
    setLoading(true);
    try {
      // Create order in database first
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: order, error: orderError } = await supabase
        .from('custom_song_orders')
        .insert({
          user_id: user.id,
          tier: selected,
          stripe_price_id: `price_${selected}`, // Will be replaced with real price IDs
          amount: TIERS[selected].priceValue,
          currency: 'gbp',
          status: 'pending'
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create checkout session
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { 
          order_id: order.id,
          tier: selected,
          amount: TIERS[selected].priceValue
        }
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
        onOpenChange(false);
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to start checkout process",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-2xl font-playfair text-center mb-2">
            Choose Your Custom Song Package
          </SheetTitle>
          <p className="text-muted-foreground text-center">
            Select the perfect package for your custom song request
          </p>
        </SheetHeader>

        <div className="grid gap-4 mt-6">
          {(Object.keys(TIERS) as Tier[]).map((key) => {
            const tier = TIERS[key];
            const active = selected === key;
            const Icon = tier.icon;
            
            return (
              <div key={key} className="relative">
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                    <div className="bg-gradient-to-r from-amber-400 to-amber-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                      Most Popular
                    </div>
                  </div>
                )}
                <button
                  onClick={() => setSelected(key)}
                  className={cn(
                    "w-full text-left rounded-2xl border-2 p-6 transition-all duration-300 relative overflow-hidden",
                    active 
                      ? "border-primary ring-2 ring-primary/30 shadow-lg" 
                      : "border-border hover:border-primary/50",
                    tier.popular && "pt-8"
                  )}
                >
                  {/* Background gradient effect */}
                  <div className={cn(
                    "absolute inset-0 opacity-5 bg-gradient-to-br",
                    tier.gradient
                  )} />
                  
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br",
                          tier.gradient
                        )}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-playfair font-bold text-foreground">
                            {tier.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {tier.description}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-foreground">
                          {tier.price}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          one-time
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                      {tier.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                          <span className="text-muted-foreground">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </button>
              </div>
            );
          })}
        </div>

        <div className="mt-6 p-4 bg-muted/30 rounded-lg">
          <p className="text-xs text-muted-foreground text-center">
            Need help choosing? {" "}
            <a href="/pricing" className="text-primary hover:underline">
              Compare all features
            </a>
            {" "} or contact our team for guidance.
          </p>
        </div>

        <SheetFooter className="mt-6 gap-3">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button 
            disabled={!selected || loading} 
            onClick={handleContinue}
            className="min-w-[140px]"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing...
              </div>
            ) : (
              "Continue to Checkout"
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}