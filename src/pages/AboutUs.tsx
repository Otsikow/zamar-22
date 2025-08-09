import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import BackButton from "@/components/ui/back-button";
import Footer from "@/components/sections/Footer";
import { Music, Heart, Globe, Zap, Shield, Users } from "lucide-react";
const AboutUs = () => {
  const navigate = useNavigate();
  return <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <BackButton onClick={() => navigate(-1)} />
        
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
                      <p className="text-muted-foreground font-inter">We serve individuals, organizations, and communities around the world.</p>
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