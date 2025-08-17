import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import HeroSection from "@/components/HeroSection";
import FeaturedSongs from "@/components/sections/FeaturedSongs";
import CommunityTestimonies from "@/components/sections/CommunityTestimonies";
import LiveCounter from "@/components/sections/LiveCounter";
import Footer from "@/components/sections/Footer";
import VideoShowcase from "@/components/sections/VideoShowcase";
import heroImage from "@/assets/hero-music.jpg";
import WelcomeBanner from "@/components/auth/WelcomeBanner";
import AdGrid from "@/components/ads/AdGrid";
import { SuggestSongModal } from "@/components/modals/SuggestSongModal";
import { AuthRequiredSheet } from "@/components/modals/AuthRequiredSheet";
import { UpgradeSheet } from "@/components/modals/UpgradeSheet";
const Index = () => {
  const { user } = useAuth();
  const [showSuggestModal, setShowSuggestModal] = useState(false);
  const [showAuthSheet, setShowAuthSheet] = useState(false);
  const [showUpgradeSheet, setShowUpgradeSheet] = useState(false);

  const handleSuggestClick = () => {
    if (!user) {
      setShowAuthSheet(true);
      return;
    }

    // For now, we'll assume all authenticated users can suggest
    // In a real app, you'd check membership_tier here
    const isSupporter = true; // user.membership_tier === 'supporter' || user.role === 'admin'
    
    if (!isSupporter) {
      setShowUpgradeSheet(true);
    } else {
      setShowSuggestModal(true);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-background">
        <main className="pb-20">
          <HeroSection 
            bgImageUrl={heroImage}
            onSuggestClick={handleSuggestClick}
          />
          <WelcomeBanner />
          <AdGrid placement="home_hero" limit={8} className="container mx-auto my-6" title="Sponsored Spotlights" />
          <FeaturedSongs />
          <CommunityTestimonies />
          <LiveCounter />
          <VideoShowcase />
        </main>
        <Footer />
      </div>

      <SuggestSongModal 
        open={showSuggestModal} 
        onOpenChange={setShowSuggestModal}
      />
      <AuthRequiredSheet 
        open={showAuthSheet} 
        onOpenChange={setShowAuthSheet}
      />
      <UpgradeSheet 
        open={showUpgradeSheet} 
        onOpenChange={setShowUpgradeSheet}
      />
    </>
  );
};

export default Index;
