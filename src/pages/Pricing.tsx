import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Clock, Music, Cross, Heart, Users, Download, Megaphone } from "lucide-react";
import { Link } from "react-router-dom";
import Footer from "@/components/sections/Footer";

// Pricing page component
const Pricing = () => {
  const customSongTiers = [
    {
      name: "Essentials",
      price: "£25",
      popular: false,
      badge: null,
      features: [
        "1 song",
        "Single theme",
        "1 genre choice",
        "Delivery in 3–4 days",
        "MP3 download",
        "Basic production"
      ],
      icon: Music,
      description: "Perfect for quick personal messages",
      cta: "Order Now"
    },
    {
      name: "Signature",
      price: "£60",
      popular: true,
      badge: "Most Popular",
      features: [
        "1 song in 2 versions",
        "Multiple themes",
        "PDF lyrics included",
        "Delivery in 48–72 hrs",
        "High-quality MP3",
        "Professional mixing",
        "1 minor revision"
      ],
      icon: Star,
      description: "Most popular choice for special occasions",
      cta: "Order Now"
    },
    {
      name: "Premier",
      price: "£129",
      popular: false,
      badge: "Limited Availability",
      features: [
        "2 songs in 2 versions",
        "Complex storytelling",
        "Free major revision",
        "Delivery in 24–48 hrs",
        "Studio-quality production",
        "MP3 + WAV + Instrumental versions",
        "Priority support"
      ],
      icon: Clock,
      description: "Premium experience with fastest delivery",
      cta: "Order Now"
    }
  ];

  const supporterPlans = [
    {
      name: "Supporter Lifetime",
      price: "£49",
      subtitle: "Only first 500 supporters",
      features: [
        "Ad-free streaming",
        "Unlimited downloads (songs & lyrics)",
        "Playlist creation",
        "Song suggestion submissions",
        "Access to My Library"
      ],
      cta: "Become a Supporter"
    },
    {
      name: "Standard",
      price: "£6/month",
      yearlyPrice: "£60/year",
      savings: "save £12",
      features: [
        "All Supporter perks",
        "Exclusive playlists",
        "Early access to new releases",
        "Behind-the-scenes content"
      ],
      cta: "Subscribe Now"
    },
    {
      name: "Family/Church",
      price: "£12/month",
      yearlyPrice: "£120/year",
      subtitle: "up to 5 accounts",
      features: [
        "All Standard perks for multiple users"
      ],
      cta: "Subscribe Now"
    }
  ];

  const otherServices = [
    {
      category: "Advertiser Packages",
      plans: [
        { name: "Banner Ads", price: "£150/month" },
        { name: "Audio Ads", price: "£300/month" },
        { name: "Combo (Banner + Audio)", price: "£400/month" }
      ],
      cta: "Advertise with Us"
    },
    {
      category: "Pay-Per-Download",
      plans: [
        { name: "Single Song", price: "£1.29" },
        { name: "Album", price: "£4.99" },
        { name: "Bundle: 10 songs", price: "£9.99" }
      ],
      cta: "Buy Now"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header Section */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-playfair font-bold text-foreground mb-6 flex items-center justify-center gap-3">
              <Star className="w-10 h-10 md:w-12 md:h-12 text-primary" />
              Choose Your{" "}
              <span className="text-transparent bg-gradient-primary bg-clip-text">
                Perfect Package
              </span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-inter">
              Every song is crafted with care, love, and faith. Select the package 
              that best fits your needs and occasion.
            </p>
          </div>

          {/* Custom Song Packages */}
          <div className="mb-20">
            <h2 className="text-3xl font-playfair font-bold text-center text-foreground mb-2">
              Custom Song Packages
            </h2>
            <p className="text-center text-muted-foreground mb-12 font-inter">
              Personalized songs created just for you
            </p>
            
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
               {customSongTiers.map((tier, index) => {
                 const IconComponent = tier.icon;
                 return (
                <Card 
                  key={tier.name} 
                  className={`relative bg-gradient-card border-border hover:border-primary/30 transition-all duration-300 ${
                    tier.popular ? 'ring-2 ring-primary/20 shadow-gold' : ''
                  }`}
                >
                  {tier.badge && (
                    <Badge className={`absolute -top-3 left-1/2 transform -translate-x-1/2 font-semibold ${
                      tier.popular 
                        ? 'bg-gradient-primary text-black' 
                        : 'bg-accent text-accent-foreground border border-primary/30'
                    }`}>
                      {tier.badge}
                    </Badge>
                  )}
                  
                  <CardHeader className="text-center pb-4">
                     <div className="flex justify-center mb-4">
                       <div className={`p-3 rounded-full ${tier.popular ? 'bg-primary/30' : 'bg-primary/20'}`}>
                         <IconComponent className="w-6 h-6 text-primary" />
                       </div>
                     </div>
                    <CardTitle className="text-2xl font-playfair text-foreground">
                      {tier.name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground font-inter">
                      {tier.description}
                    </p>
                    <div className="text-4xl font-bold text-primary mt-4">
                      {tier.price}
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <ul className="space-y-3 mb-8">
                      {tier.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center gap-3">
                          <Check className="w-4 h-4 text-primary flex-shrink-0" />
                          <span className="text-sm font-inter text-muted-foreground">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                    
                    <Button 
                      className="w-full" 
                      variant={tier.popular ? "hero" : "outline"}
                      size="lg"
                      asChild
                    >
                      <Link to={`/request?tier=${tier.name.toLowerCase()}`}>
                        {tier.cta}
                      </Link>
                    </Button>
                  </CardContent>
                 </Card>
                 );
               })}
            </div>
          </div>

          {/* Supporter & Subscription Plans */}
          <div className="mb-20">
            <h2 className="text-3xl font-playfair font-bold text-center text-foreground mb-2">
              Supporter & Subscription Plans
            </h2>
            <p className="text-center text-muted-foreground mb-12 font-inter">
              Ongoing access to our complete music library and exclusive content
            </p>
            
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {supporterPlans.map((plan, index) => (
                <Card 
                  key={plan.name} 
                  className="relative bg-gradient-card border-border hover:border-primary/30 transition-all duration-300"
                >
                  <CardHeader className="text-center pb-4">
                    <div className="flex justify-center mb-4">
                       <div className="p-3 rounded-full bg-primary/20">
                         {index === 0 ? (
                           <Heart className="w-6 h-6 text-primary" />
                         ) : (
                           <Users className="w-6 h-6 text-primary" />
                         )}
                       </div>
                    </div>
                    <CardTitle className="text-2xl font-playfair text-foreground">
                      {plan.name}
                    </CardTitle>
                    {plan.subtitle && (
                      <p className="text-sm text-primary font-semibold font-inter">
                        {plan.subtitle}
                      </p>
                    )}
                    <div className="mt-4">
                      <div className="text-4xl font-bold text-primary">
                        {plan.price}
                      </div>
                      {plan.yearlyPrice && (
                        <div className="text-sm text-muted-foreground">
                          or {plan.yearlyPrice} {plan.savings && `(${plan.savings})`}
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center gap-3">
                          <Check className="w-4 h-4 text-primary flex-shrink-0" />
                          <span className="text-sm font-inter text-muted-foreground">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                    
                    <Button 
                      className="w-full" 
                      variant="outline"
                      size="lg"
                    >
                      {plan.cta}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Advertisers, Donations & Downloads */}
          <div className="mb-20">
            <h2 className="text-3xl font-playfair font-bold text-center text-foreground mb-12">
              Additional Services
            </h2>
            
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-12">
              {otherServices.map((service, index) => (
                <Card key={service.category} className="bg-gradient-card border-border">
                  <CardHeader className="text-center pb-4">
                     <div className="flex justify-center mb-4">
                       <div className="p-3 rounded-full bg-primary/20">
                         {service.category === "Advertiser Packages" ? (
                           <Megaphone className="w-6 h-6 text-primary" />
                         ) : (
                           <Download className="w-6 h-6 text-primary" />
                         )}
                       </div>
                     </div>
                    <CardTitle className="text-xl font-playfair text-foreground">
                      {service.category}
                    </CardTitle>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-3 mb-6">
                      {service.plans.map((plan, planIndex) => (
                        <div key={planIndex} className="flex justify-between items-center py-2 border-b border-border/50 last:border-0">
                          <span className="text-sm font-inter text-muted-foreground">
                            {plan.name}
                          </span>
                          <span className="text-sm font-semibold text-primary">
                            {plan.price}
                          </span>
                        </div>
                      ))}
                    </div>
                    
                    <Button 
                      className="w-full" 
                      variant="outline"
                      size="lg"
                      asChild
                    >
                      <Link to={service.category === "Advertiser Packages" ? "/advertise" : "/donate"}>
                        {service.cta}
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Donations Section */}
            <Card className="bg-accent/10 border-primary/10 max-w-2xl mx-auto">
              <CardContent className="p-8 text-center">
                <div className="flex justify-center mb-4">
                  <div className="p-3 rounded-full bg-primary/10">
                    <Heart className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <h3 className="text-2xl font-playfair font-semibold text-foreground mb-4">
                  Support Our Ministry
                </h3>
                <p className="text-muted-foreground font-inter mb-6 leading-relaxed">
                  Help us continue creating faith-based music, supporting translation projects, 
                  and spreading the Gospel through music worldwide.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button variant="hero" size="lg" asChild>
                    <Link to="/donate">
                      Give Now
                    </Link>
                  </Button>
                  <Button variant="outline" size="lg" asChild>
                    <Link to="/donate?type=recurring">
                      Monthly Giving
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Faith-Based Notice */}
          <div className="max-w-4xl mx-auto">
            <Card className="bg-accent/20 border-primary/20">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-primary/10 rounded-full flex-shrink-0">
                    <Cross className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-playfair font-semibold text-foreground mb-2">
                      Faith-Based Platform
                    </h3>
                    <p className="text-muted-foreground font-inter leading-relaxed">
                      We are a Christian-led platform committed to creating meaningful music 
                      that honors our values. We may respectfully decline songs that conflict 
                      with our Christian principles, including content that promotes hate, 
                      profanity, violence, or anti-biblical messages.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Pricing;