import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Heart, CreditCard, Calendar, Target, Music, Globe, Church, Info } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import Footer from "@/components/sections/Footer";

const Donate = () => {
  const { toast } = useToast();
  const [selectedAmount, setSelectedAmount] = useState<string>("25");
  const [customAmount, setCustomAmount] = useState<string>("");
  const [donationType, setDonationType] = useState<string>("one-time");
  const [selectedCampaign, setSelectedCampaign] = useState<string>("general");
  const [isProcessing, setIsProcessing] = useState(false);

  const presetAmounts = ["5", "10", "25", "50"];
  
  const campaigns = [
    {
      id: "translation",
      title: "Translation Fund",
      description: "Help us translate songs into different languages to reach more communities worldwide.",
      icon: <Globe className="w-6 h-6" />,
      target: "£2,500",
      current: "£1,200",
      percentage: 48
    },
    {
      id: "production",
      title: "Song Production",
      description: "Support the creation of new custom songs and professional recording equipment.",
      icon: <Music className="w-6 h-6" />,
      target: "£5,000",
      current: "£3,200",
      percentage: 64
    },
    {
      id: "outreach",
      title: "Outreach Projects",
      description: "Enable us to create free songs for churches, ministries, and communities in need.",
      icon: <Church className="w-6 h-6" />,
      target: "£1,500",
      current: "£800",
      percentage: 53
    }
  ];

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
        description: "Please enter a valid donation amount.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      // TODO: Implement Stripe payment integration
      toast({
        title: "Payment Processing",
        description: "Stripe payment integration will be implemented here.",
      });
      
      // Simulate processing
      setTimeout(() => {
        setIsProcessing(false);
        toast({
          title: "Thank You!",
          description: "Your donation helps us create meaningful music.",
        });
      }, 2000);
    } catch (error) {
      setIsProcessing(false);
      toast({
        title: "Error",
        description: "Payment failed. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-primary/20 rounded-full">
                <Heart className="w-16 h-16 text-primary" />
              </div>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-playfair font-bold text-transparent bg-gradient-primary bg-clip-text mb-6">
              Support the Mission
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-inter leading-relaxed">
              Your giving helps us create meaningful music and reach more lives with songs that inspire, heal, and bring hope.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 mb-16">
            {/* Donation Form */}
            <div>
              <Card className="bg-gradient-card border-primary/20">
                <CardHeader>
                  <CardTitle className="text-2xl font-playfair text-foreground flex items-center gap-2">
                    <CreditCard className="w-6 h-6 text-primary" />
                    Make a Donation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* One-Time vs Monthly */}
                  <Tabs value={donationType} onValueChange={setDonationType}>
                    <TabsList className="grid w-full grid-cols-2 bg-accent">
                      <TabsTrigger 
                        value="one-time"
                        className="data-[state=active]:bg-primary data-[state=active]:text-black"
                      >
                        One-Time
                      </TabsTrigger>
                      <TabsTrigger 
                        value="monthly"
                        className="data-[state=active]:bg-primary data-[state=active]:text-black"
                      >
                        <Calendar className="w-4 h-4 mr-2" />
                        Monthly
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>

                  {/* Amount Selection */}
                  <div className="space-y-4">
                    <label className="text-foreground font-inter font-medium text-sm">
                      Donation Amount
                    </label>
                    
                    {/* Preset Amounts */}
                    <div className="grid grid-cols-4 gap-3">
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
                        placeholder="Custom amount"
                        value={customAmount}
                        onChange={(e) => handleCustomAmountChange(e.target.value)}
                        className="pl-8 bg-background border-primary/30 focus:border-primary/60"
                        min="1"
                        step="0.01"
                      />
                    </div>
                  </div>

                  {/* Campaign Selection */}
                  <div className="space-y-3">
                    <label className="text-foreground font-inter font-medium text-sm">
                      Support Campaign (Optional)
                    </label>
                    <div className="space-y-2">
                      <Button
                        variant={selectedCampaign === "general" ? "default" : "outline"}
                        className={`w-full justify-start ${
                          selectedCampaign === "general"
                            ? "bg-primary text-black"
                            : "border-primary/30 text-foreground hover:bg-primary/10"
                        }`}
                        onClick={() => setSelectedCampaign("general")}
                      >
                        General Fund
                      </Button>
                      {campaigns.map((campaign) => (
                        <Button
                          key={campaign.id}
                          variant={selectedCampaign === campaign.id ? "default" : "outline"}
                          className={`w-full justify-start ${
                            selectedCampaign === campaign.id
                              ? "bg-primary text-black"
                              : "border-primary/30 text-foreground hover:bg-primary/10"
                          }`}
                          onClick={() => setSelectedCampaign(campaign.id)}
                        >
                          {campaign.icon}
                          <span className="ml-2">{campaign.title}</span>
                        </Button>
                      ))}
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
                      "Processing..."
                    ) : (
                      <>
                        <Heart className="w-5 h-5 mr-2" />
                        Donate £{getFinalAmount() || "0"} {donationType === "monthly" ? "/month" : ""}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Campaign Display */}
            <div className="space-y-6">
              <h2 className="text-2xl font-playfair font-bold text-foreground flex items-center gap-2">
                <Target className="w-6 h-6 text-primary" />
                Current Campaigns
              </h2>

              {campaigns.map((campaign) => (
                <Card key={campaign.id} className="bg-gradient-card border-primary/20 hover:border-primary/40 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-primary/10 rounded-full flex-shrink-0">
                        <div className="text-primary">
                          {campaign.icon}
                        </div>
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-playfair font-semibold text-foreground">
                            {campaign.title}
                          </h3>
                          <Badge className="bg-primary/20 text-primary border-primary/30">
                            {campaign.percentage}%
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-4 font-inter">
                          {campaign.description}
                        </p>

                        {/* Progress Bar */}
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-primary font-medium">{campaign.current}</span>
                            <span className="text-muted-foreground">of {campaign.target}</span>
                          </div>
                          <div className="w-full h-2 bg-accent rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-primary transition-all duration-300"
                              style={{ width: `${campaign.percentage}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Info Box */}
          <Alert className="bg-primary/10 border-primary/30">
            <Info className="w-5 h-5 text-primary" />
            <AlertDescription className="text-muted-foreground font-inter italic">
              <strong className="text-primary not-italic">Our Mission:</strong> Zamar is a Christian-led platform. Every gift helps us create songs that serve communities, ministries, and people in need around the world.
            </AlertDescription>
          </Alert>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Donate;