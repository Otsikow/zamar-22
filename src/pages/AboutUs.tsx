import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import Footer from "@/components/sections/Footer";
import { Music, Heart, Globe, Zap, Shield, Users, UserCheck, Building2, Church, Briefcase } from "lucide-react";
const AboutUs = () => {
  const [selectedCategory, setSelectedCategory] = useState("individual");

  const serviceCategories = [
    {
      id: "individual",
      label: "Individual",
      description: "Personal songs for special moments",
      icon: UserCheck
    },
    {
      id: "business", 
      label: "Business",
      description: "Corporate anthems and marketing jingles",
      icon: Building2
    },
    {
      id: "ministry",
      label: "Ministry",
      description: "Worship songs and faith-based content",
      icon: Church
    },
    {
      id: "organization",
      label: "Organization",
      description: "Event themes and institutional music",
      icon: Briefcase
    }
  ];
  return <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">        
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-playfair font-bold text-foreground">
              About Us
            </h1>
            <p className="text-xl text-muted-foreground font-inter max-w-2xl mx-auto">
              A Spirit-led, mission-driven platform creating custom songs for every occasion
            </p>
          </div>

          {/* Who We Are */}
          <Card className="border-primary/20">
            <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <Music className="w-8 h-8 text-primary" />
                <h2 className="text-3xl font-playfair font-bold text-foreground">Who We Are</h2>
              </div>
              <div className="space-y-4 text-muted-foreground font-inter leading-relaxed">
                <p>
                  Zamar is a Spirit-led, mission-driven platform that creates custom songs for every occasion — from weddings and birthdays to churches, campaigns, and businesses. We are more than a music platform. We are a movement — combining creative excellence with advanced technology to help people tell their stories, celebrate moments, and glorify God through sound.
                </p>
                <p>
                  At our core, we are a Christian organization, committed to honoring God in everything we create. We serve everyone with love and excellence, but we also uphold the right to respectfully decline requests that go against our beliefs.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* What We Offer */}
          <Card className="border-primary/20">
            <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <Heart className="w-8 h-8 text-primary" />
                <h2 className="text-3xl font-playfair font-bold text-foreground">What We Offer</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-3 flex-shrink-0"></div>
                    <div>
                      <h3 className="font-inter font-semibold text-foreground mb-2">Custom Songs for All Occasions</h3>
                      <p className="text-muted-foreground font-inter">Personalised songs created just for you — fast, affordable, and meaningful.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-3 flex-shrink-0"></div>
                    <div>
                      <h3 className="font-inter font-semibold text-foreground mb-2">Gospel-Centered Excellence</h3>
                      <p className="text-muted-foreground font-inter">Faith-friendly music available for churches, ministries, and families.</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-3 flex-shrink-0"></div>
                    <div>
                      <h3 className="font-inter font-semibold text-foreground mb-2">Global Reach</h3>
                      <p className="text-muted-foreground font-inter">We serve individuals, organisations, and communities around the world.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-3 flex-shrink-0"></div>
                    <div>
                      <h3 className="font-inter font-semibold text-foreground mb-2">AI-Powered Creation</h3>
                      <p className="text-muted-foreground font-inter">We use cutting-edge tools and songwriting expertise to deliver quality in record time.</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Why Zamar */}
          <Card className="border-primary/20">
            <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <Globe className="w-8 h-8 text-primary" />
                <h2 className="text-3xl font-playfair font-bold text-foreground">Why Zamar?</h2>
              </div>
              <p className="text-muted-foreground font-inter leading-relaxed">
                "Zamar" is a Hebrew word meaning "to make music in praise to God." Our name reflects our commitment to creativity that honors the Lord and brings joy to people's lives. Whether you're commissioning a love song, an anthem for a cause, or a worship track — we'll make it beautiful, purposeful, and powerful.
              </p>
            </CardContent>
          </Card>

          {/* Mission & Values */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Mission */}
            <Card className="border-primary/20">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <Zap className="w-8 h-8 text-primary" />
                  <h2 className="text-2xl font-playfair font-bold text-foreground">Our Mission</h2>
                </div>
                <p className="text-muted-foreground font-inter leading-relaxed">
                  To become the world's most trusted platform for custom song creation — one that is affordable, accessible, and aligned with Kingdom values.
                </p>
              </CardContent>
            </Card>

            {/* Values */}
            <Card className="border-primary/20">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <Shield className="w-8 h-8 text-primary" />
                  <h2 className="text-2xl font-playfair font-bold text-foreground">Our Values</h2>
                </div>
                <div className="space-y-3">
                  <div>
                    <h3 className="font-inter font-semibold text-foreground">Faith</h3>
                    <p className="text-sm text-muted-foreground">We honor God in every project.</p>
                  </div>
                  <div>
                    <h3 className="font-inter font-semibold text-foreground">Creativity</h3>
                    <p className="text-sm text-muted-foreground">Every song is unique, powerful, and made with love.</p>
                  </div>
                  <div>
                    <h3 className="font-inter font-semibold text-foreground">Integrity</h3>
                    <p className="text-sm text-muted-foreground">We do what's right, even when it's not popular.</p>
                  </div>
                  <div>
                    <h3 className="font-inter font-semibold text-foreground">Speed + Quality</h3>
                    <p className="text-sm text-muted-foreground">Fast doesn't mean rushed. We deliver both excellence and efficiency.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Service Categories */}
          <Card className="border-primary/20">
            <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <Users className="w-8 h-8 text-primary" />
                <h2 className="text-3xl font-playfair font-bold text-foreground">Who Do We Serve?</h2>
              </div>
              <p className="text-muted-foreground font-inter mb-6">
                Select the category that best describes you to learn more about our tailored services:
              </p>
              
              <RadioGroup 
                value={selectedCategory} 
                onValueChange={setSelectedCategory}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                {serviceCategories.map((category) => {
                  const IconComponent = category.icon;
                  return (
                    <div key={category.id} className="relative">
                      <RadioGroupItem
                        value={category.id}
                        id={category.id}
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor={category.id}
                        className="flex items-start gap-4 p-6 rounded-lg border-2 border-border cursor-pointer transition-all duration-200 peer-checked:border-primary peer-checked:bg-primary/5 hover:border-primary/50 hover:bg-accent/50"
                      >
                        <div className="flex-shrink-0 p-2 rounded-full bg-primary/10 peer-checked:bg-primary/20">
                          <IconComponent className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-inter font-semibold text-foreground mb-1">
                            {category.label}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {category.description}
                          </p>
                        </div>
                        <div className="w-4 h-4 rounded-full border-2 border-muted-foreground peer-checked:border-primary peer-checked:bg-primary flex-shrink-0 mt-1">
                          <div className="w-full h-full rounded-full bg-primary scale-0 peer-checked:scale-50 transition-transform duration-200"></div>
                        </div>
                      </Label>
                    </div>
                  );
                })}
              </RadioGroup>
              
              {/* Selected Category Details */}
              <div className="mt-6 p-4 bg-accent/30 rounded-lg border border-primary/20">
                <h4 className="font-inter font-semibold text-foreground mb-2">
                  {serviceCategories.find(cat => cat.id === selectedCategory)?.label} Services
                </h4>
                <p className="text-sm text-muted-foreground">
                  {selectedCategory === "individual" && "We create personalized songs for weddings, anniversaries, birthdays, and other special personal celebrations."}
                  {selectedCategory === "business" && "From company anthems to marketing jingles, we help businesses tell their story through music."}
                  {selectedCategory === "ministry" && "Faith-based music creation for churches, ministries, and Christian organizations."}
                  {selectedCategory === "organization" && "Custom music for events, campaigns, non-profits, and institutional celebrations."}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Join the Movement */}
          <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
            <CardContent className="p-8 text-center">
              <div className="flex items-center justify-center gap-3 mb-6">
                <Users className="w-8 h-8 text-primary" />
                <h2 className="text-3xl font-playfair font-bold text-foreground">Join the Movement</h2>
              </div>
              <p className="text-muted-foreground font-inter leading-relaxed mb-6">
                Whether you're a supporter, a ministry, a business, or just someone with a story to tell — Zamar is here for you.
              </p>
              <div className="flex flex-wrap justify-center gap-4 text-lg font-inter">
                <span className="flex items-center gap-2">
                  <span>🎧</span>
                  <span className="text-foreground font-semibold">Explore.</span>
                </span>
                <span className="flex items-center gap-2">
                  <span>🎶</span>
                  <span className="text-foreground font-semibold">Create.</span>
                </span>
                <span className="flex items-center gap-2">
                  <span>💬</span>
                  <span className="text-foreground font-semibold">Share.</span>
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <Footer />
    </div>;
};
export default AboutUs;