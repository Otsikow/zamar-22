import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, CreditCard, Calendar } from "lucide-react";
import BackButton from "@/components/ui/back-button";
import { useToast } from "@/hooks/use-toast";
import Footer from "@/components/sections/Footer";
import { useTranslation } from "@/contexts/TranslationContext";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const Donate = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [selectedAmount, setSelectedAmount] = useState<string>("25");
  const [customAmount, setCustomAmount] = useState<string>("");
  const [donationType, setDonationType] = useState<string>("one-time");
  const [isProcessing, setIsProcessing] = useState(false);

  const presetAmounts = ["5", "10", "25", "50", "100"];

  const handleAmountSelect = (amount: string) => {
    setSelectedAmount(amount);
    setCustomAmount("");
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    setSelectedAmount("");
  };

  const getFinalAmount = () => {
    return customAmount || selectedAmount;
  };

  const handleDonate = async () => {
    const amount = getFinalAmount();
    if (!amount || parseFloat(amount) < 1) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid donation amount of at least £1.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke("create-donation-checkout", {
        body: {
          amount: Number(amount),
          recurring: donationType === "monthly",
          email: user?.email || "",
        },
      });

      if (error) {
        throw new Error(error.message || "Failed to create checkout");
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (error: any) {
      console.error("Donation error:", error);
      setIsProcessing(false);
      
      toast({
        title: "Donation Error",
        description: `Failed to process donation: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <BackButton />
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-2xl">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-primary/20 rounded-full">
                <Heart className="w-16 h-16 text-primary" />
              </div>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-playfair font-bold text-transparent bg-gradient-primary bg-clip-text mb-6">
              {t('donate.title', 'Support Our Mission')}
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-inter leading-relaxed">
              {t('donate.subtitle', 'Your donation helps us create meaningful music and reach more lives with songs that inspire, heal, and bring hope.')}
            </p>
          </div>

          {/* Donation Form */}
          <Card className="bg-gradient-card border-primary/20">
            <CardHeader>
              <CardTitle className="text-2xl font-playfair text-foreground flex items-center gap-2">
                <CreditCard className="w-6 h-6 text-primary" />
                {t('donate.make_a_donation', 'Make a Donation')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* One-Time vs Monthly */}
              <Tabs value={donationType} onValueChange={setDonationType}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="one-time" className="font-medium">
                    {t('donate.one_time', 'One-Time')}
                  </TabsTrigger>
                  <TabsTrigger value="monthly" className="font-medium">
                    <Calendar className="w-4 h-4 mr-2" />
                    {t('donate.monthly', 'Monthly')}
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Amount Selection */}
              <div className="space-y-4">
                <label className="text-foreground font-inter font-medium text-sm">
                  {t('donate.amount_label', 'Donation Amount')}
                </label>
                
                {/* Preset Amounts */}
                <div className="grid grid-cols-5 gap-3">
                  {presetAmounts.map((amount) => (
                    <Button
                      key={amount}
                      variant={selectedAmount === amount ? "default" : "outline"}
                      className={`${
                        selectedAmount === amount 
                          ? "bg-primary text-black hover:bg-primary/90" 
                          : "border-primary/30 text-foreground hover:bg-primary/10"
                      }`}
                      onClick={() => handleAmountSelect(amount)}
                    >
                      £{amount}
                    </Button>
                  ))}
                </div>

                {/* Custom Amount */}
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                    £
                  </span>
                  <Input
                    type="number"
                    placeholder={t('donate.custom_amount', 'Custom amount')}
                    value={customAmount}
                    onChange={(e) => handleCustomAmountChange(e.target.value)}
                    className="pl-8 bg-background border-primary/30 focus:border-primary/60"
                    min="1"
                    step="0.01"
                  />
                </div>
              </div>

              {/* Donate Button */}
              <Button
                onClick={handleDonate}
                disabled={isProcessing || !getFinalAmount()}
                size="lg"
                className="w-full"
              >
                {isProcessing ? (
                  t('donate.processing', 'Processing...')
                ) : (
                  <>
                    <Heart className="w-5 h-5 mr-2" />
                    {t('donate.button_label', 'Donate')} £{getFinalAmount() || '0'} 
                    {donationType === 'monthly' ? t('donate.per_month', '/month') : ''}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Donate;