import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Play, Star, Users, Clock, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import heroImage from "@/assets/hero-music.jpg";
import LiveCounter from "./LiveCounter";
const Hero = () => {
  const {
    user
  } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setIsAdmin(false);
        return;
      }
      try {
        const {
          data,
          error
        } = await supabase.from("admin_users").select("id").eq("user_id", user.id).single();
        if (!error && data) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } catch (error) {
        console.error("Error checking admin status:", error);
        setIsAdmin(false);
      }
    };
    checkAdminStatus();
  }, [user]);
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-hero pt-20">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img src={heroImage} alt="Custom Songs Background" className="w-full h-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
      </div>

      {/* Floating Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary rounded-full animate-float opacity-60" />
        <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-primary rounded-full animate-float animation-delay-1000 opacity-40" />
        <div className="absolute bottom-1/3 left-1/5 w-3 h-3 bg-primary/60 rounded-full animate-float animation-delay-2000" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center max-w-5xl">
        {/* Main Headline */}
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-playfair font-bold text-foreground mb-6 leading-tight">
          Your Story, Your Song{" "}
          <span className="text-transparent bg-gradient-primary bg-clip-text">
            Crafted with Purpose
          </span>
        </h1>

        {/* Subheadline */}
        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8 font-inter leading-relaxed">Zamar creates custom songs for every occasion – weddings, birthdays, churches, businesses – combining faith and technology to deliver powerful music that speaks.</p>

        {/* Stats Row */}
        <div className="flex flex-wrap justify-center items-center gap-6 mb-10 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-primary" />
            <span>500+ Happy Clients</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            <span>24-48hr Delivery</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            <span>Faith-Based Platform</span>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
          <Button size="lg" variant="hero" className="text-lg px-8 py-4 min-w-[200px]" asChild>
            <Link to="/pricing">
              Create Your Song
            </Link>
          </Button>
          <Button size="lg" variant="outline" className="text-lg px-8 py-4 min-w-[200px] group" asChild>
            <Link to="/songs">
              <Play className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
              See Examples
            </Link>
          </Button>
          {isAdmin && (
            <Button size="lg" variant="secondary" className="text-lg px-8 py-4 min-w-[200px] bg-primary/20 border-primary/30 text-primary hover:bg-primary/30" asChild>
              <Link to="/admin">
                <Settings className="w-5 h-5 mr-2" />
                Dashboard
              </Link>
            </Button>
          )}
        </div>

        {/* Professional Referral Bonus Section */}
        <div className="mb-12 px-4">
          <div className="relative bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 backdrop-blur-sm border border-primary/20 rounded-2xl p-6 md:p-8 max-w-2xl mx-auto shadow-xl">
            {/* Decorative Elements */}
            <div className="absolute -top-2 -right-2 w-4 h-4 bg-primary/30 rounded-full animate-pulse" />
            <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-primary/20 rounded-full animate-pulse animation-delay-1000" />
            
            {/* Content */}
            <div className="text-center space-y-4">
              {/* Icon and Main Title */}
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-xl">💰</span>
                </div>
                <h3 className="text-xl md:text-2xl font-playfair font-semibold text-foreground">
                  Earn Referral Bonuses
                </h3>
              </div>
              
              {/* Subtitle */}
              <h4 className="text-lg md:text-xl text-primary font-medium">
                Start Your Income Stream
              </h4>
              
              {/* Description */}
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed max-w-lg mx-auto">
                Perfect for network marketers and influencers. Calculate your potential earnings 
                and turn your network into a sustainable income source.
              </p>
              
              {/* CTA Button */}
              <Button 
                size="lg" 
                className="mt-6 bg-gradient-primary text-black font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border-0"
                asChild
              >
                <Link to="/referral">
                  Calculate Your Earnings
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Live Counter */}
        <LiveCounter />
      </div>

      {/* Bottom Gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};
export default Hero;