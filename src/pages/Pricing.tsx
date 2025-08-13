import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Clock, Music, Cross } from "lucide-react";
import { Link } from "react-router-dom";
import Footer from "@/components/sections/Footer";

// Pricing page component
const Pricing = () => {
  const tiers = [
    {
      name: "Essentials",
      price: "£25",
      popular: false,
      features: [
        "1 song",
        "Single theme",
        "1 genre choice",
        "Delivery in 3–4 days",
        "MP3 download",
        "Basic production"
      ],
      icon: <Music className="w-6 h-6" />,
      description: "Perfect for quick personal messages"
    },
    {
      name: "Signature",
      price: "£50",
      popular: true,
      features: [
        "1 song 2 versions",
        "Multiple themes",
        "PDF lyrics included",
        "Delivery in 48–72 hrs",
        "High-quality MP3",
        "Professional mixing",
        "1 minor revision"
      ],
      icon: <Star className="w-6 h-6" />,
      description: "Most popular choice for special occasions"
    },
    {
      name: "Premier",
      price: "£90",
      popular: false,
      features: [
        "2 songs 2 versions",
        "Complex storytelling",
        "Free major revision",
        "Delivery in 24–48 hrs",
        "Studio-quality production",
        "Multiple format delivery",
        "Instrumental version",
        "Priority support"
      ],
      icon: <Clock className="w-6 h-6" />,
      description: "Premium experience with fastest delivery"
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

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
            {tiers.map((tier, index) => (
              <Card 
                key={tier.name} 
                className={`relative bg-gradient-card border-border hover:border-primary/30 transition-all duration-300 ${
                  tier.popular ? 'ring-2 ring-primary/20 shadow-gold' : ''
                }`}
              >
                {tier.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-primary text-black font-semibold">
                    Most Popular
                  </Badge>
                )}
                
                <CardHeader className="text-center pb-4">
                  <div className="flex justify-center mb-4">
                    <div className={`p-3 rounded-full ${tier.popular ? 'bg-primary/20' : 'bg-accent'}`}>
                      <div className="text-primary">
                        {tier.icon}
                      </div>
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
                      Get Started
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Call to Action Section */}
          <div className="text-center mb-16">
            <Card className="bg-accent/10 border-primary/10 max-w-2xl mx-auto">
              <CardContent className="p-8">
                <h3 className="text-2xl font-playfair font-semibold text-foreground mb-4">
                  Looking to Advertise?
                </h3>
                <p className="text-muted-foreground font-inter mb-6 leading-relaxed">
                  Reach our community of faith-based music lovers with targeted advertising 
                  options that align with your values.
                </p>
                <Button variant="hero" size="lg" asChild>
                  <Link to="/advertise">
                    View Advertising Options
                  </Link>
                </Button>
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