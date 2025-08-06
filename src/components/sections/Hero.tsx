
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Play, Star, Users, Clock, Settings, Radio, Heart, ExternalLink, Copy, DollarSign, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import heroImage from "@/assets/hero-music.jpg";
import LiveCounter from "./LiveCounter";
import { useToast } from "@/hooks/use-toast";

const Hero = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [referralCode, setReferralCode] = useState('');

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setIsAdmin(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from("admin_users")
          .select("id")
          .eq("user_id", user.id)
          .single();

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

  useEffect(() => {
    if (user) {
      // Generate referral code from user ID
      const code = user.id.slice(-8).toUpperCase();
      setReferralCode(code);
    }
  }, [user]);

  const copyReferralLink = () => {
    const referralLink = `https://zamarsongs.com/auth?ref=${referralCode}`;
    navigator.clipboard.writeText(referralLink);
    toast({
      title: "Link copied!",
      description: "Your referral link has been copied to clipboard"
    });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-hero pt-20">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroImage}
          alt="Custom Songs Background"
          className="w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
      </div>

      {/* Floating Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary rounded-full animate-float opacity-60" />
        <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-primary rounded-full animate-float animation-delay-1000 opacity-40" />
        <div className="absolute bottom-1/3 left-1/5 w-3 h-3 bg-primary/60 rounded-full animate-float animation-delay-2000" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center max-w-6xl">
        {/* Main Headline */}
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-playfair font-bold text-foreground mb-6 leading-tight">
          Your Story, Your Song
          <br />
          <span className="text-transparent bg-gradient-primary bg-clip-text">
            Crafted with Purpose
          </span>
        </h1>

        {/* Subheadline */}
        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8 font-inter leading-relaxed">
          Zamar creates custom songs for every occasion – weddings, birthdays, churches, businesses – combining faith and technology to deliver powerful music that speaks.
        </p>

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
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
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
          <Button size="lg" variant="outline" className="text-lg px-8 py-4 min-w-[200px] group" asChild>
            <Link to="/radio">
              <Radio className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
              Radio
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

        {/* Two Column Layout for Cards */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12 max-w-6xl mx-auto">
          {/* Support Our Mission Section */}
          <div className="relative bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 h-full flex flex-col">
            <div className="text-center space-y-6 flex-grow">
              <div className="flex items-center justify-center mb-6">
                <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-lg">
                  <Heart className="w-8 h-8 text-black" />
                </div>
              </div>
              
              <div className="space-y-4 flex-grow">
                <h3 className="text-2xl font-playfair font-bold text-foreground">
                  Support Our Mission
                </h3>
                
                <h4 className="text-lg text-primary font-semibold">
                  Empowering Communities Through Music
                </h4>
                
                <p className="text-muted-foreground leading-relaxed max-w-md mx-auto">
                  Help us create meaningful music for communities, ministries, and churches worldwide. 
                  Every contribution supports hope, healing, and inspiration through custom songs.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-6 py-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-black text-xl">🎵</span>
                  </div>
                  <span className="text-sm text-muted-foreground font-medium">Free Songs</span>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-black text-xl">🌍</span>
                  </div>
                  <span className="text-sm text-muted-foreground font-medium">Global Reach</span>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-black text-xl">⛪</span>
                  </div>
                  <span className="text-sm text-muted-foreground font-medium">Community</span>
                </div>
              </div>
            </div>
            
            <Button 
              size="lg" 
              className="bg-primary text-black font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border-0 w-full mt-6"
              asChild
            >
              <Link to="/donate">
                <Heart className="w-5 h-5 mr-2" />
                Donate Now
              </Link>
            </Button>
          </div>

          {/* Referral Bonus Section */}
          {user && (
            <div className="relative bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 h-full flex flex-col">
              <div className="text-center space-y-6 flex-grow">
                <div className="flex items-center justify-center mb-6">
                  <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-lg">
                    <DollarSign className="w-8 h-8 text-black" />
                  </div>
                </div>
                
                <div className="space-y-4 flex-grow">
                  <h3 className="text-2xl font-playfair font-bold text-foreground">
                    Earn Referral Bonus
                  </h3>
                  
                  <h4 className="text-lg text-primary font-semibold">
                    Share & Earn Commissions
                  </h4>
                  
                  <p className="text-muted-foreground leading-relaxed max-w-md mx-auto">
                    Invite friends to Zamar and earn commission on their purchases. 
                    Share the gift of custom music while building your income.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-6 py-6">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-3">
                      <TrendingUp className="w-6 h-6 text-black" />
                    </div>
                    <div className="space-y-1">
                      <div className="text-2xl font-bold text-primary">15%</div>
                      <span className="text-sm text-muted-foreground font-medium">Direct Referrals</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-3">
                      <Users className="w-6 h-6 text-black" />
                    </div>
                    <div className="space-y-1">
                      <div className="text-2xl font-bold text-primary">10%</div>
                      <span className="text-sm text-muted-foreground font-medium">Indirect Referrals</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
                    <div className="flex items-center justify-between gap-3">
                      <code className="text-sm font-mono text-foreground/80 truncate">
                        zamarsongs.com/auth?ref={referralCode}
                      </code>
                      <Button onClick={copyReferralLink} size="sm" variant="outline" className="shrink-0 border-primary/30 text-primary hover:bg-primary/10">
                        <Copy className="w-4 h-4 text-primary" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              
              <Button 
                size="lg" 
                className="bg-primary text-black font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border-0 w-full mt-6"
                asChild
              >
                <Link to="/referrals">
                  <ExternalLink className="w-5 h-5 mr-2" />
                  View Dashboard
                </Link>
              </Button>
            </div>
          )}

          {/* Guest Referral Section */}
          {!user && (
            <div className="relative bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 h-full flex flex-col">
              <div className="text-center space-y-6 flex-grow">
                <div className="flex items-center justify-center mb-6">
                  <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-lg">
                    <DollarSign className="w-8 h-8 text-black" />
                  </div>
                </div>
                
                <div className="space-y-4 flex-grow">
                  <h3 className="text-2xl font-playfair font-bold text-foreground">
                    Earn Referral Bonus
                  </h3>
                  
                  <h4 className="text-lg text-primary font-semibold">
                    Join & Start Earning
                  </h4>
                  
                  <p className="text-muted-foreground leading-relaxed max-w-md mx-auto">
                    Create an account to get your referral link and start earning commission 
                    on every friend who purchases custom songs through your link.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-6 py-6">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-3">
                      <TrendingUp className="w-6 h-6 text-black" />
                    </div>
                    <div className="space-y-1">
                      <div className="text-2xl font-bold text-primary">15%</div>
                      <span className="text-sm text-muted-foreground font-medium">Direct Referrals</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-3">
                      <Users className="w-6 h-6 text-black" />
                    </div>
                    <div className="space-y-1">
                      <div className="text-2xl font-bold text-primary">10%</div>
                      <span className="text-sm text-muted-foreground font-medium">Indirect Referrals</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <Button 
                size="lg" 
                className="bg-primary text-black font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border-0 w-full mt-6"
                asChild
              >
                <Link to="/auth">
                  <ExternalLink className="w-5 h-5 mr-2" />
                  Join & Earn
                </Link>
              </Button>
            </div>
          )}
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
