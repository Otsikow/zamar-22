import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Play, Star, Users, Clock, Settings, Radio, Heart, ExternalLink, Copy, DollarSign, TrendingUp, Calculator } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/contexts/TranslationContext";
import { supabase } from "@/integrations/supabase/client";
import heroImage from "@/assets/hero-music.jpg";
import LiveCounter from "./LiveCounter";
import { useToast } from "@/hooks/use-toast";
import { addWWWToReferralLink } from "@/lib/utils";

const Hero = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
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
    const referralLink = addWWWToReferralLink(`https://zamarsongs.com/auth?ref=${referralCode}`);
    navigator.clipboard.writeText(referralLink);
    toast({
      title: "Link copied!",
      description: "Your referral link has been copied to clipboard"
    });
  };
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-hero pt-16 sm:pt-20 pb-28 safe-bottom">
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
      <div className="relative z-10 container-responsive text-center">
        {/* Main Headline */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-playfair font-bold text-foreground mb-6 leading-tight">
          {t('hero.title_line1', 'Your Story, Your Song')}
          <br />
          <span className="text-transparent bg-gradient-primary bg-clip-text">
            {t('hero.title_line2', 'Crafted with Purpose')}
          </span>
        </h1>

        {/* Subheadline */}
        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8 font-inter leading-relaxed">
          {t('hero.subtitle', 'Zamar creates custom songs for every occasion – weddings, birthdays, churches, businesses – combining faith and technology to deliver powerful music that speaks.')}
        </p>

        {/* Stats Row */}
        <div className="flex flex-wrap justify-center items-center gap-6 mb-10 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-primary" />
            <span>{t('hero.stat1', '500+ Happy Clients')}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            <span>{t('hero.stat2', '24-48hr Delivery')}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            <span>{t('hero.stat3', 'Faith-Based Platform')}</span>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
          <Button size="lg" variant="hero" className="text-base sm:text-lg px-5 py-3 sm:px-6 sm:py-3.5 sm:min-w-[200px]" asChild>
            <Link to="/pricing">
              {t('hero.create_song', 'Create Your Song')}
            </Link>
          </Button>
          <Button size="lg" variant="outline" className="text-base sm:text-lg px-5 py-3 sm:px-6 sm:py-3.5 sm:min-w-[200px] group" asChild>
            <Link to="/songs">
              <Play className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
              {t('hero.see_examples', 'See Examples')}
            </Link>
          </Button>
          <Button size="lg" variant="outline" className="text-base sm:text-lg px-5 py-3 sm:px-6 sm:py-3.5 sm:min-w-[200px] group" asChild>
            <Link to="/radio">
              <Radio className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
              {t('hero.radio', 'Radio')}
            </Link>
          </Button>
          {isAdmin && (
            <Button size="lg" variant="secondary" className="text-base sm:text-lg px-5 py-3 sm:px-6 sm:py-3.5 sm:min-w-[200px] bg-primary/20 border-primary/30 text-primary hover:bg-primary/30" asChild>
             <Link to="/admin">
                <Settings className="w-5 h-5 mr-2" />
                {t('nav.dashboard', 'Dashboard')}
              </Link>
            </Button>
          )}
        </div>

        {/* Two Column Layout for Cards */}
        <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 mb-12 mx-auto">
          {/* Support Our Mission Section */}
          <div className="relative bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-4 sm:p-6 lg:p-8 shadow-lg hover:shadow-xl transition-all duration-300 h-full flex flex-col">
            <div className="text-center space-y-6 flex-grow">
              <div className="flex items-center justify-center mb-6">
                <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-primary rounded-2xl flex items-center justify-center shadow-lg">
                  <Heart className="w-8 h-8 text-black" />
                </div>
              </div>
              
              <div className="space-y-4 flex-grow">
                <h3 className="text-xl sm:text-2xl font-playfair font-bold text-foreground">
                  {t('hero.support_mission', 'Support Our Mission')}
                </h3>
                
                <h4 className="text-base sm:text-lg text-primary font-semibold">
                  {t('hero.empowering_communities', 'Empowering Communities Through Music')}
                </h4>
                
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-md mx-auto">
                  {t('hero.support_description', 'Help us create meaningful music for communities, ministries, and churches worldwide. Every contribution supports hope, healing, and inspiration through custom songs.')}
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6 py-4 sm:py-6">
                <div className="text-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-black text-lg sm:text-xl">🎵</span>
                  </div>
                  <span className="text-sm text-muted-foreground font-medium">{t('hero.free_songs', 'Free Songs')}</span>
                </div>
                <div className="text-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-black text-lg sm:text-xl">🌍</span>
                  </div>
                  <span className="text-sm text-muted-foreground font-medium">{t('hero.global_reach', 'Global Reach')}</span>
                </div>
                <div className="text-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-black text-lg sm:text-xl">⛪</span>
                  </div>
                  <span className="text-sm text-muted-foreground font-medium">{t('hero.community', 'Community')}</span>
                </div>
              </div>
            </div>
            
            <Button 
            size="lg" 
              className="bg-primary text-black font-semibold text-sm sm:text-base px-5 py-3 sm:px-6 sm:py-3.5 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border-0 w-full mt-6"
              asChild
            >
              <Link to="/donate">
                <Heart className="w-5 h-5 mr-2" />
                {t('hero.donate_now', 'Donate Now')}
              </Link>
            </Button>
          </div>

          {/* Referral Bonus Section */}
          {user && (
            <div className="relative bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-4 sm:p-6 lg:p-8 shadow-lg hover:shadow-xl transition-all duration-300 h-full flex flex-col">
              <div className="text-center space-y-6 flex-grow">
                <div className="flex items-center justify-center mb-6">
              <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-primary rounded-2xl flex items-center justify-center shadow-lg">
                    <DollarSign className="w-8 h-8 text-black" />
                  </div>
                </div>
                
                <div className="space-y-4 flex-grow">
                <h3 className="text-xl sm:text-2xl font-playfair font-bold text-foreground">
                  {t('hero.earn_referral', 'Earn Referral Bonus')}
                </h3>
                  
                <h4 className="text-base sm:text-lg text-primary font-semibold">
                  {t('hero.share_earn', 'Share & Earn Commissions')}
                </h4>
                  
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-md mx-auto">
                  {t('hero.referral_description', 'Invite friends to Zamar and earn commission on their purchases. Share the gift of custom music while building your income.')}
                </p>
              </div>

                <div className="grid grid-cols-2 gap-4 sm:gap-6 py-4 sm:py-6">
                  <div className="text-center">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-3">
                      <TrendingUp className="w-6 h-6 text-black" />
                    </div>
                    <div className="space-y-1">
                      <div className="text-xl sm:text-2xl font-bold text-primary">15%</div>
                      <span className="text-sm text-muted-foreground font-medium">{t('hero.direct_referrals', 'Direct Referrals')}</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-3">
                      <Users className="w-6 h-6 text-black" />
                    </div>
                    <div className="space-y-1">
                      <div className="text-xl sm:text-2xl font-bold text-primary">10%</div>
                      <span className="text-sm text-muted-foreground font-medium">{t('hero.indirect_referrals', 'Indirect Referrals')}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-muted/30 rounded-lg p-3 sm:p-4 border border-border/50">
                    <div className="flex items-center justify-between gap-3">
                      <code className="text-xs sm:text-sm font-mono text-foreground/80 truncate">
                        www.zamarsongs.com/auth?ref={referralCode}
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
              className="bg-primary text-black font-semibold text-sm sm:text-base px-5 py-3 sm:px-6 sm:py-3.5 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border-0 w-full mt-6"
                asChild
              >
                <Link to="/referrals">
                  <Calculator className="w-5 h-5 mr-2" />
                  {t('hero.calculate_earnings', 'Calculate Your Earnings')}
                </Link>
              </Button>
            </div>
          )}

          {/* Guest Referral Section */}
          {!user && (
            <div className="relative bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-4 sm:p-6 lg:p-8 shadow-lg hover:shadow-xl transition-all duration-300 h-full flex flex-col">
              <div className="text-center space-y-6 flex-grow">
                <div className="flex items-center justify-center mb-6">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-primary rounded-2xl flex items-center justify-center shadow-lg">
                    <DollarSign className="w-8 h-8 text-black" />
                  </div>
                </div>
                
                <div className="space-y-4 flex-grow">
                <h3 className="text-xl sm:text-2xl font-playfair font-bold text-foreground">
                  {t('hero.earn_referral', 'Earn Referral Bonus')}
                </h3>
                  
                <h4 className="text-base sm:text-lg text-primary font-semibold">
                  {t('hero.join_start_earning', 'Join & Start Earning')}
                </h4>
                  
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-md mx-auto">
                  {t('hero.guest_referral_description', 'Create an account to get your referral link and start earning commission on every friend who purchases custom songs through your link.')}
                </p>
              </div>

                <div className="grid grid-cols-2 gap-4 sm:gap-6 py-4 sm:py-6">
                  <div className="text-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-3">
                      <TrendingUp className="w-6 h-6 text-black" />
                    </div>
                    <div className="space-y-1">
                      <div className="text-xl sm:text-2xl font-bold text-primary">15%</div>
                      <span className="text-sm text-muted-foreground font-medium">{t('hero.direct_referrals', 'Direct Referrals')}</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-3">
                      <Users className="w-6 h-6 text-black" />
                    </div>
                    <div className="space-y-1">
                      <div className="text-xl sm:text-2xl font-bold text-primary">10%</div>
                      <span className="text-sm text-muted-foreground font-medium">{t('hero.indirect_referrals', 'Indirect Referrals')}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <Button 
            size="lg" 
              className="bg-primary text-black font-semibold text-sm sm:text-base px-5 py-3 sm:px-6 sm:py-3.5 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border-0 w-full mt-6"
                asChild
              >
                <Link to="/auth">
                  <ExternalLink className="w-5 h-5 mr-2" />
                  {t('hero.join_earn', 'Join & Earn')}
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
